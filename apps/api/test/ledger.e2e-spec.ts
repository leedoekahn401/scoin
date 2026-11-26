import { LedgerType, type Prisma } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import { AppError } from '../src/common/errors/app-error';
import { ledgerService as ledger } from '../src/modules/wallet/ledger.service';
import {
  walletService as wallets,
  type WalletMovement,
} from '../src/modules/wallet/wallet.service';
import { prisma } from '../src/prisma';

// ADR 0006: every movement is one transaction with two matching entries, and only the ledger
// moves a balance. Runs against the e2e database.
describe('Double-entry ledger', () => {
  afterAll(() => prisma.$disconnect());

  async function newStudent() {
    const student = await prisma.student.create({
      data: {
        studentCode: `T${randomUUID().slice(0, 8)}`,
        fullName: 'Học sinh thử',
        className: '6A',
        wallet: { create: {} },
      },
      include: { wallet: true },
    });
    return { studentId: student.id, walletId: student.wallet!.id };
  }

  function move(studentId: string, type: LedgerType, amountCredits: number): WalletMovement {
    const refType =
      type === LedgerType.PURCHASE || type === LedgerType.VOID_REVERSAL ? 'ORDER' : 'TOP_UP';
    return { studentId, type, amountCredits, refType, refId: randomUUID() };
  }

  const credit = (m: WalletMovement) => prisma.$transaction((tx) => wallets.credit(tx, m));
  const debit = (m: WalletMovement) => prisma.$transaction((tx) => wallets.debit(tx, m));

  async function balance(walletId: string) {
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: walletId } });
    return wallet.balanceCredits;
  }

  async function legs(transactionId: string) {
    return prisma.ledgerEntry.findMany({
      where: { transactionId },
      include: { wallet: { select: { kind: true } } },
      orderBy: { id: 'asc' },
    });
  }

  async function expectAppError(promise: Promise<unknown>, code: string) {
    const err = await promise.then(
      () => null,
      (e: unknown) => e,
    );
    expect(err).toBeInstanceOf(AppError);
    expect((err as AppError).code).toBe(code);
  }

  describe('posting', () => {
    it('a bank top-up is one transaction: -100 on the bank wallet, +100 on the student', async () => {
      const { studentId, walletId } = await newStudent();
      const bankBefore = await balance(
        await prisma.$transaction((tx) => ledger.schoolWalletId(tx, 'BANK')),
      );

      const result = await credit(move(studentId, LedgerType.TOPUP_SEPAY, 100));

      expect(result.balanceAfter).toBe(100);
      const entries = await legs(result.transactionId);
      expect(entries.map((e) => [e.wallet.kind, e.amountCredits])).toEqual([
        ['BANK', -100],
        ['STUDENT', 100],
      ]);
      expect(entries[0].balanceAfter).toBe(bankBefore - 100);
      expect(entries[1].balanceAfter).toBe(100);
      expect(await balance(walletId)).toBe(100);
    });

    it('a purchase pays the cafeteria, and its void pays the student back', async () => {
      const { studentId, walletId } = await newStudent();
      await credit(move(studentId, LedgerType.TOPUP_CASH, 50));

      const orderId = randomUUID();
      const purchase = await debit({ ...move(studentId, LedgerType.PURCHASE, 30), refId: orderId });
      expect(purchase.balanceAfter).toBe(20);
      expect(
        (await legs(purchase.transactionId)).map((e) => [e.wallet.kind, e.amountCredits]),
      ).toEqual([
        ['STUDENT', -30],
        ['CAFETERIA', 30],
      ]);
      expect(await prisma.$transaction((tx) => wallets.todaySpent(tx, walletId))).toBe(30);

      const reversal = await credit({
        ...move(studentId, LedgerType.VOID_REVERSAL, 30),
        refId: orderId,
      });
      expect(reversal.balanceAfter).toBe(50);
      expect(
        (await legs(reversal.transactionId)).map((e) => [e.wallet.kind, e.amountCredits]),
      ).toEqual([
        ['CAFETERIA', -30],
        ['STUDENT', 30],
      ]);
      expect(await prisma.$transaction((tx) => wallets.todaySpent(tx, walletId))).toBe(0);
    });

    it('a bank-transfer refund goes back out through the bank wallet', async () => {
      const { studentId } = await newStudent();
      await credit(move(studentId, LedgerType.TOPUP_SEPAY, 40));

      const refund = await debit({
        ...move(studentId, LedgerType.REFUND, 40),
        refType: 'REFUND',
        counterparty: 'BANK',
      });

      expect(refund.balanceAfter).toBe(0);
      expect(
        (await legs(refund.transactionId)).map((e) => [e.wallet.kind, e.amountCredits]),
      ).toEqual([
        ['STUDENT', -40],
        ['BANK', 40],
      ]);
    });

    it('rejects a debit above the balance and writes nothing', async () => {
      const { studentId, walletId } = await newStudent();
      await credit(move(studentId, LedgerType.TOPUP_CASH, 20));
      const before = await prisma.ledgerTransaction.count();

      await expectAppError(debit(move(studentId, LedgerType.PURCHASE, 21)), 'INSUFFICIENT_BALANCE');
      await expectAppError(
        debit({ ...move(studentId, LedgerType.REFUND, 21), refType: 'REFUND' }),
        'REFUND_EXCEEDS_BALANCE',
      );
      await expectAppError(
        debit({ ...move(studentId, LedgerType.ADJUSTMENT, 21), refType: 'ADJUSTMENT' }),
        'ADJUSTMENT_NEGATIVE_BALANCE',
      );

      expect(await prisma.ledgerTransaction.count()).toBe(before);
      expect(await balance(walletId)).toBe(20);
    });

    it('posts a business event at most once', async () => {
      const { studentId, walletId } = await newStudent();
      const topUp = move(studentId, LedgerType.TOPUP_SEPAY, 10);
      await credit(topUp);

      await expectAppError(credit(topUp), 'CONFLICT');
      expect(await balance(walletId)).toBe(10);
    });

    it('rejects movements in the wrong direction or of no credits', async () => {
      const { studentId } = await newStudent();
      await expect(credit(move(studentId, LedgerType.PURCHASE, 10))).rejects.toThrow(
        'does not add credits',
      );
      await expect(debit(move(studentId, LedgerType.TOPUP_SEPAY, 10))).rejects.toThrow(
        'does not take credits',
      );
      await expect(credit(move(studentId, LedgerType.TOPUP_CASH, 0))).rejects.toThrow(
        'positive whole number',
      );
    });
  });

  describe('database guards', () => {
    /** Runs raw SQL in its own transaction, so deferred checks fire at its COMMIT. */
    const inTx = <T>(fn: (tx: Prisma.TransactionClient) => Promise<T>) => prisma.$transaction(fn);

    it('rejects editing a wallet balance directly', async () => {
      const { walletId } = await newStudent();

      await expect(
        prisma.wallet.update({ where: { id: walletId }, data: { balanceCredits: 1_000 } }),
      ).rejects.toThrow('changes only through ledger_entries');
      await expect(
        prisma.$executeRaw`UPDATE wallets SET "balanceCredits" = "balanceCredits" + 1 WHERE id = ${walletId}`,
      ).rejects.toThrow('changes only through ledger_entries');
      await expect(
        prisma.wallet.create({
          data: { studentId: (await newStudentWithoutWallet()).id, balanceCredits: 5 },
        }),
      ).rejects.toThrow('starts at 0 credits');
      expect(await balance(walletId)).toBe(0);
    });

    it('rejects a transaction that is not exactly one -amount and one +amount entry', async () => {
      const { walletId } = await newStudent();
      const cafeteria = await inTx((tx) => ledger.schoolWalletId(tx, 'CAFETERIA'));

      const header = (tx: Prisma.TransactionClient, id: string) =>
        tx.$executeRaw`INSERT INTO ledger_transactions (id, type, "amountCredits", "refType", "refId")
                       VALUES (${id}, 'ADJUSTMENT', 10, 'ADJUSTMENT', ${id})`;
      const leg = (tx: Prisma.TransactionClient, id: string, wallet: string, amount: number) =>
        tx.$executeRaw`INSERT INTO ledger_entries ("transactionId", "walletId", "amountCredits")
                       VALUES (${id}, ${wallet}, ${amount})`;

      // No entries.
      await expect(inTx((tx) => header(tx, randomUUID()))).rejects.toThrow('must have 2 entries');
      // One leg only.
      await expect(
        inTx(async (tx) => {
          const id = randomUUID();
          await header(tx, id);
          await leg(tx, id, cafeteria, -10);
        }),
      ).rejects.toThrow('must have 2 entries');
      // Two legs that do not cancel out.
      await expect(
        inTx(async (tx) => {
          const id = randomUUID();
          await header(tx, id);
          await leg(tx, id, cafeteria, -10);
          await leg(tx, id, walletId, 20);
        }),
      ).rejects.toThrow('must have 2 entries');

      expect(await balance(walletId)).toBe(0);
    });

    it('never lets a student wallet go below 0, even when the entries are written by hand', async () => {
      const { walletId } = await newStudent();
      const cafeteria = await inTx((tx) => ledger.schoolWalletId(tx, 'CAFETERIA'));
      const id = randomUUID();

      await expect(
        inTx(async (tx) => {
          await tx.$executeRaw`INSERT INTO ledger_transactions (id, type, "amountCredits", "refType", "refId")
                               VALUES (${id}, 'PURCHASE', 5, 'ORDER', ${id})`;
          await tx.$executeRaw`INSERT INTO ledger_entries ("transactionId", "walletId", "amountCredits")
                               VALUES (${id}, ${walletId}, -5), (${id}, ${cafeteria}, 5)`;
        }),
      ).rejects.toThrow('wallets_student_balance_non_negative');
    });

    it('keeps ledger rows append-only', async () => {
      const { studentId } = await newStudent();
      const { transactionId } = await credit(move(studentId, LedgerType.TOPUP_CASH, 10));

      await expect(
        prisma.ledgerTransaction.update({ where: { id: transactionId }, data: { note: 'sửa' } }),
      ).rejects.toThrow('append-only');
      await expect(prisma.ledgerEntry.deleteMany({ where: { transactionId } })).rejects.toThrow(
        'append-only',
      );
      await expect(
        prisma.$executeRaw`TRUNCATE ledger_entries, ledger_transactions`,
      ).rejects.toThrow('append-only');
    });
  });

  describe('concurrency', () => {
    it('20 parallel 10-credit purchases on a 100-credit wallet: 10 succeed, never below 0', async () => {
      const { studentId, walletId } = await newStudent();
      await credit(move(studentId, LedgerType.TOPUP_CASH, 100));

      const results = await Promise.allSettled(
        Array.from({ length: 20 }, () => debit(move(studentId, LedgerType.PURCHASE, 10))),
      );

      expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(10);
      for (const r of results) {
        if (r.status === 'rejected')
          expect((r.reason as AppError).code).toBe('INSUFFICIENT_BALANCE');
      }
      const balancesAfter = results
        .flatMap((r) => (r.status === 'fulfilled' ? [r.value.balanceAfter] : []))
        .sort((a, b) => a - b);
      expect(balancesAfter).toEqual([0, 10, 20, 30, 40, 50, 60, 70, 80, 90]);
      expect(await balance(walletId)).toBe(0);
    });

    it('mixed top-ups and purchases from many wallets leave the books balanced', async () => {
      const students = await Promise.all(Array.from({ length: 5 }, () => newStudent()));
      await Promise.all(students.map((s) => credit(move(s.studentId, LedgerType.TOPUP_SEPAY, 50))));

      await Promise.allSettled(
        students.flatMap((s) => [
          debit(move(s.studentId, LedgerType.PURCHASE, 20)),
          credit(move(s.studentId, LedgerType.TOPUP_CASH, 10)),
          debit(move(s.studentId, LedgerType.PURCHASE, 30)),
          credit(move(s.studentId, LedgerType.TOPUP_SEPAY, 5)),
        ]),
      );

      for (const s of students) expect(await balance(s.walletId)).toBeGreaterThanOrEqual(0);
    });
  });

  // Last, so it covers everything the tests above posted.
  describe('consistency', () => {
    it('balances equal the sum of their entries and all wallets add up to 0 (FR-WAL-05)', async () => {
      await expect(ledger.checkConsistency()).resolves.toEqual({
        walletMismatches: [],
        unbalancedTransactionIds: [],
        totalCredits: 0,
      });
    });
  });

  async function newStudentWithoutWallet() {
    return prisma.student.create({
      data: {
        studentCode: `T${randomUUID().slice(0, 8)}`,
        fullName: 'Học sinh thử',
        className: '6A',
      },
    });
  }
});
