import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-1 — invite codes, parent-student links. */
export class FamiliesService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const familiesService = new FamiliesService(prisma);
