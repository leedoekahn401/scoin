// Walks the SRS §B13 demo script against the mock engine and checks the
// money invariants (FR-WAL-03, FR-WAL-05). Run: pnpm verify (or pnpm verify:engine)
import { MockEngine } from '../packages/api-client/src/mock/engine';
import { ApiError } from '../packages/api-client/src/errors';
import { createSeed, DEMO_KIOSK_KEY } from '../packages/mock-data/src';

let failures = 0;
const ok = (cond: unknown, label: string) => {
  if (cond) console.log(`  ✓ ${label}`);
  else {
    failures++;
    console.error(`  ✗ ${label}`);
  }
};
const expectCode = (fn: () => unknown, code: string, label: string) => {
  try {
    fn();
    ok(false, `${label} (expected ${code}, got success)`);
  } catch (e) {
    ok(
      e instanceof ApiError && e.code === code,
      `${label} → ${e instanceof ApiError ? e.code : String(e)}`,
    );
  }
};

function invariants(engine: MockEngine, label: string) {
  const { db } = engine;
  let good = true;
  for (const w of db.wallets) {
    const entries = db.ledger
      .filter((e) => e.walletId === w.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const sum = entries.reduce((s, e) => s + e.amountCredits, 0);
    if (sum !== w.balanceCredits) {
      good = false;
      console.error(`    wallet ${w.id}: balance ${w.balanceCredits} ≠ ledger ${sum}`);
    }
    let running = 0;
    for (const e of entries) {
      running += e.amountCredits;
      if (running < 0 || e.balanceAfter !== running) {
        good = false;
        console.error(
          `    wallet ${w.id}: entry ${e.id} balanceAfter ${e.balanceAfter} ≠ running ${running}`,
        );
        break;
      }
    }
  }
  ok(good, `${label}: every balance = ledger sum, never negative, balanceAfter chronological`);
}

console.log('Seed at different times of day / week');
for (const iso of [
  '2026-11-16T23:30:00Z',
  '2026-11-17T04:10:00Z',
  '2026-11-20T08:45:00Z',
  '2026-11-21T13:00:00Z',
  '2026-11-22T16:59:00Z',
]) {
  invariants(new MockEngine(createSeed(new Date(iso))), `seed @ ${iso}`);
}
const engine = new MockEngine(createSeed());
console.log('Seed');
invariants(engine, 'seed');
ok(engine.db.students.length === 24, '24 students');
ok(engine.db.items.length === 15, '15 menu items');

const login = (id: string) => ({
  accessToken: engine.login({ identifier: id, password: 'demo1234' }).accessToken,
});
const admin = login('admin@schoolcoin.vn');
const parent = login('lan.nguyen@gmail.com');
const cashier = login('thungan2');
const acct = login('ketoan@schoolcoin.vn');

console.log('1. Admin lists students and prints a card');
const students = engine.listStudents(admin, {});
ok(students.total === 24, 'admin sees 24 students');
const minhAnh = engine.db.students[0]!;
const printable = engine.printCards(admin, [minhAnh.id]);
ok(
  printable.length === 1 && printable[0]!.cardCode.length === 16,
  'printable card has a 16-hex code',
);

console.log('2. Parent sets daily limit 40 and alert at 20');
const detail = engine.updateControls(parent, minhAnh.id, {
  dailyLimitCredits: 40,
  lowBalanceThreshold: 20,
});
ok(detail.dailyLimitCredits === 40 && detail.lowBalanceThreshold === 20, 'controls saved');
const startBalance = detail.balanceCredits;

console.log('3. Parent tops up 100 → simulated SePay transfer → PAID');
const checkout = engine.createTopUp(parent, { studentId: minhAnh.id, amountCredits: 100 });
ok(/^SC\d{8}$/.test(checkout.paymentCode), `payment code ${checkout.paymentCode}`);
ok(
  checkout.qrUrl.includes('qr.sepay.vn') && checkout.amountVnd === 100_000,
  'VietQR url + 100.000 VND',
);
engine.simulateTransfer({ amountVnd: 100_000, content: `${checkout.paymentCode} nap tien` });
const event = engine.topUpEvent(checkout.id);
ok(event?.type === 'PAID' && event.creditedCredits === 100, 'top-up event PAID +100');
const dup = engine.sepayWebhook('demo-sepay-key', {
  id: engine.db.sepayTransactions.at(-1)!.id,
  gateway: 'MBBank',
  transactionDate: new Date().toISOString(),
  accountNumber: 'x',
  code: checkout.paymentCode,
  content: checkout.paymentCode,
  transferType: 'in',
  description: '',
  transferAmount: 100_000,
  referenceCode: null,
});
ok(
  dup.status === 'MATCHED' &&
    engine.getChild(parent, minhAnh.id).balanceCredits === startBalance + 100,
  'duplicate webhook changes nothing (NFR-REL-03)',
);
expectCode(
  () =>
    engine.sepayWebhook('wrong', {
      id: 1,
      gateway: '',
      transactionDate: '',
      accountNumber: '',
      code: null,
      content: '',
      transferType: 'in',
      description: '',
      transferAmount: 1,
      referenceCode: null,
    }),
  'UNAUTHENTICATED',
  'bad webhook key → 401',
);

console.log('4. POS: Cơm gà + Nước suối → paid; another Cơm gà → daily limit');
const card = engine.db.cards.find((c) => c.studentId === minhAnh.id && c.status === 'ACTIVE')!;
const lookup = engine.lookup(cashier, { cardCode: card.code });
ok(lookup.remainingToday === 40, `lookup remainingToday ${lookup.remainingToday}`);
const order = engine.createOrder(cashier, {
  cardCode: card.code,
  items: [
    { menuItemId: 'item_comga', quantity: 1 },
    { menuItemId: 'item_nuocsuoi', quantity: 1 },
  ],
  idempotencyKey: 'demo-order-1',
});
ok(order.order.totalCredits === 35 && order.remainingToday === 5, 'charged 35, 5 left today');
const retry = engine.createOrder(cashier, {
  cardCode: card.code,
  items: [{ menuItemId: 'item_comga', quantity: 1 }],
  idempotencyKey: 'demo-order-1',
});
ok(
  retry.order.id === order.order.id,
  'retry with same idempotency key returns same order (NFR-REL-02)',
);
expectCode(
  () =>
    engine.createOrder(cashier, {
      cardCode: card.code,
      items: [{ menuItemId: 'item_comga', quantity: 1 }],
      idempotencyKey: 'demo-order-2',
    }),
  'DAILY_LIMIT_REACHED',
  'second Cơm gà declined',
);
expectCode(
  () =>
    engine.createOrder(cashier, {
      cardCode: card.code,
      items: [{ menuItemId: 'item_che', quantity: 1 }],
      idempotencyKey: 'demo-order-3',
    }),
  'ITEM_UNAVAILABLE',
  'sold-out item rejected',
);

console.log('   PIN threshold and lockout (BR-05, BR-11)');
const bao = engine.db.students[1]!;
const baoCard = engine.db.cards.find((c) => c.studentId === bao.id && c.status === 'ACTIVE')!;
const big = [{ menuItemId: 'item_phobo', quantity: 2 }];
expectCode(
  () =>
    engine.createOrder(cashier, { cardCode: baoCard.code, items: big, idempotencyKey: 'pin-0' }),
  'PIN_REQUIRED',
  '70-credit order needs PIN',
);
for (let i = 1; i <= 4; i++) {
  expectCode(
    () =>
      engine.createOrder(cashier, {
        cardCode: baoCard.code,
        items: big,
        pin: '0000',
        idempotencyKey: `pin-${i}`,
      }),
    'PIN_INVALID',
    `wrong PIN #${i}`,
  );
}
expectCode(
  () =>
    engine.createOrder(cashier, {
      cardCode: baoCard.code,
      items: big,
      pin: '0000',
      idempotencyKey: 'pin-5',
    }),
  'PIN_LOCKED',
  '5th wrong PIN locks',
);

console.log('   Void own order (FR-POS-07)');
const voided = engine.voidOrder(cashier, order.order.id, { reason: 'Bấm nhầm' });
ok(voided.status === 'VOIDED', 'order voided');
ok(
  engine.lookup(cashier, { cardCode: card.code }).remainingToday === 40,
  'allowance restored after void (BR-04)',
);

console.log('   Locked card');
const locked = engine.db.cards.find((c) => c.status === 'LOCKED')!;
expectCode(
  () => engine.lookup(cashier, { cardCode: locked.code }),
  'CARD_INACTIVE',
  'locked card → CARD_INACTIVE',
);

console.log('5. Kiosk: card + PIN → balance → ask for 50');
const kioskCtx = { kioskKey: DEMO_KIOSK_KEY, kioskSession: null as string | null };
expectCode(
  () => engine.kioskSignIn({ kioskKey: 'nope' }, { cardCode: card.code, pin: '1234' }),
  'KIOSK_UNKNOWN',
  'unregistered kiosk rejected',
);
const session = engine.kioskSignIn(kioskCtx, { cardCode: card.code, pin: '1234' });
kioskCtx.kioskSession = session.sessionToken;
const me = engine.kioskMe(kioskCtx);
ok(me.transactions.length === 10 && me.hasLinkedParent, 'kiosk shows last 10 transactions');
const request = engine.kioskCreateRequest(kioskCtx, { amountCredits: 50, note: 'Con cần mua vở' });
ok(request.status === 'PENDING', 'request sent');
const notes = engine.listNotifications(parent);
ok(
  notes.items.some((n) => n.type === 'NEW_REQUEST' && n.data?.requestId === request.id),
  'parent notified',
);

console.log('6. Parent approves → pays → request PAID');
const approved = engine.approveRequest(parent, request.id);
engine.simulateTransfer({ amountVnd: 50_000, content: approved.paymentCode });
ok(
  engine.listRequests(parent).find((r) => r.id === request.id)?.status === 'PAID',
  'request PAID after transfer',
);
expectCode(
  () => engine.declineRequest(parent, request.id, {}),
  'REQUEST_CLOSED',
  'answered request is closed',
);

console.log('7. Accountant: transfer with no code → unmatched → assign');
const tx = engine.simulateTransfer({ amountVnd: 120_500, content: 'chuyen tien an trua' });
ok(tx.status === 'UNMATCHED', 'no-code transfer is UNMATCHED');
const assigned = engine.assignPayment(acct, tx.id, { studentId: minhAnh.id });
ok(
  assigned.status === 'RESOLVED' &&
    assigned.creditedCredits === 120 &&
    assigned.remainderVnd === 500,
  'assigned: +120 credits, 500 ₫ remainder (BR-06)',
);

console.log('8. Reports + audit');
const dash = engine.dashboard(admin);
ok(dash.todaySalesCredits >= 0 && dash.salesLast7Days.length === 7, 'dashboard has 7-day series');
ok(
  engine.listAuditLogs(admin, {}).items.some((a) => a.action === 'sepay.assign'),
  'audit log records the assignment',
);
expectCode(() => engine.listAuditLogs(acct, {}), 'FORBIDDEN', 'accountant cannot read audit log');
expectCode(() => engine.getMenu(acct), 'FORBIDDEN', 'accountant cannot use POS');

console.log('Refunds and deactivation (BR-14)');
expectCode(
  () => engine.updateStudent(admin, minhAnh.id, { active: false }),
  'STUDENT_HAS_BALANCE',
  'cannot deactivate with balance',
);
const bal = engine.getStudent(admin, minhAnh.id).wallet.balanceCredits;
expectCode(
  () =>
    engine.createRefund(acct, { studentId: minhAnh.id, amountCredits: bal + 1, method: 'CASH' }),
  'REFUND_EXCEEDS_BALANCE',
  'refund > balance rejected',
);
engine.createRefund(acct, { studentId: minhAnh.id, amountCredits: bal, method: 'CASH' });
ok(
  engine.updateStudent(admin, minhAnh.id, { active: false }).active === false,
  'deactivated after full refund',
);

invariants(engine, 'after demo');

if (failures) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}
console.log('\nAll engine checks passed.');
