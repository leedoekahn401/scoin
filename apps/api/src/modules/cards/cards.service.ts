import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-2 — issue, lock, replace, print data. */
export class CardsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const cardsService = new CardsService(prisma);
