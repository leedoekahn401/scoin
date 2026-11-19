import { Injectable } from '@nestjs/common';
import { notImplemented } from '../../common/utils/todo';
import { PrismaService } from '../../prisma/prisma.service';

/** Append-only ledger reads plus the balance == sum(entries) check (FR-WAL-05, B9). */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async checkConsistency(): Promise<{ walletId: string; balance: number; ledgerSum: number }[]> {
    notImplemented('FR-WAL-05');
  }
}
