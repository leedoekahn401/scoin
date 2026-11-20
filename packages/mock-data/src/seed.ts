import {
  CardStatus,
  LedgerType,
  NotificationType,
  OrderStatus,
  RequestStatus,
  Role,
  SepayTxStatus,
  TopUpStatus,
  UserStatus,
  VND_PER_CREDIT,
  addDays,
  vnDate,
  vnDayStart,
  type Card,
  type LedgerEntry,
  type MenuItem,
  type Order,
  type OrderItem,
} from '@schoolcoin/types';

import { DB_VERSION, type DbState, type StudentRecord, type UserRecord } from './state';

/**
 * Deterministic demo data following SRS §B10, scaled up enough that the
 * admin tables and reports look like a real term: 4 staff roles, parents with
 * the "two parents / two children" edge cases, 24 students in 4 classes, the
 * 15-item menu, and 14 days of orders and top-ups whose ledger always sums to
 * the wallet balance (FR-WAL-05).
 *
 * Everything is generated RELATIVE TO `now`, so a fresh seed always has
 * "today" and "this week" data for the dashboard.
 */

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_KIOSK_KEY = 'demo-kiosk-key';
export const DEMO_INVITE_CODE = 'DEMO2026';
export const DEMO_WEBHOOK_KEY = 'demo-sepay-key';

export interface DemoAccount {
  role: Role;
  label: string;
  identifier: string;
  password: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: Role.ADMIN,
    label: 'Hội đồng trường',
    identifier: 'admin@schoolcoin.vn',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.ACCOUNTANT,
    label: 'Kế toán',
    identifier: 'ketoan@schoolcoin.vn',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.CAFE_MANAGER,
    label: 'Quản lý căng tin',
    identifier: 'quanly@schoolcoin.vn',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.CASHIER,
    label: 'Thu ngân ca sáng',
    identifier: 'thungan1',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.CASHIER,
    label: 'Thu ngân ca trưa',
    identifier: 'thungan2',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.PARENT,
    label: 'Phụ huynh (2 con)',
    identifier: 'lan.nguyen@gmail.com',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.PARENT,
    label: 'Phụ huynh',
    identifier: 'minh.tran@gmail.com',
    password: DEMO_PASSWORD,
  },
  {
    role: Role.PARENT,
    label: 'Phụ huynh (chung con)',
    identifier: 'hung.le@gmail.com',
    password: DEMO_PASSWORD,
  },
];

/* ────────────────────────────── PRNG ────────────────────────────── */

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ───────────────────────────── Fixtures ───────────────────────────── */

const CATEGORIES = [
  { id: 'cat_main', name: 'Món chính', sortOrder: 1 },
  { id: 'cat_snack', name: 'Ăn nhẹ', sortOrder: 2 },
  { id: 'cat_drink', name: 'Đồ uống', sortOrder: 3 },
  { id: 'cat_dessert', name: 'Tráng miệng', sortOrder: 4 },
];

const ITEMS: { id: string; categoryId: string; name: string; price: number }[] = [
  { id: 'item_comga', categoryId: 'cat_main', name: 'Cơm gà', price: 30 },
  { id: 'item_phobo', categoryId: 'cat_main', name: 'Phở bò', price: 35 },
  { id: 'item_buncha', categoryId: 'cat_main', name: 'Bún chả', price: 32 },
  { id: 'item_mixao', categoryId: 'cat_main', name: 'Mì xào hải sản', price: 28 },
  { id: 'item_comtam', categoryId: 'cat_main', name: 'Cơm tấm sườn', price: 30 },
  { id: 'item_banhmi', categoryId: 'cat_snack', name: 'Bánh mì', price: 15 },
  { id: 'item_xoiga', categoryId: 'cat_snack', name: 'Xôi gà', price: 18 },
  { id: 'item_banhbao', categoryId: 'cat_snack', name: 'Bánh bao', price: 12 },
  { id: 'item_suadaunanh', categoryId: 'cat_drink', name: 'Sữa đậu nành', price: 8 },
  { id: 'item_nuocsuoi', categoryId: 'cat_drink', name: 'Nước suối', price: 5 },
  { id: 'item_nuoccam', categoryId: 'cat_drink', name: 'Nước cam', price: 15 },
  { id: 'item_trasua', categoryId: 'cat_drink', name: 'Trà sữa', price: 20 },
  { id: 'item_suachua', categoryId: 'cat_dessert', name: 'Sữa chua', price: 10 },
  { id: 'item_che', categoryId: 'cat_dessert', name: 'Chè đậu xanh', price: 12 },
  { id: 'item_traicay', categoryId: 'cat_dessert', name: 'Trái cây', price: 15 },
];

