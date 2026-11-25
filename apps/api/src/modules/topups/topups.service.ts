import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-3 — parent top-ups, cash top-ups, review list. */
export class TopupsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const topupsService = new TopupsService(prisma);
