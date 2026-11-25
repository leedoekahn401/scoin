import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — PIN threshold, top-up limits, bank info. */
export class SettingsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const settingsService = new SettingsService(prisma);
