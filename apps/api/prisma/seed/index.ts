import { PrismaClient } from '@prisma/client';
import { seedHistory } from './history.seed';
import { seedMenu } from './menu.seed';
import { seedStudents } from './students.seed';
import { seedUsers } from './users.seed';

const prisma = new PrismaClient();

async function main() {
  const users = await seedUsers(prisma);
  const students = await seedStudents(prisma, users.parents);
  const menu = await seedMenu(prisma);
  await seedHistory(prisma, { users, students, menu });
  console.log('Seed complete.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
