// HTTP smoke test of the mock API through the REAL HttpApi client the apps use.
// Start the server first: pnpm --filter @schoolcoin/mock-api start
import { createHttpApi } from '../packages/api-client/src/http/client';

// TokenStore needs window storage; give Node a minimal one.
const mem = () => {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
  };
};
(globalThis as unknown as { window: unknown }).window = {
  localStorage: mem(),
  sessionStorage: mem(),
};

const base = process.env.SMOKE_BASE_URL ?? 'http://localhost:4010/api/v1';
console.log(`HTTP smoke → ${base}`);
let failed = 0;
const ok = (c: unknown, l: string) =>
  c ? console.log(`  ✓ ${l}`) : (failed++, console.error(`  ✗ ${l}`));

const parent = createHttpApi({ baseUrl: base });
await parent.dev.reset();
await parent.auth.login({ identifier: 'lan.nguyen@gmail.com', password: 'demo1234' });
const kids = await parent.parent.listChildren();
ok(kids.length === 2, 'parent has 2 children over HTTP');
const checkout = await parent.parent.createTopUp({
  studentId: kids[0]!.studentId,
  amountCredits: 100,
});
const paid = new Promise<string>((resolve) =>
  parent.parent.subscribeTopUp(checkout.id, (e) => resolve(e.type)),
);
await new Promise((r) => setTimeout(r, 300));
const hook = await fetch(`${base}/webhooks/sepay`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Apikey demo-sepay-key' },
  body: JSON.stringify({
    id: 777001,
    gateway: 'MBBank',
    transactionDate: new Date().toISOString(),
    accountNumber: '0968123456',
    code: null,
    content: `${checkout.paymentCode} nap tien`,
    transferType: 'in',
    description: '',
    transferAmount: 100000,
    referenceCode: 'FT1',
  }),
});
ok(
  hook.status === 200 && JSON.stringify(await hook.json()) === '{"success":true}',
  'webhook returns 200 {"success":true}',
);
const bad = await fetch(`${base}/webhooks/sepay`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: '{}',
});
ok(bad.status === 401, 'webhook without API key → 401');
ok(
  (await Promise.race([paid, new Promise((r) => setTimeout(() => r('timeout'), 6000))])) === 'PAID',
  'SSE delivered PAID within 5 s (FR-TOP-05)',
);

const pos = createHttpApi({ baseUrl: base });
await pos.auth.login({ identifier: 'thungan1', password: 'demo1234' });
const cards = await pos.dev.demoCards();
const card = cards[0]!;
const look = await pos.pos.lookup({ cardCode: card.cardCode });
ok(look.fullName === card.fullName, `POS lookup ${look.fullName}`);
const order = await pos.pos.createOrder({
  cardCode: card.cardCode,
  items: [{ menuItemId: 'item_comga', quantity: 1 }],
  idempotencyKey: 'smoke-1',
});
ok(order.order.totalCredits === 30, 'POS charge 30 xu');
try {
  await pos.pos.createOrder({
    cardCode: card.cardCode,
    items: [{ menuItemId: 'item_comga', quantity: 1 }],
    idempotencyKey: 'smoke-2',
  });
  ok(false, 'second order declined');
} catch (e) {
  ok(
    (e as { code?: string }).code === 'DAILY_LIMIT_REACHED',
    '422 DAILY_LIMIT_REACHED mapped to ApiError',
  );
}

const admin = createHttpApi({ baseUrl: base });
await admin.auth.login({ identifier: 'admin@schoolcoin.vn', password: 'demo1234' });
const csv = await admin.admin.exportCsv('sales');
ok(csv.startsWith('date,orders'), 'CSV export');
const kiosk = createHttpApi({ baseUrl: base, kioskKey: 'demo-kiosk-key' });
await kiosk.kiosk.signIn({ cardCode: card.cardCode, pin: card.pin });
const me = await kiosk.kiosk.me();
ok(me.fullName === card.fullName && me.transactions.length > 0, 'kiosk session over headers');

if (failed) process.exit(1);
console.log('HTTP smoke passed');
process.exit(0);
