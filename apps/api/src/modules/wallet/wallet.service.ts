import { LedgerType, Prisma } from '@prisma/client';
import type { ErrorCode, LedgerRefType } from '@schoolcoin/types';
import { AppError } from '../../common/errors/app-error';
import { startOfVnDay } from '../../common/utils/vn-day';
import { LedgerService, ledgerService, type SchoolWalletKind } from './ledger.service';

export interface WalletMovement {
  studentId: string;
  amountCredits: number; // always positive; credit() adds, debit() subtracts
  type: LedgerType;
  refType: LedgerRefType;
  refId: string;
  actorId?: string;
  note?: string;
  /** The school-side wallet on the other side; defaults by type (a bank-transfer REFUND passes SEPAY_BANK). */
  counterparty?: SchoolWalletKind;
}

export interface LockedWallet {
  id: string;
  balanceCredits: number;
}

export interface WalletMovementResult {
  transactionId: string;
  /** The student's balance after the movement. */
  balanceAfter: number;
}

/** Where the credits of each kind of student movement come from or go to. */
export const DEFAULT_COUNTERPARTY: Record<LedgerType, SchoolWalletKind> = {
  TOPUP_SEPAY: 'SEPAY_BANK',
  TOPUP_CASH: 'CASH_OFFICE',
  PURCHASE: 'CAFETERIA',
  VOID_REVERSAL: 'CAFETERIA',
  REFUND: 'CASH_OFFICE',
  ADJUSTMENT: 'ADJUSTMENT',
};

const CREDIT_TYPES: LedgerType[] = [
  LedgerType.TOPUP_SEPAY,
  LedgerType.TOPUP_CASH,
  LedgerType.VOID_REVERSAL,
  LedgerType.ADJUSTMENT,
];

/** Debit types and the error each one reports when the balance is too low. */
const DEBIT_ERRORS: Partial<Record<LedgerType, ErrorCode>> = {
  PURCHASE: 'INSUFFICIENT_BALANCE',
  REFUND: 'REFUND_EXCEEDS_BALANCE',
  ADJUSTMENT: 'ADJUSTMENT_NEGATIVE_BALANCE',
};

/**
 * BE-2 — THE money core (B5). Every student balance change goes through credit()/debit(), inside
 * a transaction that locks the wallet row first (ADR 0002, NFR-REL-01). Each one posts a
 * double-entry ledger transaction between the student and a school-side wallet (ADR 0005).
 */
export class WalletService {
  constructor(private readonly ledger: LedgerService) {}

  /** SELECT ... FOR UPDATE on the student's wallet; call first inside a transaction. */
  async lockWallet(tx: Prisma.TransactionClient, studentId: string): Promise<LockedWallet> {
    const [wallet] = await tx.$queryRaw<LockedWallet[]>`
      SELECT id, "balanceCredits" FROM wallets WHERE "studentId" = ${studentId} FOR UPDATE`;
    if (!wallet) throw new AppError('NOT_FOUND', 404, 'Wallet not found');
    return wallet;
  }

  /** Adds credits: TOPUP_SEPAY, TOPUP_CASH, VOID_REVERSAL, positive ADJUSTMENT. */
  async credit(
    tx: Prisma.TransactionClient,
    movement: WalletMovement,
  ): Promise<WalletMovementResult> {
    if (!CREDIT_TYPES.includes(movement.type)) {
      throw new Error(`${movement.type} does not add credits to a wallet`);
    }
    const wallet = await this.lockWallet(tx, movement.studentId);
    const school = await this.counterparty(tx, movement);
    return this.post(tx, movement, wallet.id, school, wallet.id);
  }

  /** Removes credits: PURCHASE, REFUND, negative ADJUSTMENT. Throws INSUFFICIENT_BALANCE. */
  async debit(
    tx: Prisma.TransactionClient,
    movement: WalletMovement,
  ): Promise<WalletMovementResult> {
    const errorCode = DEBIT_ERRORS[movement.type];
    if (!errorCode) throw new Error(`${movement.type} does not take credits from a wallet`);

    const wallet = await this.lockWallet(tx, movement.studentId);
    if (wallet.balanceCredits < movement.amountCredits) {
      throw new AppError(errorCode, 422, 'Not enough credits', {
        balance: wallet.balanceCredits,
        total: movement.amountCredits,
      });
    }
    const school = await this.counterparty(tx, movement);
    return this.post(tx, movement, wallet.id, wallet.id, school);
  }

  /** BR-04: today's purchases minus reversals of today's purchases, VN calendar day. */
  async todaySpent(
    tx: Prisma.TransactionClient,
    walletId: string,
    now: Date = new Date(),
  ): Promise<number> {
    const { _sum } = await tx.ledgerEntry.aggregate({
      where: {
        walletId,
        createdAt: { gte: startOfVnDay(now) },
        transaction: { type: { in: [LedgerType.PURCHASE, LedgerType.VOID_REVERSAL] } },
      },
      _sum: { amountCredits: true },
    });
    // Purchases are negative on the student's side, reversals positive. (0 - x, not -x: no -0.)
    return 0 - (_sum.amountCredits ?? 0);
  }

  private counterparty(tx: Prisma.TransactionClient, movement: WalletMovement) {
    return this.ledger.schoolWalletId(
      tx,
      movement.counterparty ?? DEFAULT_COUNTERPARTY[movement.type],
    );
  }

  private async post(
    tx: Prisma.TransactionClient,
    movement: WalletMovement,
    studentWalletId: string,
    fromWalletId: string,
    toWalletId: string,
  ): Promise<WalletMovementResult> {
    const posted = await this.ledger.post(tx, {
      type: movement.type,
      fromWalletId,
      toWalletId,
      amountCredits: movement.amountCredits,
      refType: movement.refType,
      refId: movement.refId,
      actorId: movement.actorId,
      note: movement.note,
    });
    const studentEntry = posted.entries.find((e) => e.walletId === studentWalletId)!;
    return { transactionId: posted.id, balanceAfter: studentEntry.balanceAfter };
  }
}

export const walletService = new WalletService(ledgerService);
