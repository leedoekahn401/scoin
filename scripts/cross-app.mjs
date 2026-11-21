// Cross-app check for `pnpm dev:demo` (all apps on the shared mock API):
// a request sent from the kiosk UI must appear in the parent app UI.
import { chromium } from 'playwright';

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const kiosk = await (
  await browser.newContext({ viewport: { width: 1280, height: 800 } })
).newPage();
await kiosk.goto('http://localhost:3003', { waitUntil: 'load', timeout: 120000 });
await kiosk.getByRole('button', { name: /Nguyễn Gia Bảo/ }).click({ timeout: 60000 });
await kiosk.waitForTimeout(2500);
await kiosk.keyboard.type('1234');
await kiosk.getByRole('button', { name: /thêm xu/ }).click({ timeout: 60000 });
await kiosk.getByRole('button', { name: /^200/ }).first().click({ timeout: 30000 });
await kiosk.locator('#kiosk-note').fill('Kiểm tra liên thông kiosk → phụ huynh');
await kiosk.getByRole('button', { name: /Gửi yêu cầu/ }).click();
await kiosk.getByText(/Đã gửi yêu cầu/).waitFor({ timeout: 30000 });
console.log('kiosk: request sent');

const parent = await (
  await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    deviceScaleFactor: 2,
  })
).newPage();
await parent.goto('http://localhost:3002/login', { waitUntil: 'load', timeout: 120000 });
await parent.locator('input[autocomplete="username"]').fill('lan.nguyen@gmail.com');
await parent.locator('input[type="password"]').fill('demo1234');
await parent.locator('button[type="submit"]').click();
await parent.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 60000 });
await parent.goto('http://localhost:3002/requests', { waitUntil: 'load', timeout: 120000 });
await parent.getByText('Kiểm tra liên thông kiosk → phụ huynh').waitFor({ timeout: 60000 });
await parent.screenshot({ path: 'screenshots/cross-app-parent-requests.png', fullPage: true });
console.log('parent: sees the kiosk request ✓');
await browser.close();
