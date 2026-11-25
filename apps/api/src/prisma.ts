import { PrismaClient } from '@prisma/client';

/** One client for the whole process; it connects on first query. */
export const prisma = new PrismaClient();
