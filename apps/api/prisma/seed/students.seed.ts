import { PrismaClient, type Student, type User } from '@prisma/client';
import { hash } from 'bcryptjs';

/** Demo PIN for every seeded student. */
export const DEMO_PIN = '1234';

const STUDENTS = [
  { studentCode: 'HS001', fullName: 'Nguyễn Minh Khang', className: '6A1', parent: 0 },
  { studentCode: 'HS002', fullName: 'Nguyễn Bảo Ngọc', className: '8A2', parent: 0 },
  { studentCode: 'HS003', fullName: 'Trần Gia Huy', className: '7A1', parent: 1 },
  { studentCode: 'HS004', fullName: 'Lê Thảo Vy', className: '9A3', parent: 2 },
  { studentCode: 'HS005', fullName: 'Phạm Đức Anh', className: '6A2', parent: null },
];

export async function seedStudents(prisma: PrismaClient, parents: User[]) {
  const pinHash = await hash(DEMO_PIN, 10);
  const students: Student[] = [];

  for (const [i, s] of STUDENTS.entries()) {
    const student = await prisma.student.upsert({
      where: { studentCode: s.studentCode },
      update: {},
      create: {
        studentCode: s.studentCode,
        fullName: s.fullName,
        className: s.className,
        pinHash,
        wallet: { create: { balanceCredits: 0, dailyLimitCredits: 50 } },
        cards: { create: { code: `CARD${String(i + 1).padStart(6, '0')}` } },
      },
    });
    if (s.parent !== null) {
      await prisma.familyLink.upsert({
        where: { parentId_studentId: { parentId: parents[s.parent].id, studentId: student.id } },
        update: {},
        create: { parentId: parents[s.parent].id, studentId: student.id },
      });
    }
    students.push(student);
  }

  return students;
}
