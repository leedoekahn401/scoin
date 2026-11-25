import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-3 — refunds, adjustments, reconciliation. */
export class FinanceService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const financeService = new FinanceService(prisma);
