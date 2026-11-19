import {
  LedgerType,
  OrderStatus,
  Prisma,
  PrismaClient,
  TopUpStatus,
  type MenuItem,
} from '@prisma/client';
import { CREDIT_VND } from '@schoolcoin/types';
import { randomUUID } from 'node:crypto';
import { startOfVnDay } from '../../src/common/utils/vn-day';
import type { SeededStudent } from './students.seed';
import type { SeededUsers } from './users.seed';

interface SeedContext {
  users: SeededUsers;
  students: SeededStudent[];
  menu: MenuItem[];
}

const DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Deterministic PRNG so every reset produces the same history. */
function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 2 ** 32;
    return s / 2 ** 32;
  };
}

/**
 * B10: past orders and top-ups so the reports have data. Writes orders, top-ups and ledger entries
 * with a running balance, then sets the wallet balance to the final value, so balance == ledger sum.
 * Today is left empty so the demo starts with a full daily allowance.
 */
export async function seedHistory(prisma: PrismaClient, { users, students, menu }: SeedContext) {
  const rand = rng(2026);
  const pick = <T>(arr: T[]) => arr[Math.floor(rand() * arr.length)];
  const cashiers = [users.cashier1, users.cashier2];
  const today = startOfVnDay();
  let paymentSeq = 10_000_000;

  for (const { student, card, walletId } of students) {
    if ((await prisma.ledgerEntry.count({ where: { walletId } })) > 0) continue;

    const parentLink = await prisma.parentStudent.findFirst({ where: { studentId: student.id } });
    const entries: Prisma.LedgerEntryCreateManyInput[] = [];
    let balance = 0;

    await prisma.$transaction(async (tx) => {
      for (let d = DAYS; d >= 1; d--) {
        const dayStart = new Date(today.getTime() - d * DAY_MS);
        const at = (hour: number, minute = 0) =>
          new Date(dayStart.getTime() + (hour * 60 + minute) * 60_000);

        // Top up every Monday-ish (every 7 days) and when running low.
        if (d % 7 === 0 || balance < 40) {
          const amount = pick([100, 200, 200, 500]);
          const createdAt = at(7, 30);
          let refId: string;
          let type: LedgerType;
          if (parentLink) {
            const topUp = await tx.topUp.create({
              data: {
                studentId: student.id,
                parentId: parentLink.parentId,
                amountCredits: amount,
                amountVnd: amount * CREDIT_VND,
                paymentCode: `SC${paymentSeq++}`,
                status: TopUpStatus.PAID,
                expiresAt: new Date(createdAt.getTime() + 30 * 60_000),
                paidAt: new Date(createdAt.getTime() + 2 * 60_000),
                createdAt,
              },
            });
            refId = topUp.id;
            type = LedgerType.TOPUP_SEPAY;
          } else {
            refId = randomUUID(); // cash top-up receipt
            type = LedgerType.TOPUP_CASH;
          }
          balance += amount;
          entries.push({
            walletId,
            type,
            amountCredits: amount,
            balanceAfter: balance,
            refType: 'TOP_UP',
            refId,
            actorId: parentLink ? null : users.accountant.id,
            note: parentLink ? null : 'Nạp tiền mặt tại văn phòng',
            createdAt: new Date(createdAt.getTime() + 2 * 60_000),
          });
        }

        // Skip weekends (no school).
        const weekday = new Date(dayStart.getTime() + 7 * 60 * 60 * 1000).getUTCDay();
        if (weekday === 0 || weekday === 6) continue;

        // One or two orders per school day.
        const orderCount = rand() < 0.4 ? 2 : 1;
        for (let o = 0; o < orderCount; o++) {
          const lines = Array.from({ length: rand() < 0.5 ? 1 : 2 }, () => ({
            item: pick(menu),
            quantity: 1,
          }));
          const total = lines.reduce((sum, l) => sum + l.item.priceCredits * l.quantity, 0);
          if (total > balance) continue;
          const createdAt = at(o === 0 ? 9 : 11, Math.floor(rand() * 50));
          const order = await tx.order.create({
            data: {
              studentId: student.id,
              cardId: card.id,
              cashierId: pick(cashiers).id,
              totalCredits: total,
              status: OrderStatus.COMPLETED,
              pinVerified: total > 50,
              idempotencyKey: randomUUID(),
              createdAt,
              items: {
                create: lines.map((l) => ({
                  menuItemId: l.item.id,
                  nameSnapshot: l.item.name,
                  unitPriceCredits: l.item.priceCredits,
                  quantity: l.quantity,
                })),
              },
            },
          });
          balance -= total;
          entries.push({
            walletId,
            type: LedgerType.PURCHASE,
            amountCredits: -total,
            balanceAfter: balance,
            refType: 'ORDER',
            refId: order.id,
            actorId: order.cashierId,
            createdAt,
          });
        }
      }

      await tx.ledgerEntry.createMany({ data: entries });
      await tx.wallet.update({ where: { id: walletId }, data: { balanceCredits: balance } });
    });
  }
}
