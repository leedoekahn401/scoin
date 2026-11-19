// B10 seed data for development and the demo. Run with `pnpm db:seed` (or `pnpm db:reset`).
// Idempotent for people, menu and settings; history is only written into empty wallets.
import { PrismaClient } from '@prisma/client';
import { seedHistory } from './history.seed';
import { seedKiosk } from './kiosk.seed';
import { seedMenu } from './menu.seed';
import { seedSettings } from './settings.seed';
import { seedStudents } from './students.seed';
import { seedUsers } from './users.seed';

const prisma = new PrismaClient();

async function main() {
  const users = await seedUsers(prisma);
  const students = await seedStudents(prisma, users);
  const menu = await seedMenu(prisma);
  await seedSettings(prisma);
  await seedKiosk(prisma);
  await seedHistory(prisma, { users, students, menu });
  console.log('Seed complete. See apps/api/prisma/seed/README.md for the demo accounts.');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
