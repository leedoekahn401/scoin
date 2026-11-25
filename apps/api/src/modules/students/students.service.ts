import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-2 — students, CSV import, PIN set/reset. */
export class StudentsService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const studentsService = new StudentsService(prisma);
