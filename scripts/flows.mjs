// Click-through QA of the interactive flows, with screenshots at each step.
//   node scripts/flows.mjs pos|kiosk|parent
import { mkdirSync } from 'node:fs';
import { chromium } from 'playwright';

const which = process.argv[2];
mkdirSync('screenshots', { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [];

async function open(viewport, mobile = false) {
  const ctx = await browser.newContext({
    viewport,
    deviceScaleFactor: mobile ? 2 : 1,
    isMobile: mobile,
    hasTouch: mobile,
    locale: 'vi-VN',
    timezoneId: 'Asia/Ho_Chi_Minh',
  });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on(
    'console',
    (m) => m.type() === 'error' && !m.text().includes('404') && errors.push(`console: ${m.text()}`),
  );
  return page;
}
const shot = (page, name) => page.screenshot({ path: `screenshots/flow-${which}-${name}.png` });
const pause = (page, ms = 900) => page.waitForTimeout(ms);
async function login(page, url, id) {
  await page.goto(`${url}/login`, { waitUntil: 'load' });
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${url}/login`, { waitUntil: 'load' });
  await page.locator('input[autocomplete="username"]').fill(id);
  await page.locator('input[type="password"]').fill('demo1234');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => !u.pathname.startsWith('/login'));
  await pause(page, 1500);
}

if (which === 'pos') {
  const page = await open({ width: 1366, height: 768 });
  await login(page, 'http://localhost:3001', 'thungan1');
  await page
    .getByRole('button', { name: /Cơm gà/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Nước suối/ })
    .first()
    .click();
  await page.locator('select').first().selectOption({ index: 2 });
  await pause(page, 1500);
  await shot(page, '1-cart-student');
  await page.getByRole('button', { name: /^Thu / }).click();
  await pause(page, 1500);
  await shot(page, '2-paid');
  await pause(page, 3500);
  // Big order → PIN
  await page
    .getByRole('button', { name: /Phở bò/ })
    .first()
    .click();
  await page
    .getByRole('button', { name: /Phở bò/ })
    .first()
    .click();
  await page.locator('select').first().selectOption({ index: 3 });
  await pause(page, 1500);
  await page.getByRole('button', { name: /^Thu / }).click();
  await pause(page, 800);
  await shot(page, '3-pin');
  await page.keyboard.type('0000');
  await pause(page, 1500);
  await shot(page, '4-pin-wrong');
  await page.keyboard.type('1234');
  await pause(page, 1800);
  await shot(page, '5-after-pin');
  await page.goto('http://localhost:3001/orders', { waitUntil: 'load' });
  await pause(page, 1500);
  await shot(page, '6-orders');
}

if (which === 'kiosk') {
  const page = await open({ width: 1280, height: 800 });
  await page.goto('http://localhost:3003', { waitUntil: 'load' });
  await pause(page, 1500);
  await shot(page, '1-idle');
  await page.getByRole('button', { name: /Nguyễn Minh Anh/ }).click();
  await pause(page, 1200);
  await shot(page, '2-pin');
  await page.keyboard.type('1234');
  await pause(page, 2000);
  await shot(page, '3-home');
  await page.getByRole('button', { name: /thêm xu/ }).click();
  await pause(page, 800);
  await page.getByRole('button', { name: /^50/ }).first().click();
  await pause(page, 400);
  await shot(page, '4-request');
  await page.getByRole('button', { name: /Gửi yêu cầu/ }).click();
  await pause(page, 1200);
  await shot(page, '5-sent');
}

if (which === 'parent') {
  const page = await open({ width: 390, height: 844 }, true);
  await login(page, 'http://localhost:3002', 'lan.nguyen@gmail.com');
  await shot(page, '1-home');
  await page
    .getByRole('link', { name: /Nạp xu/ })
    .first()
    .click();
  await pause(page, 1500);
  await page.getByRole('button', { name: /^100/ }).first().click();
  await shot(page, '2-amount');
  await page.getByRole('button', { name: /Tạo mã QR/ }).click();
  await pause(page, 2500);
  await page.screenshot({ path: `screenshots/flow-parent-3-qr.png`, fullPage: true });
  const sim = page.getByRole('button', { name: /Giả lập chuyển khoản/ });
  if (await sim.count()) {
    await sim.click();
    await pause(page, 3500);
    await shot(page, '4-success');
  }
  for (const r of ['/requests', '/notifications', '/account']) {
    await page.goto(`http://localhost:3002${r}`, { waitUntil: 'load' });
    await pause(page, 1500);
    await page.screenshot({ path: `screenshots/flow-parent-${r.slice(1)}.png`, fullPage: true });
  }
  const firstChild = 'http://localhost:3002/children/stu_01';
  await page.goto(firstChild, { waitUntil: 'load' });
  await pause(page, 1500);
  await page.screenshot({ path: `screenshots/flow-parent-child.png`, fullPage: true });
}

await browser.close();
console.log(`done ${which}`);
if (errors.length) console.log([...new Set(errors)].slice(0, 20).join('\n'));
