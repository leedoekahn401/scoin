import type { PrismaClient } from '@prisma/client';
import { RULES } from '@schoolcoin/types';
import { prisma } from '../../prisma';

/** BE-4 — PIN threshold, top-up limits, bank info. */
export class SettingsService {
  constructor(private readonly prisma: PrismaClient) {}

  /** BR-05: orders above this many credits need the student's PIN. */
  async pinThreshold(): Promise<number> {
    const row = await this.prisma.setting.findUnique({ where: { key: 'pinThresholdCredits' } });
    return typeof row?.value === 'number' ? row.value : RULES.PIN_THRESHOLD_CREDITS;
  }
}

export const settingsService = new SettingsService(prisma);
