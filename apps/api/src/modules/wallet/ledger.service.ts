import type { PrismaClient } from '@prisma/client';
import { notImplemented } from '../../common/utils/todo';
import { prisma } from '../../prisma';

/** Append-only ledger reads plus the balance == sum(entries) check (FR-WAL-05, B9). */
export class LedgerService {
  constructor(private readonly prisma: PrismaClient) {}

  async checkConsistency(): Promise<{ walletId: string; balance: number; ledgerSum: number }[]> {
    notImplemented('FR-WAL-05');
  }
}

export const ledgerService = new LedgerService(prisma);
