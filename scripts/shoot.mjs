// Headless visual QA. Signs in through the real login form, then captures
// each route at desktop (and optionally mobile) width.
//   node scripts/shoot.mjs admin            → screenshots/admin-*.png
// Requires the app to be running (pnpm dev or next start).
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const APPS = {
  admin: {
    url: 'http://localhost:3004',
    login: { identifier: 'admin@schoolcoin.vn', password: 'demo1234' },
    routes: [
      '/',
      '/students',
      '/cards',
      '/menu',
      '/orders',
      '/money/cash',
      '/money/unmatched',
      '/money/review',
      '/money/refunds',
      '/reports',
      '/staff',
      '/audit',
      '/settings',
      '/settings/kiosks',
    ],
    viewport: { width: 1440, height: 900 },
  },
  pos: {
    url: 'http://localhost:3001',
    login: { identifier: 'thungan1', password: 'demo1234' },
    routes: ['/', '/orders'],
    viewport: { width: 1366, height: 768 },
  },
  parent: {
    url: 'http://localhost:3002',
    login: { identifier: 'lan.nguyen@gmail.com', password: 'demo1234' },
    routes: ['/', '/requests', '/notifications', '/topups', '/account'],
    viewport: { width: 390, height: 844 },
    mobile: true,
  },
  kiosk: {
    url: 'http://localhost:3003',
    login: null,
    routes: ['/'],
    viewport: { width: 1280, height: 800 },
  },
};

const name = process.argv[2];
const extraRoutes = process.argv.slice(3);
const app = APPS[name];
if (!app) {
  console.error(`usage: node scripts/shoot.mjs <${Object.keys(APPS).join('|')}> [extra routes…]`);
  process.exit(1);
}
const base = process.env.SHOOT_BASE_URL;
const url = base ?? app.url;

mkdirSync('screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({
  viewport: app.viewport,
  deviceScaleFactor: app.mobile ? 2 : 1,
  isMobile: !!app.mobile,
  hasTouch: !!app.mobile,
  locale: 'vi-VN',
  timezoneId: 'Asia/Ho_Chi_Minh',
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(`console: ${m.text()}`);
});

const slug = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replace(/[/?=&]/g, '_'));

if (app.login) {
  await page.goto(`${url}/login`, { waitUntil: 'networkidle' });
  await page.screenshot({ path: `screenshots/${name}-login.png`, fullPage: true });
  await page.locator('input[autocomplete="username"]').fill(app.login.identifier);
  await page.locator('input[type="password"]').first().fill(app.login.password);
  await page.locator('button[type="submit"]').first().click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 15000 });
}

for (const route of [...app.routes, ...extraRoutes]) {
  try {
    await page.goto(`${url}${route}`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `screenshots/${name}-${slug(route)}.png`, fullPage: true });
    console.log(`✓ ${route}`);
  } catch (e) {
    console.log(`✗ ${route}: ${e.message.split('\n')[0]}`);
  }
}

await browser.close();
if (errors.length) {
  console.log('\nBrowser errors:');
  for (const e of [...new Set(errors)].slice(0, 30)) console.log('  ' + e);
}
