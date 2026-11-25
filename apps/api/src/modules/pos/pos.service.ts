import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-2 — lookup, charge, void. */
export class PosService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const posService = new PosService(prisma);
