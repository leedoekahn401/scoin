import { Injectable, NotImplementedException } from '@nestjs/common';
import { LedgerType, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from './ledger.service';

export interface WalletMovement {
  walletId: string;
  amountCredits: number;
  type: LedgerType;
  createdById?: string;
  orderId?: string;
  topUpId?: string;
  note?: string;
}

/**
 * BE-2 — THE money core. Every balance change goes through credit()/debit(),
 * inside a transaction that locks the wallet row first (ADR 0002).
 */
@Injectable()
export class WalletService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledger: LedgerService,
  ) {}

  /** SELECT ... FOR UPDATE on the wallet row; call first inside a transaction. */
  async lockWallet(tx: Prisma.TransactionClient, walletId: string) {
    const [wallet] = await tx.$queryRaw<{ id: string; balance_credits: number; locked: boolean }[]>`
      SELECT id, balance_credits, locked FROM wallets WHERE id = ${walletId} FOR UPDATE`;
    return wallet;
  }

  async credit(_tx: Prisma.TransactionClient, _movement: WalletMovement) {
    throw new NotImplementedException();
  }

  async debit(_tx: Prisma.TransactionClient, _movement: WalletMovement) {
    throw new NotImplementedException();
  }

  /** Credits spent since the start of today in Asia/Ho_Chi_Minh. */
  async todaySpent(_walletId: string): Promise<number> {
    throw new NotImplementedException();
  }
}
