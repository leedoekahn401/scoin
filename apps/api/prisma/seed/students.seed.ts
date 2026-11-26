import { PrismaClient, type Card, type Student } from '@prisma/client';
import { hashSecret } from '../../src/common/utils/hash';
import type { SeededUsers } from './users.seed';

/** Demo PIN for every seeded student. */
export const DEMO_PIN = '1234';

interface SeedStudent {
  studentCode: string;
  fullName: string;
  className: string;
  /** Fixed so printed demo cards keep working after `pnpm db:reset`. */
  cardCode: string;
  parents: string[];
  dailyLimitCredits?: number;
  lowBalanceThreshold?: number;
}

// B10: 5 students in 2 classes; one student with two parents (Khang), one parent with two children (An).
const STUDENTS: SeedStudent[] = [
  {
    studentCode: 'HS0001',
    fullName: 'Nguyễn Minh Khang',
    className: '7A1',
    cardCode: 'DEMOKHANG7A1CARD',
    parents: ['parentAn', 'parentBinh'],
    dailyLimitCredits: 40,
    lowBalanceThreshold: 20,
  },
  {
    studentCode: 'HS0002',
    fullName: 'Nguyễn Bảo Ngọc',
    className: '8A2',
    cardCode: 'DEMONGOC8A2CARDX',
    parents: ['parentAn'],
  },
  {
    studentCode: 'HS0003',
    fullName: 'Lê Gia Huy',
    className: '7A1',
    cardCode: 'DEMOHUY7A1CARDXX',
    parents: ['parentCuong'],
    dailyLimitCredits: 60,
  },
  {
    studentCode: 'HS0004',
    fullName: 'Phạm Thảo Vy',
    className: '8A2',
    cardCode: 'DEMOVY8A2CARDXXX',
    parents: [],
  },
  {
    studentCode: 'HS0005',
    fullName: 'Đỗ Đức Anh',
    className: '7A1',
    cardCode: 'DEMOANH7A1CARDXX',
    parents: [],
  },
];

export interface SeededStudent {
  student: Student;
  card: Card;
  walletId: string;
}

export async function seedStudents(
  prisma: PrismaClient,
  users: SeededUsers,
): Promise<SeededStudent[]> {
  const pinHash = await hashSecret(DEMO_PIN);
  const result: SeededStudent[] = [];

  for (const s of STUDENTS) {
    const student = await prisma.student.upsert({
      where: { studentCode: s.studentCode },
      update: {},
      create: {
        studentCode: s.studentCode,
        fullName: s.fullName,
        className: s.className,
        pinHash,
        dailyLimitCredits: s.dailyLimitCredits,
        lowBalanceThreshold: s.lowBalanceThreshold,
        wallet: { create: {} },
      },
      include: { wallet: true },
    });
    const card = await prisma.card.upsert({
      where: { code: s.cardCode },
      update: {},
      create: { code: s.cardCode, studentId: student.id, issuedById: users.admin.id },
    });
    for (const key of s.parents) {
      await prisma.parentStudent.upsert({
        where: { parentId_studentId: { parentId: users[key].id, studentId: student.id } },
        update: {},
        create: { parentId: users[key].id, studentId: student.id },
      });
    }
    result.push({ student, card, walletId: student.wallet!.id });
  }

  return result;
}
