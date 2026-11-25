import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — categories, items, sold-out. */
export class MenuService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const menuService = new MenuService(prisma);
