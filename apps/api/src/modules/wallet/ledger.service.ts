import { Injectable, NotImplementedException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/** Append-only ledger entries plus the balance == sum(entries) consistency check. */
@Injectable()
export class LedgerService {
  constructor(private readonly prisma: PrismaService) {}

  async checkConsistency(): Promise<{ walletId: string; balance: number; ledgerSum: number }[]> {
    throw new NotImplementedException();
  }
}
