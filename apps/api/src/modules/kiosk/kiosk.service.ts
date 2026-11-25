import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — devices, sessions, /kiosk/me. */
export class KioskService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const kioskService = new KioskService(prisma);
