import type { PrismaClient } from '@prisma/client';
import { prisma } from '../../prisma';

/** BE-1 — login, refresh, logout, register-parent, reset. */
export class AuthService {
  constructor(private readonly prisma: PrismaClient) {}
}

export const authService = new AuthService(prisma);
