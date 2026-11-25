import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-1 — audit log query. */
export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const auditService = new AuditService(prisma);
