import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-1 — staff accounts, roles. */
export class UsersService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const usersService = new UsersService(prisma);
