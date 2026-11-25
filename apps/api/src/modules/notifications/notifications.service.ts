import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — in-app + email. */
export class NotificationsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const notificationsService = new NotificationsService(prisma);
