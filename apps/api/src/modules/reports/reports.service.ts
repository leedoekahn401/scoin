import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — sales, top-ups, balances, dashboard, CSV. */
export class ReportsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const reportsService = new ReportsService(prisma);
