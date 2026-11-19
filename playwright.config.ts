import { defineConfig, devices } from '@playwright/test';

// B11: one happy path per app. Start the apps first (`pnpm dev`), or let CI start built apps.
// First run: `pnpm exec playwright install chromium`.
const apps = [
  { name: 'pos', port: 3001 },
  { name: 'parent', port: 3002 },
  { name: 'kiosk', port: 3003 },
  { name: 'admin', port: 3004 },
];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  projects: apps.map(({ name, port }) => ({
    name,
    testMatch: `${name}.spec.ts`,
    use: { ...devices['Desktop Chrome'], baseURL: `http://localhost:${port}` },
  })),
  webServer: apps.map(({ name, port }) => ({
    command: `pnpm --filter @schoolcoin/${name} start`,
    port,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  })),
});
