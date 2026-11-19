import { PrismaClient } from '@prisma/client';
import { sha256 } from '../../src/common/utils/codes';

/** B10: one registered kiosk. Its key must match NEXT_PUBLIC_KIOSK_KEY in apps/kiosk. */
export async function seedKiosk(prisma: PrismaClient) {
  const key = process.env.SEED_KIOSK_KEY ?? 'dev-kiosk-key-change-me';
  await prisma.kioskDevice.upsert({
    where: { keyHash: sha256(key) },
    update: {},
    create: { name: 'Kiosk sảnh chính', keyHash: sha256(key) },
  });
}
