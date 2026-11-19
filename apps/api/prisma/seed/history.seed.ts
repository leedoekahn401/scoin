import type { MenuItem, PrismaClient, Student, User } from '@prisma/client';

interface SeedContext {
  users: { staff: User[]; parents: User[] };
  students: Student[];
  menu: MenuItem[];
}

/**
 * Past orders and top-ups so reports have data.
 * TODO(BE-4): write through WalletService-equivalent logic so ledger and balances stay consistent.
 */
export async function seedHistory(_prisma: PrismaClient, _ctx: SeedContext) {}
