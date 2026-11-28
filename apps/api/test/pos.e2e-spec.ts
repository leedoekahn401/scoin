import { CardStatus, LedgerType, Role } from '@prisma/client';
import { PIN_MAX_ATTEMPTS } from '@schoolcoin/types';
import { randomUUID } from 'node:crypto';
import { AppError } from '../src/common/errors/app-error';
import type { AuthUser } from '../src/common/http/auth';
import { hashSecret } from '../src/common/utils/hash';
import { vnToday } from '../src/common/utils/vn-day';
import { posService as pos } from '../src/modules/pos/pos.service';
import { walletService as wallets } from '../src/modules/wallet/wallet.service';
import { prisma } from '../src/prisma';

// UC-08 / UC-09 and B5 against the e2e database. The PIN threshold is the seeded 50 credits.
describe('POS (UC-08, UC-09)', () => {
  let cashier: AuthUser;
  let otherCashier: AuthUser;
  let manager: AuthUser;
  let rice: string; // 30 credits
  let water: string; // 5 credits
  let pinHash: string;

  beforeAll(async () => {
    pinHash = await hashSecret('1234');
    const staff = async (role: Role): Promise<AuthUser> => {
      const u = await prisma.user.create({
        data: { role, username: `u${randomUUID()}`, fullName: `Staff ${role}`, passwordHash: 'x' },
      });
      return { id: u.id, email: '', role };
    };
    cashier = await staff(Role.CASHIER);
    otherCashier = await staff(Role.CASHIER);
    manager = await staff(Role.CAFE_MANAGER);

    const category = await prisma.menuCategory.create({
      data: { name: `POS test ${randomUUID()}` },
    });
    const item = (name: string, priceCredits: number) =>
      prisma.menuItem.create({ data: { categoryId: category.id, name, priceCredits } });
    rice = (await item('Cơm gà', 30)).id;
    water = (await item('Nước suối', 5)).id;
  });

  afterAll(() => prisma.$disconnect());

  async function newStudent(
    opts: { balance?: number; dailyLimit?: number; lowBalance?: number } = {},
  ) {
    const student = await prisma.student.create({
      data: {
        studentCode: `T${randomUUID().slice(0, 8)}`,
        fullName: 'Học sinh thử',
        className: '6A',
        pinHash,
        dailyLimitCredits: opts.dailyLimit ?? null,
        lowBalanceThreshold: opts.lowBalance ?? null,
        wallet: { create: {} },
      },
    });
    const card = await prisma.card.create({
      data: { studentId: student.id, code: `C${randomUUID()}`, issuedById: manager.id },
    });
    if (opts.balance) {
      await prisma.$transaction((tx) =>
        wallets.credit(tx, {
          studentId: student.id,
          amountCredits: opts.balance!,
          type: LedgerType.TOPUP_CASH,
          refType: 'TOP_UP',
          refId: randomUUID(),
        }),
      );
    }
    return { studentId: student.id, cardCode: card.code, cardId: card.id };
  }

  const cart = (cardCode: string, lines: [string, number][], pin?: string) => ({
    cardCode,
    items: lines.map(([menuItemId, quantity]) => ({ menuItemId, quantity })),
    pin,
    idempotencyKey: randomUUID(),
  });

  async function balance(studentId: string) {
    return (await prisma.wallet.findUniqueOrThrow({ where: { studentId } })).balanceCredits;
  }

  async function rejects(promise: Promise<unknown>, code: string) {
    const err = await promise.then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
    return err as AppError;
  }

  describe('menu and lookup', () => {
    it('hides items sold out today', async () => {
      const soldOut = await prisma.menuItem.create({
        data: {
          categoryId: (await prisma.menuItem.findUniqueOrThrow({ where: { id: rice } })).categoryId,
          name: 'Hết hàng',
          priceCredits: 10,
          soldOutDate: vnToday(),
        },
      });
      const ids = (await pos.menu()).flatMap((c) => c.items.map((i) => i.id));
      expect(ids).toEqual(expect.arrayContaining([rice, water]));
      expect(ids).not.toContain(soldOut.id);
      await rejects(
        pos.charge(
          cashier.id,
          cart((await newStudent({ balance: 50 })).cardCode, [[soldOut.id, 1]]),
        ),
        'ITEM_UNAVAILABLE',
      );
    });

    it('shows balance and what is left of the daily limit', async () => {
      const s = await newStudent({ balance: 100, dailyLimit: 40 });
      await pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]]));
      expect(await pos.lookup(s.cardCode)).toMatchObject({
        studentId: s.studentId,
        balance: 70,
        remainingToday: 10,
        pinThreshold: 50,
        pinLocked: false,
      });
    });

    it('refuses a locked card', async () => {
      const s = await newStudent({ balance: 100 });
      await prisma.card.update({ where: { id: s.cardId }, data: { status: CardStatus.LOCKED } });
      await rejects(pos.lookup(s.cardCode), 'CARD_INACTIVE');
      await rejects(pos.charge(cashier.id, cart(s.cardCode, [[water, 1]])), 'CARD_INACTIVE');
    });
  });

  describe('charge', () => {
    it('debits the wallet, snapshots prices and posts one PURCHASE', async () => {
      const s = await newStudent({ balance: 100 });
      const res = await pos.charge(
        cashier.id,
        cart(s.cardCode, [
          [rice, 1],
          [water, 2],
        ]),
      );

      expect(res.balanceAfter).toBe(60);
      expect(res.order).toMatchObject({
        totalCredits: 40,
        status: 'COMPLETED',
        pinVerified: false,
      });
      expect(res.order.items.map((i) => [i.nameSnapshot, i.unitPriceCredits, i.quantity])).toEqual([
        ['Cơm gà', 30, 1],
        ['Nước suối', 5, 2],
      ]);
      expect(await balance(s.studentId)).toBe(60);
      expect(
        await prisma.ledgerTransaction.count({ where: { refId: res.order.id, type: 'PURCHASE' } }),
      ).toBe(1);
    });

    it('declines a low balance and writes nothing', async () => {
      const s = await newStudent({ balance: 20 });
      const err = await rejects(
        pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]])),
        'INSUFFICIENT_BALANCE',
      );
      expect(err.details).toEqual({ balance: 20, total: 30 });
      expect(await prisma.order.count({ where: { studentId: s.studentId } })).toBe(0);
    });

    it('enforces the daily limit, counting voids back in (BR-04)', async () => {
      const s = await newStudent({ balance: 200, dailyLimit: 40 });
      const first = await pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]]));
      const err = await rejects(
        pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]])),
        'DAILY_LIMIT_REACHED',
      );
      expect(err.details).toEqual({ remainingToday: 10, total: 30, dailyLimit: 40 });

      await pos.void(cashier, first.order.id, 'Nhầm món');
      const again = await pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]]));
      expect(again.remainingToday).toBe(10);
    });

    it('charges once per idempotency key, also when retries race', async () => {
      const s = await newStudent({ balance: 100 });
      const dto = cart(s.cardCode, [[rice, 1]]);
      const [a, b] = await Promise.all([pos.charge(cashier.id, dto), pos.charge(cashier.id, dto)]);
      const c = await pos.charge(cashier.id, dto);

      expect(new Set([a.order.id, b.order.id, c.order.id]).size).toBe(1);
      expect(c.balanceAfter).toBe(70);
      expect(await balance(s.studentId)).toBe(70);
    });
  });

  describe('PIN (BR-05, BR-11)', () => {
    // A function: `rice` is only set once beforeAll has run.
    const big = (): [string, number][] => [[rice, 2]]; // 60 > 50

    it('needs the PIN above the threshold', async () => {
      const s = await newStudent({ balance: 100 });
      await rejects(pos.charge(cashier.id, cart(s.cardCode, big())), 'PIN_REQUIRED');
      const res = await pos.charge(cashier.id, cart(s.cardCode, big(), '1234'));
      expect(res.order.pinVerified).toBe(true);
    });

    it('counts wrong PINs across failed requests and locks on the 5th', async () => {
      const s = await newStudent({ balance: 100 });
      for (let left = PIN_MAX_ATTEMPTS - 1; left > 0; left--) {
        const err = await rejects(
          pos.charge(cashier.id, cart(s.cardCode, big(), '0000')),
          'PIN_INVALID',
        );
        expect(err.details).toEqual({ attemptsLeft: left });
      }
      await rejects(pos.charge(cashier.id, cart(s.cardCode, big(), '0000')), 'PIN_LOCKED');
      // Locked even with the right PIN.
      await rejects(pos.charge(cashier.id, cart(s.cardCode, big(), '1234')), 'PIN_LOCKED');
      expect((await pos.lookup(s.cardCode)).pinLocked).toBe(true);
      expect(await balance(s.studentId)).toBe(100);
    });
  });

  describe('void and today (FR-POS-07, FR-POS-08)', () => {
    it('returns the credits once; only the own cashier or a manager may void', async () => {
      const s = await newStudent({ balance: 100 });
      const { order } = await pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]]));

      await rejects(pos.void(otherCashier, order.id, 'x'), 'FORBIDDEN');
      const voided = await pos.void(cashier, order.id, 'Nhầm món');
      expect(voided).toMatchObject({
        status: 'VOIDED',
        voidReason: 'Nhầm món',
        voidedById: cashier.id,
      });
      expect(await balance(s.studentId)).toBe(100);
      await rejects(pos.void(manager, order.id, 'again'), 'ORDER_ALREADY_VOIDED');

      const other = await pos.charge(cashier.id, cart(s.cardCode, [[water, 1]]));
      await pos.void(manager, other.order.id, 'Quản lý hủy');
      expect(await balance(s.studentId)).toBe(100);
    });

    it('refuses a void after midnight (BR-10)', async () => {
      const s = await newStudent({ balance: 100 });
      const { order } = await pos.charge(cashier.id, cart(s.cardCode, [[water, 1]]));
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      await rejects(pos.void(cashier, order.id, 'late', tomorrow), 'VOID_NOT_ALLOWED');
    });

    it("lists a cashier's own orders, and everyone's for a manager", async () => {
      const s = await newStudent({ balance: 100 });
      const mine = await pos.charge(cashier.id, cart(s.cardCode, [[water, 1]]));
      const theirs = await pos.charge(otherCashier.id, cart(s.cardCode, [[water, 1]]));

      const own = (await pos.today(cashier)).map((o) => o.id);
      expect(own).toContain(mine.order.id);
      expect(own).not.toContain(theirs.order.id);
      expect((await pos.today(manager)).map((o) => o.id)).toEqual(
        expect.arrayContaining([mine.order.id, theirs.order.id]),
      );
    });
  });

  it('alerts the parents once when the balance drops below the threshold, re-arms after', async () => {
    const s = await newStudent({ balance: 50, lowBalance: 30 });
    const parent = await prisma.user.create({
      data: {
        role: Role.PARENT,
        email: `p${randomUUID()}@x.vn`,
        fullName: 'Phụ huynh',
        passwordHash: 'x',
      },
    });
    await prisma.parentStudent.create({ data: { parentId: parent.id, studentId: s.studentId } });
    const alerts = () =>
      prisma.notification.count({ where: { userId: parent.id, type: 'LOW_BALANCE' } });

    const first = await pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]])); // 20
    await pos.charge(cashier.id, cart(s.cardCode, [[water, 1]])); // 15
    expect(await alerts()).toBe(1);

    await pos.void(cashier, first.order.id, 'x'); // 45, re-armed
    await pos.charge(cashier.id, cart(s.cardCode, [[rice, 1]])); // 15
    expect(await alerts()).toBe(2);
  });

  // B11, NFR-REL-01: the wallet row lock serialises charges, so none sees a stale balance or spend.
  describe('20 parallel charges at one wallet', () => {
    it.each([
      { limit: 'balance', opts: { balance: 100 }, code: 'INSUFFICIENT_BALANCE', left: 0 },
      {
        limit: 'daily limit',
        opts: { balance: 200, dailyLimit: 50 },
        code: 'DAILY_LIMIT_REACHED',
        left: 150,
      },
    ])(
      'stop exactly at the $limit and keep balance == ledger sum',
      async ({ opts, code, left }) => {
        const s = await newStudent(opts);
        // 10 credits each: 10 fit in a balance of 100, 5 fit in a daily limit of 50.
        const results = await Promise.allSettled(
          Array.from({ length: 20 }, () => pos.charge(cashier.id, cart(s.cardCode, [[water, 2]]))),
        );

        const ok = results.filter((r) => r.status === 'fulfilled');
        const failed = results.filter((r) => r.status === 'rejected');
        expect(ok).toHaveLength((opts.balance - left) / 10);
        for (const r of failed) expect((r.reason as AppError).code).toBe(code);

        // Every success saw a different, strictly decreasing balance.
        const after = ok.map((r) => r.value.balanceAfter).sort((a, b) => b - a);
        expect(new Set(after).size).toBe(ok.length);
        expect(after.at(-1)).toBe(left);

        const wallet = await prisma.wallet.findUniqueOrThrow({ where: { studentId: s.studentId } });
        const { _sum } = await prisma.ledgerEntry.aggregate({
          where: { walletId: wallet.id },
          _sum: { amountCredits: true },
        });
        expect(wallet.balanceCredits).toBe(left);
        expect(_sum.amountCredits).toBe(left);
        expect(await prisma.order.count({ where: { studentId: s.studentId } })).toBe(ok.length);
      },
    );
  });
});