const STUDENT_NAMES: { name: string; className: string }[] = [
  { name: 'Nguyễn Minh Anh', className: '6A1' },
  { name: 'Nguyễn Gia Bảo', className: '8A1' },
  { name: 'Trần Khánh Linh', className: '6A1' },
  { name: 'Lê Hoàng Nam', className: '7A2' },
  { name: 'Phạm Thu Hà', className: '6A1' },
  { name: 'Hoàng Đức Huy', className: '6A1' },
  { name: 'Vũ Ngọc Diệp', className: '6A1' },
  { name: 'Đặng Quang Vinh', className: '6A1' },
  { name: 'Bùi Thảo My', className: '6A2' },
  { name: 'Đỗ Tuấn Kiệt', className: '6A2' },
  { name: 'Hồ Bảo Ngọc', className: '6A2' },
  { name: 'Ngô Minh Khôi', className: '6A2' },
  { name: 'Dương Thanh Trúc', className: '6A2' },
  { name: 'Lý Hải Đăng', className: '6A2' },
  { name: 'Phan Mai Chi', className: '7A2' },
  { name: 'Võ Nhật Minh', className: '7A2' },
  { name: 'Trương An Nhiên', className: '7A2' },
  { name: 'Đinh Phúc Lâm', className: '7A2' },
  { name: 'Mai Tường Vy', className: '7A2' },
  { name: 'Cao Đăng Khoa', className: '8A1' },
  { name: 'Lâm Ngọc Hân', className: '8A1' },
  { name: 'Tạ Quốc Bình', className: '8A1' },
  { name: 'Châu Gia Hân', className: '8A1' },
  { name: 'Kiều Minh Trí', className: '8A1' },
];

/* ───────────────────────────── Builder ───────────────────────────── */

