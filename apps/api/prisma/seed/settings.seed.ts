import { PrismaClient } from '@prisma/client';
import { RULES } from '@schoolcoin/types';

/** FR-ADM-05 defaults; the bank details come from the API env. */
export async function seedSettings(prisma: PrismaClient) {
  const settings: Record<string, unknown> = {
    pinThresholdCredits: RULES.PIN_THRESHOLD_CREDITS,
    topupMinCredits: RULES.TOPUP_MIN_CREDITS,
    topupMaxCredits: RULES.TOPUP_MAX_CREDITS,
    topupExpiryMinutes: RULES.TOPUP_EXPIRY_MINUTES,
    schoolBank: {
      name: process.env.SCHOOL_BANK_NAME ?? 'MBBank',
      account: process.env.SCHOOL_BANK_ACCOUNT ?? '0000000000',
      holder: process.env.SCHOOL_BANK_HOLDER ?? 'TRUONG THCS DEMO',
    },
  };
  for (const [key, value] of Object.entries(settings)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: value as object },
    });
  }
}
