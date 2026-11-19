import { PrismaClient, Role, type User } from '@prisma/client';
import { hash } from 'bcryptjs';

/** Every demo account uses this password. Dev/demo only. */
export const DEMO_PASSWORD = 'Password123!';

const STAFF: { email: string; fullName: string; role: Role }[] = [
  { email: 'admin@schoolcoin.local', fullName: 'Admin', role: Role.ADMIN },
  { email: 'accountant@schoolcoin.local', fullName: 'Kế toán', role: Role.ACCOUNTANT },
  { email: 'manager@schoolcoin.local', fullName: 'Quản lý căn tin', role: Role.MANAGER },
  { email: 'cashier1@schoolcoin.local', fullName: 'Thu ngân 1', role: Role.CASHIER },
  { email: 'cashier2@schoolcoin.local', fullName: 'Thu ngân 2', role: Role.CASHIER },
];

const PARENTS = [
  { email: 'parent1@schoolcoin.local', fullName: 'Nguyễn Văn An' },
  { email: 'parent2@schoolcoin.local', fullName: 'Trần Thị Bình' },
  { email: 'parent3@schoolcoin.local', fullName: 'Lê Văn Cường' },
];

export async function seedUsers(prisma: PrismaClient) {
  const passwordHash = await hash(DEMO_PASSWORD, 10);
  const upsert = (email: string, fullName: string, role: Role) =>
    prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, fullName, role, passwordHash },
    });

  const staff: User[] = [];
  for (const s of STAFF) staff.push(await upsert(s.email, s.fullName, s.role));
  const parents: User[] = [];
  for (const p of PARENTS) parents.push(await upsert(p.email, p.fullName, Role.PARENT));

  return { staff, parents };
}
