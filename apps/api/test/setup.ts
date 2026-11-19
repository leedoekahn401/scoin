import { execSync } from 'node:child_process';

/**
 * Resets the test database and loads seed data before the e2e run.
 * DATABASE_URL must point at a disposable database.
 */
export default function setup() {
  if (!process.env.DATABASE_URL?.includes('test')) {
    throw new Error('Refusing to reset: DATABASE_URL does not look like a test database.');
  }
  execSync('pnpm prisma migrate reset --force', { stdio: 'inherit' });
}
