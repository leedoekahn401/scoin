import { Injectable } from '@nestjs/common';
import { LedgerType, Prisma } from '@prisma/client';
import type { LedgerRefType } from '@schoolcoin/types';
import { notImplemented } from '../../common/utils/todo';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from './ledger.service';

export interface WalletMovement {
  studentId: string;
  amountCredits: number; // always positive; credit() adds, debit() subtracts
  type: LedgerType;
  refType: LedgerRefType;
  refId: string;
  actorId?: string;
  note?: string;
}

export interface LockedWallet {
  id: string;
  balanceCredits: number;
}

/**
 * BE-2 — THE money core (B5). Every balance change goes through credit()/debit(),
 * inside a transaction that locks the wallet row first (ADR 0002, NFR-REL-01).
 */
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /** SELECT ... FOR UPDATE on the student's wallet; call first inside a transaction. */
  async lockWallet(tx: Prisma.TransactionClient, studentId: string): Promise<LockedWallet> {
    const [wallet] = await tx.$queryRaw<LockedWallet[]>`
      SELECT id, "balanceCredits" FROM wallets WHERE "studentId" = ${studentId} FOR UPDATE`;
    return wallet;
  }

  /** Adds credits: TOPUP_SEPAY, TOPUP_CASH, VOID_REVERSAL, positive ADJUSTMENT. */
  async credit(_tx: Prisma.TransactionClient, _movement: WalletMovement) {
    notImplemented('FR-WAL-02');
  }

  /** Removes credits: PURCHASE, REFUND, negative ADJUSTMENT. Throws INSUFFICIENT_BALANCE. */
  async debit(_tx: Prisma.TransactionClient, _movement: WalletMovement) {
    notImplemented('FR-WAL-03');
  }

  /** BR-04: today's purchases minus reversals of today's purchases, VN calendar day. */
  async todaySpent(_tx: Prisma.TransactionClient, _walletId: string): Promise<number> {
    notImplemented('BR-04');
  }
}
