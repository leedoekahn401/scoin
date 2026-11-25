import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-4 — credit requests. */
export class RequestsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const requestsService = new RequestsService(prisma);
