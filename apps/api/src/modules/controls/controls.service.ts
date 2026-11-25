import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-2 — daily limit, low-balance threshold. */
export class ControlsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const controlsService = new ControlsService(prisma);
