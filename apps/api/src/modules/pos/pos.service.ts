import { CardStatus, LedgerType, OrderStatus, Prisma, type PrismaClient } from '@prisma/client';
import {
  can,
  type CreateOrderDto,
  type CreateOrderResult,
  type MenuCategoryWithItems,
  type Order,
  type PosLookupResult,
} from '@schoolcoin/types';
import {
  ensureFound,
  forbidden,
  isUniqueViolation,
  notFound,
  ruleViolation,
} from '../../common/errors/http-errors';
import type { AuthUser } from '../../common/http/auth';
import { startOfVnDay, vnToday } from '../../common/utils/vn-day';
import { prisma } from '../../prisma';
import {
  notificationsService,
  type NotificationsService,
} from '../notifications/notifications.service';
import { settingsService, type SettingsService } from '../settings/settings.service';
import { verifyStudentPin } from '../students/student-pin';
import { walletService, type WalletService } from '../wallet/wallet.service';

const orderInclude = {
  student: { select: { fullName: true, className: true } },
  cashier: { select: { fullName: true } },
  items: { orderBy: { createdAt: 'asc' } },
} satisfies Prisma.OrderInclude;

type OrderRow = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

interface Limited {
  dailyLimitCredits: number | null;
}

/** BE-2 — lookup, charge, void (FR-POS-01…08, UC-08, UC-09, B5). */
export class PosService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly wallets: WalletService,
    private readonly settings: SettingsService,
    private readonly notifications: NotificationsService,
  ) {}

  /** FR-POS-01: categories with the items that can be sold today. */
  async menu(now: Date = new Date()): Promise<MenuCategoryWithItems[]> {
    const categories = await this.prisma.menuCategory.findMany({
      where: { archived: false },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      include: {
        items: {
          where: {
            available: true,
            archived: false,
            OR: [{ soldOutDate: null }, { soldOutDate: { not: vnToday(now) } }],
          },
          orderBy: { name: 'asc' },
        },
      },
    });
    return categories
      .filter((c) => c.items.length > 0)
      .map((c) => ({
        id: c.id,
        name: c.name,
        sortOrder: c.sortOrder,
        archived: c.archived,
        items: c.items.map((i) => ({
          id: i.id,
          categoryId: i.categoryId,
          name: i.name,
          priceCredits: i.priceCredits,
          imageUrl: i.imageUrl,
          available: i.available,
          soldOutDate: i.soldOutDate?.toISOString().slice(0, 10) ?? null,
          archived: i.archived,
        })),
      }));
  }

  /** FR-POS-04, NFR-PRV-02: only what the cashier needs to check the card holder. */
  async lookup(cardCode: string, now: Date = new Date()): Promise<PosLookupResult> {
    const { student } = await this.activeCard(cardCode);
    const wallet = ensureFound(
      await this.prisma.wallet.findUnique({ where: { studentId: student.id } }),
      'Wallet',
    );
    return {
      studentId: student.id,
      fullName: student.fullName,
      className: student.className,
      photoUrl: student.photoUrl,
      balance: wallet.balanceCredits,
      remainingToday: await this.remainingToday(this.prisma, student, wallet.id, now),
      pinThreshold: await this.settings.pinThreshold(),
      pinLocked: !!student.pinLockedUntil && student.pinLockedUntil > now,
    };
  }

  /** FR-POS-05/06, B5: charge a cart to the student's wallet, at most once per idempotencyKey. */
  async charge(cashierId: string, dto: CreateOrderDto): Promise<CreateOrderResult> {
    const existing = await this.prisma.order.findUnique({
      where: { idempotencyKey: dto.idempotencyKey },
      include: orderInclude,
    });
    if (existing) return this.replay(existing);

    const { card, student } = await this.activeCard(dto.cardCode);
    const lines = await this.priceLines(dto.items);
    const total = lines.reduce((sum, l) => sum + l.unitPriceCredits * l.quantity, 0);

    const pinRequired = total > (await this.settings.pinThreshold());
    if (pinRequired) {
      if (!dto.pin) throw ruleViolation('PIN_REQUIRED', 'This order needs the student PIN');
      await verifyStudentPin(this.prisma, student.id, dto.pin);
    }

    let result: { order: OrderRow; balanceAfter: number; remainingToday: number | null };
    try {
      result = await this.prisma.$transaction(async (tx) => {
        const wallet = await this.wallets.lockWallet(tx, student.id);

        const remaining = await this.remainingToday(tx, student, wallet.id);
        if (remaining !== null && total > remaining) {
          throw ruleViolation('DAILY_LIMIT_REACHED', 'Daily limit reached', {
            remainingToday: remaining,
            total,
            dailyLimit: student.dailyLimitCredits,
          });
        }

        const order = await tx.order.create({
          data: {
            studentId: student.id,
            cardId: card.id,
            cashierId,
            totalCredits: total,
            pinVerified: pinRequired,
            idempotencyKey: dto.idempotencyKey,
            items: { create: lines },
          },
          include: orderInclude,
        });
        const { balanceAfter } = await this.wallets.debit(tx, {
          studentId: student.id,
          amountCredits: total,
          type: LedgerType.PURCHASE,
          refType: 'ORDER',
          refId: order.id,
          actorId: cashierId,
        });
        return {
          order,
          balanceAfter,
          remainingToday: remaining === null ? null : remaining - total,
        };
      });
    } catch (err) {
      // Two retries raced past the first check: the other one charged, return its order.
      if (isUniqueViolation(err, 'idempotencyKey')) {
        return this.replay(
          await this.prisma.order.findUniqueOrThrow({
            where: { idempotencyKey: dto.idempotencyKey },
            include: orderInclude,
          }),
        );
      }
      throw err;
    }

    await this.alertLowBalance(student.id, result.balanceAfter);
    return { ...result, order: toOrder(result.order) };
  }

  /** FR-POS-08: today's orders; a cashier sees only their own. */
  async today(user: AuthUser, now: Date = new Date()): Promise<Order[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startOfVnDay(now) },
        ...(can(user.role, 'VOID_ANY_ORDER') ? {} : { cashierId: user.id }),
      },
      orderBy: { createdAt: 'desc' },
      include: orderInclude,
    });
    return orders.map(toOrder);
  }

  /** FR-POS-07, BR-10: same-day void with a reversal; cashiers only their own orders. */
  async void(user: AuthUser, id: string, reason: string, now: Date = new Date()): Promise<Order> {
    const { order, balanceAfter } = await this.prisma.$transaction(async (tx) => {
      const found = ensureFound(await tx.order.findUnique({ where: { id } }), 'Order');
      if (found.cashierId !== user.id && !can(user.role, 'VOID_ANY_ORDER')) {
        throw forbidden('You can only void your own orders');
      }
      if (found.status === OrderStatus.VOIDED) {
        throw ruleViolation('ORDER_ALREADY_VOIDED', 'This order is already voided');
      }
      if (found.createdAt < startOfVnDay(now)) {
        throw ruleViolation('VOID_NOT_ALLOWED', 'Only orders from today can be voided (BR-10)');
      }

      // Conditional on COMPLETED, so of two concurrent voids only one goes through.
      const { count } = await tx.order.updateMany({
        where: { id, status: OrderStatus.COMPLETED },
        data: {
          status: OrderStatus.VOIDED,
          voidedAt: now,
          voidedById: user.id,
          voidReason: reason,
        },
      });
      if (count === 0) throw ruleViolation('ORDER_ALREADY_VOIDED', 'This order is already voided');

      const moved = await this.wallets.credit(tx, {
        studentId: found.studentId,
        amountCredits: found.totalCredits,
        type: LedgerType.VOID_REVERSAL,
        refType: 'ORDER',
        refId: id,
        actorId: user.id,
        note: reason,
      });
      const order = await tx.order.findUniqueOrThrow({ where: { id }, include: orderInclude });
      return { order, balanceAfter: moved.balanceAfter };
    });

    await this.alertLowBalance(order.studentId, balanceAfter);
    return toOrder(order);
  }

  private async activeCard(code: string) {
    const card = await this.prisma.card.findUnique({ where: { code }, include: { student: true } });
    if (!card) throw notFound('Card');
    if (card.status !== CardStatus.ACTIVE || !card.student.active) {
      throw ruleViolation('CARD_INACTIVE', 'This card cannot be used');
    }
    return { card, student: card.student };
  }

  /** ITEM_UNAVAILABLE unless every line is on sale today; prices are copied (BR-13). */
  private async priceLines(items: CreateOrderDto['items']) {
    const today = vnToday();
    const found = await this.prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) } },
      include: { category: { select: { archived: true } } },
    });
    const onSale = new Map(
      found
        .filter(
          (m) =>
            m.available &&
            !m.archived &&
            !m.category.archived &&
            m.soldOutDate?.getTime() !== today.getTime(),
        )
        .map((m) => [m.id, m]),
    );
    const missing = [...new Set(items.map((i) => i.menuItemId).filter((id) => !onSale.has(id)))];
    if (missing.length > 0) {
      throw ruleViolation('ITEM_UNAVAILABLE', 'Some items are not available', {
        menuItemIds: missing,
      });
    }
    return items.map((i) => {
      const item = onSale.get(i.menuItemId)!;
      return {
        menuItemId: item.id,
        nameSnapshot: item.name,
        unitPriceCredits: item.priceCredits,
        quantity: i.quantity,
      };
    });
  }

  /** BR-04: what the student may still spend today, or null without a daily limit. */
  private async remainingToday(
    tx: Prisma.TransactionClient,
    student: Limited,
    walletId: string,
    now: Date = new Date(),
  ): Promise<number | null> {
    if (student.dailyLimitCredits === null) return null;
    const spent = await this.wallets.todaySpent(tx, walletId, now);
    return Math.max(0, student.dailyLimitCredits - spent);
  }

  private async replay(order: OrderRow): Promise<CreateOrderResult> {
    const student = await this.prisma.student.findUniqueOrThrow({
      where: { id: order.studentId },
      include: { wallet: true },
    });
    const wallet = ensureFound(student.wallet, 'Wallet');
    return {
      order: toOrder(order),
      balanceAfter: wallet.balanceCredits,
      remainingToday: await this.remainingToday(this.prisma, student, wallet.id),
    };
  }

  /** After commit: an alert failure must not turn a successful charge into an error. */
  private async alertLowBalance(studentId: string, balance: number) {
    await this.notifications.checkLowBalance(studentId, balance).catch((err: unknown) => {
      console.error('Low-balance alert failed', err);
    });
  }
}

function toOrder(row: OrderRow): Order {
  return {
    id: row.id,
    studentId: row.studentId,
    studentName: row.student.fullName,
    className: row.student.className,
    cardId: row.cardId,
    cashierId: row.cashierId,
    cashierName: row.cashier.fullName,
    totalCredits: row.totalCredits,
    status: row.status,
    pinVerified: row.pinVerified,
    idempotencyKey: row.idempotencyKey,
    voidedAt: row.voidedAt?.toISOString() ?? null,
    voidedById: row.voidedById,
    voidReason: row.voidReason,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((i) => ({
      id: i.id,
      orderId: i.orderId,
      menuItemId: i.menuItemId,
      nameSnapshot: i.nameSnapshot,
      unitPriceCredits: i.unitPriceCredits,
      quantity: i.quantity,
    })),
  };
}

export const posService = new PosService(
  prisma,
  walletService,
  settingsService,
  notificationsService,
);