export function createSeed(now: Date = new Date()): DbState {
  const rand = mulberry32(20261119);
  const pick = <T>(list: readonly T[]): T => list[Math.floor(rand() * list.length)] as T;
  const int = (min: number, max: number) => min + Math.floor(rand() * (max - min + 1));
  const nowIso = now.toISOString();
  const today = vnDate(now);

  let seq = 1000;
  const nextId = (prefix: string) => `${prefix}_${(seq++).toString(36)}`;
  let codeSeq = 0;
  const paymentCode = () =>
    `SC${(48213907 + codeSeq++ * 7919).toString().slice(-8).padStart(8, '0')}`;
  const cardCode = () => {
    let out = '';
    for (let i = 0; i < 16; i++) out += '0123456789ABCDEF'[Math.floor(rand() * 16)];
    return out;
  };

  /** An instant on VN date `date` at hh:mm local time. */
  const at = (date: string, hh: number, mm: number) =>
    new Date(vnDayStart(date).getTime() + (hh * 60 + mm) * 60_000).toISOString();
  const createdLongAgo = at(addDays(today, -60), 8, 0);

  const db: DbState = {
    version: DB_VERSION,
    seq: 0,
    receiptSeq: 1040,
    users: [],
    students: [],
    parentStudents: [],
    invites: [],
    cards: [],
    wallets: [],
    ledger: [],
    categories: CATEGORIES.map((c) => ({ ...c, archived: false })),
    items: ITEMS.map((i): MenuItem => ({
      id: i.id,
      categoryId: i.categoryId,
      name: i.name,
      priceCredits: i.price,
      imageUrl: null,
      available: true,
      soldOutDate: null,
      archived: false,
    })),
    orders: [],
    topUps: [],
    sepayTransactions: [],
    requests: [],
    refunds: [],
    adjustments: [],
    notifications: [],
    kioskDevices: [
      {
        id: 'kiosk_hall_a',
        name: 'Kiosk sảnh A',
        key: DEMO_KIOSK_KEY,
        active: true,
        lastSeenAt: nowIso,
        createdAt: createdLongAgo,
      },
      {
        id: 'kiosk_library',
        name: 'Kiosk thư viện',
        key: 'library-kiosk-key',
        active: true,
        lastSeenAt: at(addDays(today, -1), 15, 40),
        createdAt: createdLongAgo,
      },
    ],
    kioskSessions: [],
    auditLogs: [],
    settings: {
      pinThresholdCredits: 50,
      topUpMinCredits: 10,
      topUpMaxCredits: 2000,
      topUpExpiryMinutes: 30,
      bank: {
        bankName: 'MBBank',
        accountNumber: '0968123456',
        accountHolder: 'TRUONG THCS NGUYEN DU',
      },
    },
    sessions: [],
  };

  // The ordered sold-out item makes the POS "hidden when unavailable" rule visible.
  const soldOut = db.items.find((i) => i.id === 'item_che');
  if (soldOut) soldOut.soldOutDate = today;

  /* ── Users ── */
  const user = (
    id: string,
    role: Role,
    fullName: string,
    login: { email?: string; username?: string },
    phone: string | null = null,
  ): UserRecord => ({
    id,
    role,
    fullName,
    email: login.email ?? null,
    username: login.username ?? null,
    phone,
    status: UserStatus.ACTIVE,
    createdAt: createdLongAgo,
    password: DEMO_PASSWORD,
    failedLogins: 0,
    lockedUntil: null,
    emailPrefs:
      role === Role.PARENT
        ? { TOPUP_PAID: true, LOW_BALANCE: true, NEW_REQUEST: true, CARD_LOCKED: true }
        : null,
  });

  db.users.push(
    user(
      'usr_admin',
      Role.ADMIN,
      'Nguyễn Văn Thành',
      { email: 'admin@schoolcoin.vn' },
      '0903111222',
    ),
    user(
      'usr_acct',
      Role.ACCOUNTANT,
      'Trần Thị Hồng',
      { email: 'ketoan@schoolcoin.vn' },
      '0903222333',
    ),
    user(
      'usr_mgr',
      Role.CAFE_MANAGER,
      'Lê Văn Phúc',
      { email: 'quanly@schoolcoin.vn' },
      '0903333444',
    ),
    user('usr_cash1', Role.CASHIER, 'Phạm Thị Mai', { username: 'thungan1' }),
    user('usr_cash2', Role.CASHIER, 'Hoàng Văn Tâm', { username: 'thungan2' }),
    user(
      'usr_p_lan',
      Role.PARENT,
      'Nguyễn Thị Lan',
      { email: 'lan.nguyen@gmail.com' },
      '0912345678',
    ),
    user(
      'usr_p_minh',
      Role.PARENT,
      'Trần Quốc Minh',
      { email: 'minh.tran@gmail.com' },
      '0987654321',
    ),
    user('usr_p_hung', Role.PARENT, 'Lê Văn Hùng', { email: 'hung.le@gmail.com' }, '0977112233'),
    user('usr_p_thu', Role.PARENT, 'Lê Thị Thu', { email: 'thu.le@gmail.com' }, '0977445566'),
    user('usr_p_hoa', Role.PARENT, 'Phạm Thanh Hoa', { email: 'hoa.pham@gmail.com' }, '0909887766'),
    user(
      'usr_p_dung',
      Role.PARENT,
      'Hoàng Tiến Dũng',
      { email: 'dung.hoang@gmail.com' },
      '0911223344',
    ),
  );
  const deactivated = user('usr_cash_old', Role.CASHIER, 'Đỗ Văn Sơn', { username: 'thungan_cu' });
  deactivated.status = UserStatus.DEACTIVATED;
  db.users.push(deactivated);

  /* ── Students, wallets, cards ── */
  STUDENT_NAMES.forEach((s, index) => {
    const id = `stu_${String(index + 1).padStart(2, '0')}`;
    const record: StudentRecord = {
      id,
      studentCode: `HS${String(2026001 + index)}`,
      fullName: s.name,
      className: s.className,
      photoUrl: null,
      active: true,
      pin: '1234',
      pinFailedCount: 0,
      pinLockedUntil: null,
      dailyLimitCredits: index % 3 === 0 ? 60 : index % 3 === 1 ? null : 80,
      lowBalanceThreshold: index % 2 === 0 ? 30 : null,
      lowBalanceAlerted: false,
      createdAt: createdLongAgo,
    };
    db.students.push(record);
    db.wallets.push({ id: `wal_${id}`, studentId: id, balanceCredits: 0 });
    db.cards.push({
      id: `card_${id}`,
      studentId: id,
      code: cardCode(),
      status: CardStatus.ACTIVE,
      issuedAt: createdLongAgo,
      issuedById: 'usr_admin',
    });
  });

  // Demo-script student (Minh Anh): daily limit 40, alert at 20, set in §B13 step 2.
  const minhAnh = db.students[0]!;
  minhAnh.dailyLimitCredits = 40;
  minhAnh.lowBalanceThreshold = 20;

  // One lost card that was replaced, one locked card awaiting replacement.
  const replacedFor = db.students[5]!;
  const replacedCard = db.cards.find((c) => c.studentId === replacedFor.id)!;
  replacedCard.status = CardStatus.REPLACED;
  db.cards.push({
    id: `card_${replacedFor.id}_2`,
    studentId: replacedFor.id,
    code: cardCode(),
    status: CardStatus.ACTIVE,
    issuedAt: at(addDays(today, -9), 10, 15),
    issuedById: 'usr_admin',
  });
  const lockedFor = db.students[13]!;
  db.cards.find((c) => c.studentId === lockedFor.id)!.status = CardStatus.LOCKED;

  // A student without a PIN yet, and one with no parent linked.
  db.students[22]!.pin = null;

  /* ── Families ── */
  const link = (parentId: string, studentIndex: number) =>
    db.parentStudents.push({
      parentId,
      studentId: db.students[studentIndex]!.id,
      linkedAt: createdLongAgo,
    });
  link('usr_p_lan', 0); // Lan → Minh Anh (6A1)
  link('usr_p_lan', 1); // Lan → Gia Bảo (8A1): one parent, two children
  link('usr_p_minh', 2); // Minh → Khánh Linh
  link('usr_p_hung', 3); // Hùng + Thu → Hoàng Nam: one student, two parents
  link('usr_p_thu', 3);
  link('usr_p_hoa', 4);
  link('usr_p_dung', 5);
  for (let i = 6; i < 22; i++) {
    // Remaining students share the generic parents so every wallet has a payer.
    link(pick(['usr_p_hoa', 'usr_p_dung', 'usr_p_minh']), i);
  }

  db.invites.push(
    {
      code: DEMO_INVITE_CODE,
      studentId: db.students[22]!.id,
      expiresAt: new Date(now.getTime() + 14 * 86_400_000).toISOString(),
      usedById: null,
      usedAt: null,
      createdAt: nowIso,
    },
    {
      code: 'LINK8A1X',
      studentId: db.students[23]!.id,
      expiresAt: new Date(now.getTime() + 10 * 86_400_000).toISOString(),
      usedById: null,
      usedAt: null,
      createdAt: nowIso,
    },
  );

  /* ── Money history ── */
  const wallet = (studentId: string) => db.wallets.find((w) => w.studentId === studentId)!;
  const parentOf = (studentId: string) =>
    db.parentStudents.find((l) => l.studentId === studentId)?.parentId ?? 'usr_p_hoa';
  const activeCard = (studentId: string): Card =>
    db.cards.find((c) => c.studentId === studentId && c.status !== CardStatus.REPLACED)!;

  const post = (
    studentId: string,
    type: LedgerType,
    amount: number,
    refType: LedgerEntry['refType'],
    refId: string,
    actorId: string | null,
    createdAt: string,
    note: string | null = null,
  ) => {
    const w = wallet(studentId);
    w.balanceCredits += amount;
    db.ledger.push({
      id: nextId('led'),
      walletId: w.id,
      type,
      amountCredits: amount,
      balanceAfter: w.balanceCredits,
      refType,
      refId,
      actorId,
      note,
      createdAt,
    });
  };

  const sepayTopUp = (studentId: string, credits: number, createdAt: string) => {
    const topUpId = nextId('top');
    const code = paymentCode();
    const paidAt = new Date(Date.parse(createdAt) + int(2, 9) * 60_000).toISOString();
    const student = db.students.find((s) => s.id === studentId)!;
    const txId = String(9_100_000 + seq);
    db.topUps.push({
      id: topUpId,
      studentId,
      studentName: student.fullName,
      parentId: parentOf(studentId),
      amountCredits: credits,
      amountVnd: credits * VND_PER_CREDIT,
      paymentCode: code,
      status: TopUpStatus.PAID,
      expiresAt: new Date(Date.parse(createdAt) + 30 * 60_000).toISOString(),
      paidAt,
      needsReview: false,
      creditRequestId: null,
      createdAt,
    });
    db.sepayTransactions.push({
      id: txId,
      gateway: 'MBBank',
      transactionDate: paidAt,
      accountNumber: db.settings.bank.accountNumber,
      code,
      content: `${code} nap tien ${student.fullName}`,
      description: `BankAPINotify ${code} nap tien`,
      transferType: 'in',
      transferAmountVnd: credits * VND_PER_CREDIT,
      referenceCode: `FT${txId}`,
      status: SepayTxStatus.MATCHED,
      topUpId,
      creditedCredits: credits,
      remainderVnd: 0,
      resolvedById: null,
      resolvedByName: null,
      resolvedAt: null,
      resolutionNote: null,
      studentId,
      studentName: student.fullName,
    });
    post(studentId, LedgerType.TOPUP_SEPAY, credits, 'TOP_UP', topUpId, null, paidAt);
  };

  const cashTopUp = (studentId: string, credits: number, createdAt: string) => {
    const receipt = `PT${String(db.receiptSeq++).padStart(6, '0')}`;
    post(
      studentId,
      LedgerType.TOPUP_CASH,
      credits,
      'TOP_UP',
      receipt,
      'usr_acct',
      createdAt,
      'Nạp tiền mặt tại văn phòng',
    );
  };

  const cashierName = (id: string) => db.users.find((u) => u.id === id)!.fullName;
  const buyable = db.items.filter((i) => i.id !== 'item_che');
  const mains = buyable.filter((i) => i.categoryId === 'cat_main');
  const sides = buyable.filter((i) => i.categoryId !== 'cat_main');

  const placeOrder = (studentId: string, date: string, slot: 'breakfast' | 'lunch') => {
    const student = db.students.find((s) => s.id === studentId)!;
    const lines: { item: MenuItem; qty: number }[] =
      slot === 'lunch'
        ? [{ item: pick(mains), qty: 1 }, ...(rand() < 0.6 ? [{ item: pick(sides), qty: 1 }] : [])]
        : [{ item: pick(sides), qty: rand() < 0.2 ? 2 : 1 }];
    const total = lines.reduce((sum, l) => sum + l.item.priceCredits * l.qty, 0);
    const w = wallet(studentId);
    if (w.balanceCredits < total) return;
    if (student.dailyLimitCredits !== null) {
      const spent = db.orders
        .filter((o) => o.studentId === studentId && vnDate(o.createdAt) === date)
        .reduce((s, o) => s + o.totalCredits, 0);
      if (spent + total > student.dailyLimitCredits) return;
    }
    const createdAt = slot === 'lunch' ? at(date, 11, int(0, 75)) : at(date, 6, int(35, 55));
    if (Date.parse(createdAt) > now.getTime()) return;
    const orderId = nextId('ord');
    const cashierId = slot === 'lunch' ? 'usr_cash2' : 'usr_cash1';
    const items: OrderItem[] = lines.map((l) => ({
      id: nextId('oi'),
      orderId,
      menuItemId: l.item.id,
      nameSnapshot: l.item.name,
      unitPriceCredits: l.item.priceCredits,
      quantity: l.qty,
    }));
    const order: Order = {
      id: orderId,
      studentId,
      studentName: student.fullName,
      className: student.className,
      cardId: activeCard(studentId).id,
      cashierId,
      cashierName: cashierName(cashierId),
      totalCredits: total,
      status: OrderStatus.COMPLETED,
      pinVerified: total > db.settings.pinThresholdCredits,
      idempotencyKey: `seed-${orderId}`,
      voidedAt: null,
      voidedById: null,
      voidReason: null,
      createdAt,
      items,
    };
    db.orders.push(order);
    post(studentId, LedgerType.PURCHASE, -total, 'ORDER', orderId, cashierId, createdAt);
  };

  // Day −14: opening top-ups for everyone.
  const start = addDays(today, -14);
  db.students.forEach((s, i) => {
    const amount = pick([100, 200, 200, 300, 500]);
    const when = at(start, 19 + (i % 3), int(0, 50));
    if (i % 5 === 4) cashTopUp(s.id, amount, when);
    else sepayTopUp(s.id, amount, when);
  });

  // Days −13 … today: school days (Mon–Fri) get orders; low wallets get topped up.
  for (let d = -13; d <= 0; d++) {
    const date = addDays(today, d);
    const weekday = new Date(`${date}T12:00:00Z`).getUTCDay();
    const schoolDay = weekday >= 1 && weekday <= 5;
    db.students.forEach((s, i) => {
      if (!schoolDay && d !== 0) return;
      if (s.id === lockedFor.id && d > -3) return;
      // Minh Anh is the §B13 demo student: keep today's allowance untouched.
      if (i === 0 && d === 0) return;
      if (rand() < 0.35) placeOrder(s.id, date, 'breakfast');
      if (rand() < 0.85) placeOrder(s.id, date, 'lunch');
      const w = wallet(s.id);
      if (w.balanceCredits < 40 && rand() < 0.7 && d < 0 && i !== 0) {
        const when = at(date, 20, int(0, 40));
        if (i % 6 === 5) cashTopUp(s.id, 200, when);
        else sepayTopUp(s.id, pick([100, 200, 300]), when);
      }
    });
  }

  // A voided order from today with its reversal (FR-POS-07).
  const voidable = db.orders.filter((o) => vnDate(o.createdAt) === today).at(-1);
  if (voidable) {
    voidable.status = OrderStatus.VOIDED;
    voidable.voidedAt = new Date(Date.parse(voidable.createdAt) + 4 * 60_000).toISOString();
    voidable.voidedById = voidable.cashierId;
    voidable.voidReason = 'Bấm nhầm món';
    post(
      voidable.studentId,
      LedgerType.VOID_REVERSAL,
      voidable.totalCredits,
      'ORDER',
      voidable.id,
      voidable.cashierId,
      voidable.voidedAt,
      'Bấm nhầm món',
    );
  }

  // Minh Anh starts the demo low so the low-balance alert and the request flow are visible.
  // The adjustment is stamped AFTER her last entry so balanceAfter stays chronological.
  const maWallet = wallet(minhAnh.id);
  if (maWallet.balanceCredits !== 26) {
    const delta = 26 - maWallet.balanceCredits;
    const lastEntry = db.ledger.filter((l) => l.walletId === maWallet.id).at(-1);
    const adjustedAt = new Date(
      Math.min(now.getTime() - 60_000, Date.parse(lastEntry?.createdAt ?? nowIso) + 90 * 60_000),
    ).toISOString();
    const reason = 'Điều chỉnh theo đối soát sổ quỹ';
    post(
      minhAnh.id,
      LedgerType.ADJUSTMENT,
      delta,
      'ADJUSTMENT',
      'adj_seed_ma',
      'usr_acct',
      adjustedAt,
      reason,
    );
    db.adjustments.push({
      id: 'adj_seed_ma',
      studentId: minhAnh.id,
      studentName: minhAnh.fullName,
      amountCredits: delta,
      reason,
      createdById: 'usr_acct',
      createdByName: 'Trần Thị Hồng',
      createdAt: adjustedAt,
    });
  }
  const past = (iso: string) =>
    new Date(Math.min(Date.parse(iso), now.getTime() - 5 * 60_000)).toISOString();

  // A pending top-up the parent left open (UC-04 3a) and an expired one.
  const pendingCreated = new Date(now.getTime() - 6 * 60_000).toISOString();
  const pendingCode = paymentCode();
  db.topUps.push({
    id: 'top_pending_demo',
    studentId: db.students[1]!.id,
    studentName: db.students[1]!.fullName,
    parentId: 'usr_p_lan',
    amountCredits: 200,
    amountVnd: 200_000,
    paymentCode: pendingCode,
    status: TopUpStatus.PENDING,
    expiresAt: new Date(Date.parse(pendingCreated) + 30 * 60_000).toISOString(),
    paidAt: null,
    needsReview: false,
    creditRequestId: null,
    createdAt: pendingCreated,
  });
  const expiredCreated = at(addDays(today, -3), 20, 5);
  db.topUps.push({
    id: nextId('top'),
    studentId: minhAnh.id,
    studentName: minhAnh.fullName,
    parentId: 'usr_p_lan',
    amountCredits: 100,
    amountVnd: 100_000,
    paymentCode: paymentCode(),
    status: TopUpStatus.EXPIRED,
    expiresAt: new Date(Date.parse(expiredCreated) + 30 * 60_000).toISOString(),
    paidAt: null,
    needsReview: false,
    creditRequestId: null,
    createdAt: expiredCreated,
  });

  // A top-up paid with the wrong amount → needsReview with a remainder (BR-06).
  {
    const s = db.students[7]!;
    const topUpId = nextId('top');
    const code = paymentCode();
    const createdAt = at(addDays(today, -1), 19, 12);
    const paidAt = at(addDays(today, -1), 19, 16);
    db.topUps.push({
      id: topUpId,
      studentId: s.id,
      studentName: s.fullName,
      parentId: parentOf(s.id),
      amountCredits: 100,
      amountVnd: 100_000,
      paymentCode: code,
      status: TopUpStatus.PAID,
      expiresAt: new Date(Date.parse(createdAt) + 30 * 60_000).toISOString(),
      paidAt,
      needsReview: true,
      creditRequestId: null,
      createdAt,
    });
    db.sepayTransactions.push({
      id: '9188001',
      gateway: 'MBBank',
      transactionDate: paidAt,
      accountNumber: db.settings.bank.accountNumber,
      code,
      content: `${code} nap tien`,
      description: `BankAPINotify ${code}`,
      transferType: 'in',
      transferAmountVnd: 95_500,
      referenceCode: 'FT9188001',
      status: SepayTxStatus.MATCHED,
      topUpId,
      creditedCredits: 95,
      remainderVnd: 500,
      resolvedById: null,
      resolvedByName: null,
      resolvedAt: null,
      resolutionNote: null,
      studentId: s.id,
      studentName: s.fullName,
    });
    post(s.id, LedgerType.TOPUP_SEPAY, 95, 'TOP_UP', topUpId, null, paidAt);
  }

  // Unmatched and ignored payments (UC-15).
  const unmatched = (
    id: string,
    vnd: number,
    content: string,
    when: string,
    status: SepayTxStatus,
    note: string | null = null,
  ) =>
    db.sepayTransactions.push({
      id,
      gateway: pick(['MBBank', 'Vietcombank', 'Techcombank']),
      transactionDate: when,
      accountNumber: db.settings.bank.accountNumber,
      code: null,
      content,
      description: `BankAPINotify ${content}`,
      transferType: 'in',
      transferAmountVnd: vnd,
      referenceCode: `FT${id}`,
      status,
      topUpId: null,
      creditedCredits: null,
      remainderVnd: null,
      resolvedById: status === SepayTxStatus.IGNORED ? 'usr_acct' : null,
      resolvedByName: status === SepayTxStatus.IGNORED ? 'Trần Thị Hồng' : null,
      resolvedAt: status === SepayTxStatus.IGNORED ? when : null,
      resolutionNote: note,
      studentId: null,
      studentName: null,
    });
  unmatched(
    '9188102',
    150_000,
    'NGUYEN VAN A chuyen tien an trua con lop 6A2',
    past(at(today, 7, 42)),
    SepayTxStatus.UNMATCHED,
  );
  unmatched(
    '9188103',
    200_000,
    'MBVCB.889211.nap tien hs Do Tuan Kiet',
    at(addDays(today, -1), 21, 3),
    SepayTxStatus.UNMATCHED,
  );
  unmatched(
    '9188104',
    1_250_000,
    'Hoc phi thang 11 Bui Thao My',
    at(addDays(today, -4), 9, 30),
    SepayTxStatus.IGNORED,
    'Học phí — không phải SchoolCoin, đã chuyển phòng tài vụ',
  );

  /* ── Credit requests ── */
  const req = (
    studentIndex: number,
    amount: number,
    note: string | null,
    status: RequestStatus,
    createdAt: string,
    decidedBy: string | null = null,
    declineReason: string | null = null,
  ) => {
    const s = db.students[studentIndex]!;
    db.requests.push({
      id: nextId('req'),
      studentId: s.id,
      studentName: s.fullName,
      amountCredits: amount,
      note,
      status,
      decidedById: decidedBy,
      decidedByName: decidedBy ? db.users.find((u) => u.id === decidedBy)!.fullName : null,
      decidedAt: decidedBy ? new Date(Date.parse(createdAt) + 3_600_000).toISOString() : null,
      declineReason,
      expiresAt: new Date(Date.parse(createdAt) + 7 * 86_400_000).toISOString(),
      createdAt,
      topUpId: null,
    });
  };
  req(
    1,
    100,
    'Con muốn mua thêm sữa buổi sáng ạ',
    RequestStatus.PENDING,
    new Date(now.getTime() - 50 * 60_000).toISOString(),
  );
  req(
    0,
    50,
    'Tuần này con có tiết thể dục chiều',
    RequestStatus.PAID,
    at(addDays(today, -5), 12, 10),
    'usr_p_lan',
  );
  req(
    0,
    200,
    null,
    RequestStatus.DECLINED,
    at(addDays(today, -3), 12, 40),
    'usr_p_lan',
    'Tuần này con đã tiêu nhiều rồi',
  );
  req(
    3,
    50,
    'Con quên mang nước',
    RequestStatus.PENDING,
    new Date(now.getTime() - 3 * 3_600_000).toISOString(),
  );

  /* ── Notifications ── */
  const notify = (
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    createdAt: string,
    read: boolean,
    data: Record<string, unknown> | null = null,
  ) =>
    db.notifications.push({
      id: nextId('ntf'),
      userId,
      type,
      title,
      body,
      data,
      readAt: read ? createdAt : null,
      createdAt,
    });
  const giaBaoReq = db.requests[0]!;
  notify(
    'usr_p_lan',
    NotificationType.NEW_REQUEST,
    'Nguyễn Gia Bảo xin thêm 100 xu',
    '“Con muốn mua thêm sữa buổi sáng ạ”',
    giaBaoReq.createdAt,
    false,
    { requestId: giaBaoReq.id, studentId: giaBaoReq.studentId },
  );
  minhAnh.lowBalanceAlerted = false;
  notify(
    'usr_p_lan',
    NotificationType.TOPUP_PAID,
    'Đã nạp 200 xu cho Nguyễn Gia Bảo',
    'Giao dịch chuyển khoản đã được ghi nhận.',
    at(addDays(today, -4), 20, 15),
    true,
    { studentId: db.students[1]!.id },
  );
  const namReq = db.requests[3]!;
  for (const p of ['usr_p_hung', 'usr_p_thu']) {
    notify(
      p,
      NotificationType.NEW_REQUEST,
      'Lê Hoàng Nam xin thêm 50 xu',
      '“Con quên mang nước”',
      namReq.createdAt,
      false,
      { requestId: namReq.id, studentId: namReq.studentId },
    );
  }
  notify(
    'usr_p_hoa',
    NotificationType.LOW_BALANCE,
    `Số dư của ${db.students[4]!.fullName} sắp hết`,
    'Số dư đã xuống dưới ngưỡng cảnh báo 30 xu.',
    at(addDays(today, -3), 11, 40),
    true,
    { studentId: db.students[4]!.id },
  );
  notify(
    parentOf(lockedFor.id),
    NotificationType.CARD_LOCKED,
    `Thẻ của ${lockedFor.fullName} đã bị khóa`,
    'Vui lòng liên hệ văn phòng để cấp thẻ mới.',
    at(addDays(today, -2), 10, 0),
    false,
    { studentId: lockedFor.id },
  );

  /* ── Audit trail ── */
  const audit = (
    actorId: string,
    action: string,
    entity: string,
    entityId: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    createdAt: string,
  ) =>
    db.auditLogs.push({
      id: nextId('aud'),
      actorId,
      actorName: db.users.find((u) => u.id === actorId)?.fullName ?? null,
      action,
      entity,
      entityId,
      before,
      after,
      ip: '10.0.0.' + int(10, 60),
      createdAt,
    });
  audit(
    'usr_admin',
    'card.replace',
    'Card',
    `card_${replacedFor.id}_2`,
    { status: 'LOST' },
    { status: 'ACTIVE' },
    at(addDays(today, -9), 10, 15),
  );
  audit(
    'usr_mgr',
    'menu.price_change',
    'MenuItem',
    'item_trasua',
    { priceCredits: 18 },
    { priceCredits: 20 },
    at(addDays(today, -6), 14, 2),
  );
  audit(
    'usr_admin',
    'settings.update',
    'Setting',
    'pinThresholdCredits',
    { value: 40 },
    { value: 50 },
    at(addDays(today, -12), 9, 0),
  );
  audit(
    'usr_acct',
    'sepay.ignore',
    'SepayTransaction',
    '9188104',
    { status: 'UNMATCHED' },
    { status: 'IGNORED' },
    at(addDays(today, -4), 9, 45),
  );
  const seedAdjustment = db.adjustments[0];
  if (seedAdjustment) {
    audit(
      'usr_acct',
      'wallet.adjust',
      'Wallet',
      `wal_${minhAnh.id}`,
      null,
      { amountCredits: seedAdjustment.amountCredits, reason: seedAdjustment.reason },
      seedAdjustment.createdAt,
    );
  }
  audit(
    parentOf(lockedFor.id),
    'card.lock',
    'Card',
    `card_${lockedFor.id}`,
    { status: 'ACTIVE' },
    { status: 'LOCKED' },
    at(addDays(today, -2), 10, 0),
  );
  audit(
    'usr_mgr',
    'user.create',
    'User',
    'usr_cash2',
    null,
    { role: 'CASHIER', username: 'thungan2' },
    at(addDays(today, -30), 8, 30),
  );
  audit('usr_admin', 'student.import', 'Student', 'batch', null, { created: 24 }, createdLongAgo);

  db.auditLogs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  db.ledger.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  // Fixtures are generated out of chronological order (e.g. yesterday's review
  // top-up after today's purchases), so recompute running balances once.
  const running = new Map<string, number>();
  for (const entry of db.ledger) {
    const next = (running.get(entry.walletId) ?? 0) + entry.amountCredits;
    running.set(entry.walletId, next);
    entry.balanceAfter = next;
  }
  db.orders.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  db.seq = seq;
  return db;
}

/** Card codes + PINs the scan simulators offer (never shown in production). */
export function demoCardsOf(db: DbState) {
  return db.students
    .filter((s) => s.active)
    .map((s) => {
      const card = db.cards.find((c) => c.studentId === s.id && c.status !== CardStatus.REPLACED);
      return card
        ? {
            cardCode: card.code,
            fullName: s.fullName,
            className: s.className,
            pin: s.pin ?? '',
            status: card.status,
          }
        : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);
}
