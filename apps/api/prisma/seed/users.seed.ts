import { PrismaClient, Role, type User } from '@prisma/client';
import { hashSecret } from '../../src/common/utils/hash';

/** Every demo account uses this password. Dev/demo only. */
export const DEMO_PASSWORD = 'SchoolCoin@2026';

interface SeedUser {
  key: string;
  role: Role;
  fullName: string;
  email?: string;
  username?: string;
  phone?: string;
}

// B10: 1 council admin, 1 accountant, 1 cafeteria manager, 2 cashiers, 3 parents.
const USERS: SeedUser[] = [
  {
    key: 'admin',
    role: Role.ADMIN,
    fullName: 'Nguyễn Thị Hội Đồng',
    email: 'admin@schoolcoin.local',
  },
  {
    key: 'accountant',
    role: Role.ACCOUNTANT,
    fullName: 'Trần Văn Kế Toán',
    email: 'accountant@schoolcoin.local',
  },
  {
    key: 'manager',
    role: Role.CAFE_MANAGER,
    fullName: 'Lê Thị Căn Tin',
    email: 'manager@schoolcoin.local',
  },
  { key: 'cashier1', role: Role.CASHIER, fullName: 'Phạm Văn Thu', username: 'cashier1' },
  { key: 'cashier2', role: Role.CASHIER, fullName: 'Hoàng Thị Ngân', username: 'cashier2' },
  {
    key: 'parentAn',
    role: Role.PARENT,
    fullName: 'Nguyễn Văn An',
    email: 'parent.an@schoolcoin.local',
    phone: '0901000001',
  },
  {
    key: 'parentBinh',
    role: Role.PARENT,
    fullName: 'Trần Thị Bình',
    email: 'parent.binh@schoolcoin.local',
    phone: '0901000002',
  },
  {
    key: 'parentCuong',
    role: Role.PARENT,
    fullName: 'Lê Văn Cường',
    email: 'parent.cuong@schoolcoin.local',
    phone: '0901000003',
  },
];

export type SeededUsers = Record<string, User>;

export async function seedUsers(prisma: PrismaClient): Promise<SeededUsers> {
  const passwordHash = await hashSecret(DEMO_PASSWORD);
  const users: SeededUsers = {};
  for (const { key, ...u } of USERS) {
    const where = u.email ? { email: u.email } : { username: u.username! };
    users[key] = await prisma.user.upsert({
      where,
      update: {},
      create: { ...u, passwordHash },
    });
  }
  return users;
}
