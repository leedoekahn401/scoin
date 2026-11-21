import {
  CardStatus,
  ErrorCode,
  LedgerType,
  NotificationType,
  OrderStatus,
  PIN_LOCK_MINUTES,
  PIN_MAX_ATTEMPTS,
  PAYMENT_CODE_PATTERN,
  REQUESTS_PER_DAY,
  REQUEST_EXPIRY_DAYS,
  REQUEST_NOTE_MAX,
  RequestStatus,
  Role,
  SepayTxStatus,
  TopUpStatus,
  UserStatus,
  VND_PER_CREDIT,
  INVITE_VALID_DAYS,
  MAX_PARENTS_PER_STUDENT,
  DAILY_LIMIT_MAX,
  DAILY_LIMIT_MIN,
  KIOSK_TRANSACTIONS_SHOWN,
  addDays,
  can,
  Capability,
  dateRange,
  vnDate,
  type Adjustment,
  type AssignPaymentDto,
  type AuditLogPage,
  type AuditLogQuery,
  type BalancesReport,
  type Card,
  type CashTopUpDto,
  type CashTopUpReceipt,
  type ChangePasswordDto,
  type ChildDetail,
  type ChildSummary,
  type CreateAdjustmentDto,
  type CreateCategoryDto,
  type CreateInviteResult,
  type CreateKioskDeviceDto,
  type CreateKioskDeviceResult,
  type CreateMenuItemDto,
  type CreateOrderDto,
  type CreateOrderResult,
  type CreateRefundDto,
  type CreateStudentDto,
  type CreateTopUpDto,
  type CreateUserDto,
  type CreditRequest,
  type DashboardReport,
  type DeclineRequestDto,
  type IgnorePaymentDto,
  type ImportStudentsResult,
  type KioskCreateRequestDto,
  type KioskDevice,
  type KioskMe,
  type KioskSession,
  type KioskSignInDto,
  type LedgerEntry,
  type LinkChildDto,
  type LoginDto,
  type LoginResult,
  type Me,
  type MenuCategory,
  type MenuCategoryWithItems,
  type MenuItem,
  type Notification,
  type Order,
  type OrderItem,
  type PageQuery,
  type Paginated,
  type PosLookupDto,
  type PosLookupResult,
  type PrintableCard,
  type ReconciliationReport,
  type Refund,
  type RegisterParentDto,
  type ReportRangeQuery,
  type RequestsQuery,
  type SalesReport,
  type SepayTransaction,
  type SepayTransactionsQuery,
  type Settings,
  type Student,
  type StudentDetailAdmin,
  type StudentListItem,
  type StudentsQuery,
  type TopUp,
  type TopUpCheckout,
  type TopUpEvent,
  type TopUpReport,
  type TopUpReviewItem,
  type Transaction,
  type TransactionsQuery,
  type UpdateCategoryDto,
  type UpdateControlsDto,
  type UpdateMeDto,
  type UpdateMenuItemDto,
  type UpdateStudentDto,
  type UpdateUserDto,
  type UserProfile,
  type UsersQuery,
  type VoidOrderDto,
} from '@schoolcoin/types';
import {
  DEMO_WEBHOOK_KEY,
  createSeed,
  demoCardsOf,
  type DbState,
  type StudentRecord,
  type UserRecord,
} from '@schoolcoin/mock-data';

import type { NotificationList, PublicSettings } from '../contract';
import { fail } from '../errors';

/** Who is calling. The engine enforces the permission matrix itself (NFR-SEC-04). */
export interface Ctx {
  accessToken?: string | null;
  kioskKey?: string | null;
  kioskSession?: string | null;
  ip?: string | null;
}

export interface SepayWebhookPayload {
  id: number | string;
  gateway: string;
  transactionDate: string;
  accountNumber: string;
  subAccount?: string | null;
  code: string | null;
  content: string;
  transferType: 'in' | 'out';
  description: string;
  transferAmount: number;
  accumulated?: number;
  referenceCode: string | null;
}

const now = () => new Date();
const iso = () => now().toISOString();
const clone = <T>(value: T): T => structuredClone(value);

function paginate<T>(items: T[], query: PageQuery = {}): Paginated<T> {
  const pageSize = Math.min(Math.max(query.pageSize ?? 20, 1), 200);
  const page = Math.max(query.page ?? 1, 1);
  return {
    items: items.slice((page - 1) * pageSize, page * pageSize),
    page,
    pageSize,
    total: items.length,
  };
}

function toCsv(rows: (string | number | null)[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => {
          const text = cell === null ? '' : String(cell);
          return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
        })
        .join(','),
    )
    .join('\n');
}

function requireInt(value: unknown, field: string, min: number, max: number): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < min || value > max) {
    fail(ErrorCode.VALIDATION_FAILED, `${field} must be an integer in ${min}–${max}`, {
      field,
      min,
      max,
    });
  }
  return value;
}

function requireText(value: unknown, field: string, max = 200): string {
  if (typeof value !== 'string' || value.trim().length === 0 || value.length > max) {
    fail(ErrorCode.VALIDATION_FAILED, `${field} is required`, { field });
  }
  return value.trim();
}

/**
 * In-memory SchoolCoin backend. Holds a `DbState`, applies every SRS business
 * rule, and calls `onChange` after each mutation so the host can persist it
 * (localStorage in the browser, a JSON file in the mock server).
 */
export class MockEngine {
  db: DbState;
  private readonly onChange: (db: DbState) => void;

  constructor(db: DbState | null, onChange: (db: DbState) => void = () => {}) {
    this.db = db ?? createSeed();
    this.onChange = onChange;
  }

  /* ───────────────────────── internals ───────────────────────── */

  private commit<T>(result: T): T {
    this.onChange(this.db);
    return clone(result);
  }

  private id(prefix: string) {
    this.db.seq += 1;
    return `${prefix}_${this.db.seq.toString(36)}${Math.floor(Math.random() * 1296)
      .toString(36)
      .padStart(2, '0')}`;
  }

  /** Lazy scheduler (§B9): expire top-ups and requests whenever the engine is touched. */
  tick() {
    const t = iso();
    let changed = false;
    for (const topUp of this.db.topUps) {
      if (topUp.status === TopUpStatus.PENDING && topUp.expiresAt < t) {
        topUp.status = TopUpStatus.EXPIRED;
        changed = true;
      }
    }
    for (const req of this.db.requests) {
      if (
        (req.status === RequestStatus.PENDING || req.status === RequestStatus.APPROVED) &&
        req.expiresAt < t
      ) {
        req.status = RequestStatus.EXPIRED;
        changed = true;
      }
    }
    if (changed) this.onChange(this.db);
  }

  private user(ctx: Ctx, roles?: readonly Role[]): UserRecord {
    this.tick();
    const session = ctx.accessToken
      ? this.db.sessions.find((s) => s.token === ctx.accessToken)
      : undefined;
    const user = session ? this.db.users.find((u) => u.id === session.userId) : undefined;
    if (!user || user.status !== UserStatus.ACTIVE)
      fail(ErrorCode.UNAUTHENTICATED, 'Not signed in');
    if (roles && !roles.includes(user.role)) fail(ErrorCode.FORBIDDEN, 'Role not allowed');
    return user;
  }

  private requireCap(ctx: Ctx, capability: Capability): UserRecord {
    const user = this.user(ctx);
    if (!can(user.role, capability)) fail(ErrorCode.FORBIDDEN, 'Not permitted');
    return user;
  }

  private student(id: string): StudentRecord {
    const s = this.db.students.find((x) => x.id === id);
    if (!s) fail(ErrorCode.NOT_FOUND, 'Student not found');
    return s;
  }

  private wallet(studentId: string) {
    const w = this.db.wallets.find((x) => x.studentId === studentId);
    if (!w) fail(ErrorCode.NOT_FOUND, 'Wallet not found');
    return w;
  }

  private activeCard(studentId: string): Card | null {
    return (
      this.db.cards.find((c) => c.studentId === studentId && c.status !== CardStatus.REPLACED) ??
      null
    );
  }

  private parentsOf(studentId: string): string[] {
    return this.db.parentStudents.filter((l) => l.studentId === studentId).map((l) => l.parentId);
  }

  private assertLinked(parent: UserRecord, studentId: string) {
    if (
      !this.db.parentStudents.some((l) => l.parentId === parent.id && l.studentId === studentId)
    ) {
      fail(ErrorCode.FORBIDDEN, 'Not your child');
    }
  }

  private audit(
    actor: UserRecord | null,
    action: string,
    entity: string,
    entityId: string,
    before: Record<string, unknown> | null,
    after: Record<string, unknown> | null,
    ctx?: Ctx,
  ) {
    this.db.auditLogs.push({
      id: this.id('aud'),
      actorId: actor?.id ?? null,
      actorName: actor?.fullName ?? null,
      action,
      entity,
      entityId,
      before,
      after,
      ip: ctx?.ip ?? '127.0.0.1',
      createdAt: iso(),
    });
  }

  private notify(
    userIds: string[],
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, unknown> | null,
  ) {
    for (const userId of userIds) {
      this.db.notifications.push({
        id: this.id('ntf'),
        userId,
        type,
        title,
        body,
        data,
        readAt: null,
        createdAt: iso(),
      });
    }
  }

  /**
   * B5 money-safety pattern: one place writes a ledger entry and updates the
   * balance, refusing anything that would take it below zero (FR-WAL-03).
   */
  private post(
    studentId: string,
    type: LedgerType,
    amount: number,
    refType: LedgerEntry['refType'],
    refId: string,
    actorId: string | null,
    note: string | null = null,
  ): LedgerEntry {
    const wallet = this.wallet(studentId);
    const next = wallet.balanceCredits + amount;
    if (next < 0)
      fail(ErrorCode.INSUFFICIENT_BALANCE, 'Balance would go negative', {
        balance: wallet.balanceCredits,
        total: -amount,
      });
    wallet.balanceCredits = next;
    const entry: LedgerEntry = {
      id: this.id('led'),
      walletId: wallet.id,
      type,
      amountCredits: amount,
      balanceAfter: next,
      refType,
      refId,
      actorId,
      note,
      createdAt: iso(),
    };
    this.db.ledger.push(entry);
    const student = this.student(studentId);
    // FR-NOT-02 re-arm: back at or above the threshold → the next crossing alerts again.
    if (student.lowBalanceThreshold !== null && next >= student.lowBalanceThreshold) {
      student.lowBalanceAlerted = false;
    }
    return entry;
  }

  /** BR-04: today's purchases minus reversals of today's purchases. */
  private spentToday(studentId: string): number {
    const wallet = this.wallet(studentId);
    const today = vnDate();
    let spent = 0;
    for (const entry of this.db.ledger) {
      if (entry.walletId !== wallet.id || vnDate(entry.createdAt) !== today) continue;
      if (entry.type === LedgerType.PURCHASE) spent += -entry.amountCredits;
      if (entry.type === LedgerType.VOID_REVERSAL) spent -= entry.amountCredits;
    }
    return Math.max(spent, 0);
  }

  private remainingToday(student: StudentRecord): number | null {
    if (student.dailyLimitCredits === null) return null;
    return Math.max(student.dailyLimitCredits - this.spentToday(student.id), 0);
  }

  /** BR-11 shared PIN counter for POS and kiosk. */
  private verifyPin(student: StudentRecord, pin: string | undefined) {
    if (student.pinLockedUntil && student.pinLockedUntil > iso()) {
      fail(ErrorCode.PIN_LOCKED, 'PIN locked', { lockedUntil: student.pinLockedUntil });
    }
    if (!student.pin) fail(ErrorCode.PIN_NOT_SET, 'PIN not set');
    if (!pin) fail(ErrorCode.PIN_REQUIRED, 'PIN required');
    if (pin !== student.pin) {
      student.pinFailedCount += 1;
      if (student.pinFailedCount >= PIN_MAX_ATTEMPTS) {
        student.pinFailedCount = 0;
        student.pinLockedUntil = new Date(Date.now() + PIN_LOCK_MINUTES * 60_000).toISOString();
        this.onChange(this.db);
        fail(ErrorCode.PIN_LOCKED, 'PIN locked', { lockedUntil: student.pinLockedUntil });
      }
      this.onChange(this.db);
      fail(ErrorCode.PIN_INVALID, 'Wrong PIN', {
        attemptsLeft: PIN_MAX_ATTEMPTS - student.pinFailedCount,
      });
    }
    student.pinFailedCount = 0;
    student.pinLockedUntil = null;
  }

  private cardByCode(cardCode: string) {
    const code = cardCode.trim().toUpperCase();
    const card = this.db.cards.find((c) => c.code === code);
    if (!card) fail(ErrorCode.CARD_NOT_FOUND, 'Unknown card');
    const student = this.student(card.studentId);
    if (card.status !== CardStatus.ACTIVE || !student.active) {
      fail(ErrorCode.CARD_INACTIVE, 'Card not valid');
    }
    return { card, student };
  }

  private toMe(u: UserRecord): Me {
    return {
      id: u.id,
      role: u.role,
      email: u.email,
      username: u.username,
      phone: u.phone,
      fullName: u.fullName,
      status: u.status,
      createdAt: u.createdAt,
      emailPrefs: u.emailPrefs,
    };
  }

  private toProfile(u: UserRecord): UserProfile {
    const { emailPrefs: _p, ...profile } = this.toMe(u);
    return profile;
  }

  private toStudent(s: StudentRecord): Student {
    return {
      id: s.id,
      studentCode: s.studentCode,
      fullName: s.fullName,
      className: s.className,
      photoUrl: s.photoUrl,
      active: s.active,
      hasPin: s.pin !== null,
      pinLockedUntil: s.pinLockedUntil && s.pinLockedUntil > iso() ? s.pinLockedUntil : null,
      dailyLimitCredits: s.dailyLimitCredits,
      lowBalanceThreshold: s.lowBalanceThreshold,
      createdAt: s.createdAt,
    };
  }

  private toTransaction(entry: LedgerEntry): Transaction {
    const order =
      entry.refType === 'ORDER' ? this.db.orders.find((o) => o.id === entry.refId) : undefined;
    const actor = entry.actorId ? this.db.users.find((u) => u.id === entry.actorId) : undefined;
    return {
      ...entry,
      items: order?.items,
      actorName: actor?.fullName ?? (entry.type === LedgerType.TOPUP_SEPAY ? 'SePay' : null),
    };
  }

  private ledgerOf(studentId: string): LedgerEntry[] {
    const wallet = this.wallet(studentId);
    return this.db.ledger
      .filter((e) => e.walletId === wallet.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  private childSummary(studentId: string): ChildSummary {
    const s = this.student(studentId);
    return {
      studentId: s.id,
      fullName: s.fullName,
      className: s.className,
      photoUrl: s.photoUrl,
      balanceCredits: this.wallet(s.id).balanceCredits,
      spentTodayCredits: this.spentToday(s.id),
      dailyLimitCredits: s.dailyLimitCredits,
      lowBalanceThreshold: s.lowBalanceThreshold,
      cardStatus: this.activeCard(s.id)?.status ?? null,
      pendingRequests: this.db.requests.filter(
        (r) => r.studentId === s.id && r.status === RequestStatus.PENDING,
      ).length,
    };
  }

  private childDetail(studentId: string, viewerId: string): ChildDetail {
    const s = this.student(studentId);
    const card = this.activeCard(s.id);
    return {
      ...this.childSummary(studentId),
      studentCode: s.studentCode,
      remainingTodayCredits: this.remainingToday(s),
      card: card ? { id: card.id, status: card.status, issuedAt: card.issuedAt } : null,
      coParents: this.parentsOf(s.id)
        .filter((id) => id !== viewerId)
        .map((id) => {
          const p = this.db.users.find((u) => u.id === id)!;
          return { id: p.id, fullName: p.fullName };
        }),
    };
  }

  private checkout(topUp: TopUp): TopUpCheckout {
    const { bank } = this.db.settings;
    const qrUrl =
      `https://qr.sepay.vn/img?acc=${encodeURIComponent(bank.accountNumber)}` +
      `&bank=${encodeURIComponent(bank.bankName)}&amount=${topUp.amountVnd}` +
      `&des=${encodeURIComponent(topUp.paymentCode)}`;
    return {
      ...topUp,
      qrUrl,
      bank: bank.bankName,
      account: bank.accountNumber,
      holder: bank.accountHolder,
    };
  }

  private newPaymentCode(): string {
    for (;;) {
      const code = `SC${String(Math.floor(Math.random() * 1e8)).padStart(8, '0')}`;
      if (!this.db.topUps.some((t) => t.paymentCode === code)) return code;
    }
  }

  private startTopUp(
    parent: UserRecord,
    studentId: string,
    amount: number,
    creditRequestId: string | null,
  ) {
    const { topUpMinCredits: min, topUpMaxCredits: max, topUpExpiryMinutes } = this.db.settings;
    if (!Number.isInteger(amount) || amount < min || amount > max) {
      fail(ErrorCode.TOPUP_AMOUNT_OUT_OF_RANGE, 'Amount out of range', { min, max });
    }
    const student = this.student(studentId);
    if (!student.active) fail(ErrorCode.WALLET_INACTIVE, 'Wallet inactive');
    const topUp: TopUp = {
      id: this.id('top'),
      studentId,
      studentName: student.fullName,
      parentId: parent.id,
      amountCredits: amount,
      amountVnd: amount * VND_PER_CREDIT,
      paymentCode: this.newPaymentCode(),
      status: TopUpStatus.PENDING,
      expiresAt: new Date(Date.now() + topUpExpiryMinutes * 60_000).toISOString(),
      paidAt: null,
      needsReview: false,
      creditRequestId,
      createdAt: iso(),
    };
    this.db.topUps.push(topUp);
    return topUp;
  }

  /** Credit a top-up from an incoming transfer (B5 webhook step 4). */
  private settleTopUp(topUp: TopUp, tx: SepayTransaction) {
    const credits = Math.floor(tx.transferAmountVnd / VND_PER_CREDIT);
    tx.creditedCredits = credits;
    tx.remainderVnd = tx.transferAmountVnd % VND_PER_CREDIT;
    tx.status = SepayTxStatus.MATCHED;
    tx.topUpId = topUp.id;
    tx.studentId = topUp.studentId;
    tx.studentName = topUp.studentName;
    if (credits > 0) {
      this.post(
        topUp.studentId,
        LedgerType.TOPUP_SEPAY,
        credits,
        'TOP_UP',
        topUp.id,
        null,
        tx.content,
      );
    }
    // BR-08: a late payment for an EXPIRED top-up is still credited.
    topUp.status = TopUpStatus.PAID;
    topUp.paidAt = iso();
    topUp.needsReview = tx.transferAmountVnd !== topUp.amountVnd;
    if (topUp.creditRequestId) {
      const req = this.db.requests.find((r) => r.id === topUp.creditRequestId);
      if (req) req.status = RequestStatus.PAID;
    }
    this.notify(
      this.parentsOf(topUp.studentId),
      NotificationType.TOPUP_PAID,
      `Đã nạp ${credits} xu cho ${topUp.studentName}`,
      `Chuyển khoản ${tx.transferAmountVnd.toLocaleString('vi-VN')}₫ đã được ghi nhận.`,
      { studentId: topUp.studentId, topUpId: topUp.id },
    );
  }

  /* ─────────────────────────── public ─────────────────────────── */

  publicSettings(): PublicSettings {
    const s = this.db.settings;
    return {
      pinThresholdCredits: s.pinThresholdCredits,
      topUpMinCredits: s.topUpMinCredits,
      topUpMaxCredits: s.topUpMaxCredits,
      topUpExpiryMinutes: s.topUpExpiryMinutes,
    };
  }

  /* ───────────────────────────── auth ───────────────────────────── */

  login(dto: LoginDto): LoginResult {
    const identifier = dto.identifier.trim().toLowerCase();
    const user = this.db.users.find(
      (u) => u.email?.toLowerCase() === identifier || u.username?.toLowerCase() === identifier,
    );
    if (!user) fail(ErrorCode.INVALID_CREDENTIALS, 'Invalid credentials');
    if (user.status === UserStatus.DEACTIVATED) fail(ErrorCode.ACCOUNT_DEACTIVATED, 'Deactivated');
    if (user.lockedUntil && user.lockedUntil > iso()) {
      fail(ErrorCode.ACCOUNT_LOCKED, 'Locked', { lockedUntil: user.lockedUntil });
    }
    if (user.password !== dto.password) {
      user.failedLogins += 1;
      if (user.failedLogins >= 5) {
        user.failedLogins = 0;
        user.lockedUntil = new Date(Date.now() + 15 * 60_000).toISOString();
      }
      this.onChange(this.db);
      fail(ErrorCode.INVALID_CREDENTIALS, 'Invalid credentials');
    }
    user.failedLogins = 0;
    user.lockedUntil = null;
    const token = `tok_${crypto.randomUUID()}`;
    this.db.sessions.push({ token, userId: user.id, createdAt: iso() });
    return this.commit({ accessToken: token, expiresIn: 900, user: this.toMe(user) });
  }

  logout(ctx: Ctx) {
    this.db.sessions = this.db.sessions.filter((s) => s.token !== ctx.accessToken);
    this.commit(null);
  }

  me(ctx: Ctx): Me {
    return clone(this.toMe(this.user(ctx)));
  }

  updateMe(ctx: Ctx, dto: UpdateMeDto): Me {
    const user = this.user(ctx);
    if (dto.fullName !== undefined) user.fullName = requireText(dto.fullName, 'fullName', 100);
    if (dto.phone !== undefined) user.phone = dto.phone.trim() || null;
    if (dto.emailPrefs && user.emailPrefs)
      user.emailPrefs = { ...user.emailPrefs, ...dto.emailPrefs };
    return this.commit(this.toMe(user));
  }

  changePassword(ctx: Ctx, dto: ChangePasswordDto) {
    const user = this.user(ctx);
    if (user.password !== dto.currentPassword)
      fail(ErrorCode.INVALID_CREDENTIALS, 'Wrong password');
    if (dto.newPassword.length < 8)
      fail(ErrorCode.VALIDATION_FAILED, 'Password too short', { field: 'newPassword' });
    user.password = dto.newPassword;
    this.commit(null);
  }

  private redeemInvite(code: string) {
    const invite = this.db.invites.find((i) => i.code === code.trim().toUpperCase());
    if (!invite) fail(ErrorCode.INVITE_CODE_INVALID, 'Invalid invite');
    if (invite.usedAt) fail(ErrorCode.INVITE_USED, 'Invite used');
    if (invite.expiresAt < iso()) fail(ErrorCode.INVITE_EXPIRED, 'Invite expired');
    if (this.parentsOf(invite.studentId).length >= MAX_PARENTS_PER_STUDENT) {
      fail(ErrorCode.PARENT_LIMIT_REACHED, 'Two parents already linked');
    }
    return invite;
  }

  registerParent(dto: RegisterParentDto): LoginResult {
    const email = requireText(dto.email, 'email', 200).toLowerCase();
    if (this.db.users.some((u) => u.email?.toLowerCase() === email))
      fail(ErrorCode.EMAIL_TAKEN, 'Email taken');
    if (dto.password.length < 8)
      fail(ErrorCode.VALIDATION_FAILED, 'Password too short', { field: 'password' });
    const invite = this.redeemInvite(dto.inviteCode);
    const user: UserRecord = {
      id: this.id('usr'),
      role: Role.PARENT,
      email,
      username: null,
      phone: dto.phone.trim() || null,
      fullName: requireText(dto.fullName, 'fullName', 100),
      status: UserStatus.ACTIVE,
      createdAt: iso(),
      password: dto.password,
      failedLogins: 0,
      lockedUntil: null,
      emailPrefs: { TOPUP_PAID: true, LOW_BALANCE: true, NEW_REQUEST: true, CARD_LOCKED: true },
    };
    this.db.users.push(user);
    invite.usedById = user.id;
    invite.usedAt = iso();
    this.db.parentStudents.push({
      parentId: user.id,
      studentId: invite.studentId,
      linkedAt: iso(),
    });
    this.onChange(this.db);
    return this.login({ identifier: email, password: dto.password });
  }

  forgotPassword() {
    // The real API emails a 30-minute link (FR-AUTH-03); the mock just accepts.
  }

  resetPassword() {}

  /* ──────────────────────────── parent ──────────────────────────── */

  listChildren(ctx: Ctx): ChildSummary[] {
    const parent = this.user(ctx, [Role.PARENT]);
    return clone(
      this.db.parentStudents
        .filter((l) => l.parentId === parent.id)
        .map((l) => this.childSummary(l.studentId)),
    );
  }

  linkChild(ctx: Ctx, dto: LinkChildDto): ChildSummary {
    const parent = this.user(ctx, [Role.PARENT]);
    const invite = this.redeemInvite(dto.inviteCode);
    if (
      this.db.parentStudents.some(
        (l) => l.parentId === parent.id && l.studentId === invite.studentId,
      )
    ) {
      fail(ErrorCode.ALREADY_LINKED, 'Already linked');
    }
    invite.usedById = parent.id;
    invite.usedAt = iso();
    this.db.parentStudents.push({
      parentId: parent.id,
      studentId: invite.studentId,
      linkedAt: iso(),
    });
    return this.commit(this.childSummary(invite.studentId));
  }

  getChild(ctx: Ctx, studentId: string): ChildDetail {
    const parent = this.user(ctx, [Role.PARENT]);
    this.assertLinked(parent, studentId);
    return clone(this.childDetail(studentId, parent.id));
  }

  listTransactions(
    ctx: Ctx,
    studentId: string,
    query: TransactionsQuery = {},
  ): Paginated<Transaction> {
    const parent = this.user(ctx, [Role.PARENT]);
    this.assertLinked(parent, studentId);
    const rows = this.ledgerOf(studentId).filter((e) => {
      const d = vnDate(e.createdAt);
      if (query.from && d < query.from) return false;
      if (query.to && d > query.to) return false;
      if (query.type && e.type !== query.type) return false;
      return true;
    });
    const page = paginate(rows, query);
    return clone({ ...page, items: page.items.map((e) => this.toTransaction(e)) });
  }

  updateControls(ctx: Ctx, studentId: string, dto: UpdateControlsDto): ChildDetail {
    const parent = this.user(ctx, [Role.PARENT]);
    this.assertLinked(parent, studentId);
    const s = this.student(studentId);
    const before = {
      dailyLimitCredits: s.dailyLimitCredits,
      lowBalanceThreshold: s.lowBalanceThreshold,
    };
    if (dto.dailyLimitCredits !== undefined) {
      s.dailyLimitCredits =
        dto.dailyLimitCredits === null
          ? null
          : requireInt(
              dto.dailyLimitCredits,
              'dailyLimitCredits',
              DAILY_LIMIT_MIN,
              DAILY_LIMIT_MAX,
            );
    }
    if (dto.lowBalanceThreshold !== undefined) {
      s.lowBalanceThreshold =
        dto.lowBalanceThreshold === null
          ? null
          : requireInt(dto.lowBalanceThreshold, 'lowBalanceThreshold', 1, 10_000);
      s.lowBalanceAlerted = false;
    }
    this.audit(
      parent,
      'controls.update',
      'Student',
      s.id,
      before,
      {
        dailyLimitCredits: s.dailyLimitCredits,
        lowBalanceThreshold: s.lowBalanceThreshold,
      },
      ctx,
    );
    return this.commit(this.childDetail(studentId, parent.id));
  }

  parentLockCard(ctx: Ctx, studentId: string): ChildDetail {
    const parent = this.user(ctx, [Role.PARENT]);
    this.assertLinked(parent, studentId);
    const card = this.activeCard(studentId);
    if (card && card.status === CardStatus.ACTIVE) {
      card.status = CardStatus.LOCKED;
      const s = this.student(studentId);
      this.notify(
        this.parentsOf(studentId),
        NotificationType.CARD_LOCKED,
        `Thẻ của ${s.fullName} đã bị khóa`,
        `${parent.fullName} đã khóa thẻ. Liên hệ văn phòng để được cấp thẻ mới.`,
        { studentId },
      );
      this.audit(
        parent,
        'card.lock',
        'Card',
        card.id,
        { status: 'ACTIVE' },
        { status: 'LOCKED' },
        ctx,
      );
    }
    return this.commit(this.childDetail(studentId, parent.id));
  }

  createTopUp(ctx: Ctx, dto: CreateTopUpDto): TopUpCheckout {
    const parent = this.user(ctx, [Role.PARENT]);
    this.assertLinked(parent, dto.studentId);
    const topUp = this.startTopUp(
      parent,
      dto.studentId,
      dto.amountCredits,
      dto.creditRequestId ?? null,
    );
    return this.commit(this.checkout(topUp));
  }

  listTopUps(ctx: Ctx): TopUp[] {
    const parent = this.user(ctx, [Role.PARENT]);
    const mine = new Set(
      this.db.parentStudents.filter((l) => l.parentId === parent.id).map((l) => l.studentId),
    );
    return clone(
      this.db.topUps
        .filter((t) => mine.has(t.studentId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 30),
    );
  }

  getTopUp(ctx: Ctx, id: string): TopUpCheckout {
    const parent = this.user(ctx, [Role.PARENT]);
    const topUp = this.db.topUps.find((t) => t.id === id);
    if (!topUp) fail(ErrorCode.NOT_FOUND, 'Top-up not found');
    this.assertLinked(parent, topUp.studentId);
    return clone(this.checkout(topUp));
  }

  /** Polled by SSE/subscribe: the terminal event for a top-up, if any. */
  topUpEvent(id: string): TopUpEvent | null {
    this.tick();
    const topUp = this.db.topUps.find((t) => t.id === id);
    if (!topUp) return null;
    if (topUp.status === TopUpStatus.PAID) {
      const entry = this.db.ledger.find((e) => e.refType === 'TOP_UP' && e.refId === topUp.id);
      return {
        type: 'PAID',
        topUpId: id,
        creditedCredits: entry?.amountCredits ?? 0,
        balanceAfter: this.wallet(topUp.studentId).balanceCredits,
      };
    }
    if (topUp.status === TopUpStatus.EXPIRED) return { type: 'EXPIRED', topUpId: id };
    return null;
  }

  cancelTopUp(ctx: Ctx, id: string): TopUp {
    const parent = this.user(ctx, [Role.PARENT]);
    const topUp = this.db.topUps.find((t) => t.id === id);
    if (!topUp) fail(ErrorCode.NOT_FOUND, 'Top-up not found');
    this.assertLinked(parent, topUp.studentId);
    if (topUp.status !== TopUpStatus.PENDING) fail(ErrorCode.TOPUP_NOT_PENDING, 'Not pending');
    topUp.status = TopUpStatus.CANCELLED;
    return this.commit(topUp);
  }

  listRequests(ctx: Ctx, query: RequestsQuery = {}): CreditRequest[] {
    const parent = this.user(ctx, [Role.PARENT]);
    const mine = new Set(
      this.db.parentStudents.filter((l) => l.parentId === parent.id).map((l) => l.studentId),
    );
    return clone(
      this.db.requests
        .filter((r) => mine.has(r.studentId) && (!query.status || r.status === query.status))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  private openRequest(parent: UserRecord, id: string) {
    const req = this.db.requests.find((r) => r.id === id);
    if (!req) fail(ErrorCode.NOT_FOUND, 'Request not found');
    this.assertLinked(parent, req.studentId);
    // FR-REQ-03: once one parent answers, it is closed for the other.
    if (req.status !== RequestStatus.PENDING) fail(ErrorCode.REQUEST_CLOSED, 'Request closed');
    return req;
  }

  approveRequest(ctx: Ctx, id: string, amountCredits?: number): TopUpCheckout {
    const parent = this.user(ctx, [Role.PARENT]);
    const req = this.openRequest(parent, id);
    const topUp = this.startTopUp(
      parent,
      req.studentId,
      amountCredits ?? req.amountCredits,
      req.id,
    );
    req.status = RequestStatus.APPROVED;
    req.decidedById = parent.id;
    req.decidedByName = parent.fullName;
    req.decidedAt = iso();
    req.topUpId = topUp.id;
    return this.commit(this.checkout(topUp));
  }

  declineRequest(ctx: Ctx, id: string, dto: DeclineRequestDto): CreditRequest {
    const parent = this.user(ctx, [Role.PARENT]);
    const req = this.openRequest(parent, id);
    req.status = RequestStatus.DECLINED;
    req.decidedById = parent.id;
    req.decidedByName = parent.fullName;
    req.decidedAt = iso();
    req.declineReason = dto.reason?.trim() || null;
    return this.commit(req);
  }

  /* ───────────────────────── notifications ───────────────────────── */

  listNotifications(ctx: Ctx): NotificationList {
    const user = this.user(ctx);
    const items: Notification[] = this.db.notifications
      .filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50);
    return clone({ items, unreadCount: items.filter((n) => !n.readAt).length });
  }

  markRead(ctx: Ctx, id: string) {
    const user = this.user(ctx);
    const n = this.db.notifications.find((x) => x.id === id && x.userId === user.id);
    if (n && !n.readAt) n.readAt = iso();
    this.commit(null);
  }

  markAllRead(ctx: Ctx) {
    const user = this.user(ctx);
    for (const n of this.db.notifications) if (n.userId === user.id && !n.readAt) n.readAt = iso();
    this.commit(null);
  }

  /* ───────────────────────────── POS ───────────────────────────── */

  getMenu(ctx: Ctx): MenuCategoryWithItems[] {
    this.requireCap(ctx, Capability.POS_CHARGE);
    const today = vnDate();
    return clone(
      this.db.categories
        .filter((c) => !c.archived)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({
          ...c,
          items: this.db.items.filter(
            (i) => i.categoryId === c.id && i.available && !i.archived && i.soldOutDate !== today,
          ),
        }))
        .filter((c) => c.items.length > 0),
    );
  }

  lookup(ctx: Ctx, dto: PosLookupDto): PosLookupResult {
    this.requireCap(ctx, Capability.POS_CHARGE);
    const { student } = this.cardByCode(dto.cardCode);
    return {
      studentId: student.id,
      fullName: student.fullName,
      className: student.className,
      photoUrl: student.photoUrl,
      balance: this.wallet(student.id).balanceCredits,
      remainingToday: this.remainingToday(student),
      pinThreshold: this.db.settings.pinThresholdCredits,
      pinLocked: !!student.pinLockedUntil && student.pinLockedUntil > iso(),
    };
  }

  createOrder(ctx: Ctx, dto: CreateOrderDto): CreateOrderResult {
    const cashier = this.requireCap(ctx, Capability.POS_CHARGE);
    // B5 step 1: idempotency — a retried request returns the original order.
    const existing = this.db.orders.find((o) => o.idempotencyKey === dto.idempotencyKey);
    if (existing) {
      const s = this.student(existing.studentId);
      return clone({
        order: existing,
        balanceAfter: this.wallet(s.id).balanceCredits,
        remainingToday: this.remainingToday(s),
      });
    }
    const { card, student } = this.cardByCode(dto.cardCode);
    if (!dto.items.length) fail(ErrorCode.VALIDATION_FAILED, 'Empty cart', { field: 'items' });
    const today = vnDate();
    const unavailable: string[] = [];
    const lines = dto.items.map((line) => {
      const item = this.db.items.find((i) => i.id === line.menuItemId);
      if (!item || !item.available || item.archived || item.soldOutDate === today) {
        unavailable.push(line.menuItemId);
      }
      return { item: item!, quantity: requireInt(line.quantity, 'quantity', 1, 50) };
    });
    if (unavailable.length)
      fail(ErrorCode.ITEM_UNAVAILABLE, 'Item unavailable', { menuItemIds: unavailable });
    const total = lines.reduce((sum, l) => sum + l.item.priceCredits * l.quantity, 0);

    const pinNeeded = total > this.db.settings.pinThresholdCredits;
    if (pinNeeded) this.verifyPin(student, dto.pin);

    const remaining = this.remainingToday(student);
    if (remaining !== null && total > remaining) {
      fail(ErrorCode.DAILY_LIMIT_REACHED, 'Daily limit reached', {
        remainingToday: remaining,
        total,
        dailyLimit: student.dailyLimitCredits,
      });
    }
    const balance = this.wallet(student.id).balanceCredits;
    if (balance < total)
      fail(ErrorCode.INSUFFICIENT_BALANCE, 'Not enough credits', { balance, total });

    const orderId = this.id('ord');
    const items: OrderItem[] = lines.map((l) => ({
      id: this.id('oi'),
      orderId,
      menuItemId: l.item.id,
      nameSnapshot: l.item.name, // BR-13
      unitPriceCredits: l.item.priceCredits,
      quantity: l.quantity,
    }));
    const order: Order = {
      id: orderId,
      studentId: student.id,
      studentName: student.fullName,
      className: student.className,
      cardId: card.id,
      cashierId: cashier.id,
      cashierName: cashier.fullName,
      totalCredits: total,
      status: OrderStatus.COMPLETED,
      pinVerified: pinNeeded,
      idempotencyKey: dto.idempotencyKey,
      voidedAt: null,
      voidedById: null,
      voidReason: null,
      createdAt: iso(),
      items,
    };
    this.db.orders.push(order);
    const entry = this.post(student.id, LedgerType.PURCHASE, -total, 'ORDER', orderId, cashier.id);

    // B5 step 8 / FR-NOT-02: alert once when crossing below the threshold.
    const threshold = student.lowBalanceThreshold;
    if (
      threshold !== null &&
      balance >= threshold &&
      entry.balanceAfter < threshold &&
      !student.lowBalanceAlerted
    ) {
      student.lowBalanceAlerted = true;
      this.notify(
        this.parentsOf(student.id),
        NotificationType.LOW_BALANCE,
        `Số dư của ${student.fullName} sắp hết`,
        `Số dư còn ${entry.balanceAfter} xu, dưới ngưỡng cảnh báo ${threshold} xu.`,
        { studentId: student.id },
      );
    }
    return this.commit({
      order,
      balanceAfter: entry.balanceAfter,
      remainingToday: this.remainingToday(student),
    });
  }

  listOrders(ctx: Ctx): Order[] {
    const user = this.user(ctx);
    if (!can(user.role, Capability.POS_CHARGE) && !can(user.role, Capability.VOID_ANY_ORDER)) {
      fail(ErrorCode.FORBIDDEN, 'Not permitted');
    }
    const today = vnDate();
    const seeAll = can(user.role, Capability.VOID_ANY_ORDER);
    return clone(
      this.db.orders
        .filter((o) => vnDate(o.createdAt) === today && (seeAll || o.cashierId === user.id))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  voidOrder(ctx: Ctx, id: string, dto: VoidOrderDto): Order {
    const user = this.user(ctx);
    const order = this.db.orders.find((o) => o.id === id);
    if (!order) fail(ErrorCode.NOT_FOUND, 'Order not found');
    if (order.status === OrderStatus.VOIDED) fail(ErrorCode.ORDER_ALREADY_VOIDED, 'Already voided');
    const own = order.cashierId === user.id && can(user.role, Capability.VOID_OWN_ORDER);
    if (!own && !can(user.role, Capability.VOID_ANY_ORDER))
      fail(ErrorCode.FORBIDDEN, 'Not permitted');
    // BR-10: same VN day only.
    if (vnDate(order.createdAt) !== vnDate()) fail(ErrorCode.VOID_NOT_ALLOWED, 'Same-day only');
    const reason = requireText(dto.reason, 'reason', 200);
    order.status = OrderStatus.VOIDED;
    order.voidedAt = iso();
    order.voidedById = user.id;
    order.voidReason = reason;
    this.post(
      order.studentId,
      LedgerType.VOID_REVERSAL,
      order.totalCredits,
      'ORDER',
      order.id,
      user.id,
      reason,
    );
    this.audit(
      user,
      'order.void',
      'Order',
      order.id,
      { status: 'COMPLETED' },
      { status: 'VOIDED', reason },
      ctx,
    );
    return this.commit(order);
  }

  /* ───────────────────────────── kiosk ───────────────────────────── */

  private kioskDevice(ctx: Ctx) {
    this.tick();
    const device = this.db.kioskDevices.find((d) => d.key === ctx.kioskKey && d.active);
    if (!device) fail(ErrorCode.KIOSK_UNKNOWN, 'Unregistered kiosk');
    device.lastSeenAt = iso();
    return device;
  }

  private kioskStudent(ctx: Ctx) {
    const device = this.kioskDevice(ctx);
    const session = this.db.kioskSessions.find(
      (s) =>
        s.token === ctx.kioskSession &&
        s.deviceId === device.id &&
        !s.endedAt &&
        s.expiresAt > iso(),
    );
    if (!session) fail(ErrorCode.KIOSK_SESSION_EXPIRED, 'Kiosk session expired');
    // 2-minute sliding window (§B7).
    session.expiresAt = new Date(Date.now() + 120_000).toISOString();
    return this.student(session.studentId);
  }

  kioskSignIn(ctx: Ctx, dto: KioskSignInDto): KioskSession {
    const device = this.kioskDevice(ctx);
    const { student } = this.cardByCode(dto.cardCode);
    this.verifyPin(student, dto.pin);
    const token = `ks_${crypto.randomUUID()}`;
    const expiresAt = new Date(Date.now() + 120_000).toISOString();
    this.db.kioskSessions.push({
      token,
      deviceId: device.id,
      studentId: student.id,
      expiresAt,
      endedAt: null,
    });
    return this.commit({ sessionToken: token, expiresAt });
  }

  /** Card check before the PIN pad (the kiosk greets the student by name). */
  kioskIdentify(ctx: Ctx, cardCode: string) {
    this.kioskDevice(ctx);
    const { student } = this.cardByCode(cardCode);
    return {
      fullName: student.fullName,
      className: student.className,
      photoUrl: student.photoUrl,
      pinLockedUntil:
        student.pinLockedUntil && student.pinLockedUntil > iso() ? student.pinLockedUntil : null,
      hasPin: student.pin !== null,
    };
  }

  kioskMe(ctx: Ctx): KioskMe {
    const s = this.kioskStudent(ctx);
    const today = vnDate();
    const weekAgo = new Date(Date.now() - 7 * 86_400_000).toISOString();
    const requests = this.db.requests
      .filter((r) => r.studentId === s.id && r.createdAt >= weekAgo)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const result: KioskMe = {
      studentId: s.id,
      fullName: s.fullName,
      className: s.className,
      photoUrl: s.photoUrl,
      balanceCredits: this.wallet(s.id).balanceCredits,
      spentTodayCredits: this.spentToday(s.id),
      dailyLimitCredits: s.dailyLimitCredits,
      transactions: this.ledgerOf(s.id)
        .slice(0, KIOSK_TRANSACTIONS_SHOWN)
        .map((e) => this.toTransaction(e)),
      requests,
      requestsSentToday: this.db.requests.filter(
        (r) => r.studentId === s.id && vnDate(r.createdAt) === today,
      ).length,
      maxRequestsPerDay: REQUESTS_PER_DAY,
      hasLinkedParent: this.parentsOf(s.id).length > 0,
    };
    return this.commit(result);
  }

  kioskCreateRequest(ctx: Ctx, dto: KioskCreateRequestDto): CreditRequest {
    const s = this.kioskStudent(ctx);
    const amount = requireInt(dto.amountCredits, 'amountCredits', 1, 2000);
    const note = dto.note?.trim() || null;
    if (note && note.length > REQUEST_NOTE_MAX)
      fail(ErrorCode.VALIDATION_FAILED, 'Note too long', { field: 'note' });
    const parents = this.parentsOf(s.id);
    if (!parents.length) fail(ErrorCode.NO_PARENT_LINKED, 'No parent linked');
    const today = vnDate();
    if (
      this.db.requests.filter((r) => r.studentId === s.id && vnDate(r.createdAt) === today)
        .length >= REQUESTS_PER_DAY
    ) {
      fail(ErrorCode.REQUEST_LIMIT_REACHED, '3 per day', { maxPerDay: REQUESTS_PER_DAY });
    }
    const req: CreditRequest = {
      id: this.id('req'),
      studentId: s.id,
      studentName: s.fullName,
      amountCredits: amount,
      note,
      status: RequestStatus.PENDING,
      decidedById: null,
      decidedByName: null,
      decidedAt: null,
      declineReason: null,
      expiresAt: new Date(Date.now() + REQUEST_EXPIRY_DAYS * 86_400_000).toISOString(),
      createdAt: iso(),
      topUpId: null,
    };
    this.db.requests.push(req);
    this.notify(
      parents,
      NotificationType.NEW_REQUEST,
      `${s.fullName} xin thêm ${amount} xu`,
      note ? `“${note}”` : 'Không có lời nhắn.',
      { requestId: req.id, studentId: s.id },
    );
    return this.commit(req);
  }

  kioskSignOut(ctx: Ctx) {
    const session = this.db.kioskSessions.find((s) => s.token === ctx.kioskSession);
    if (session) session.endedAt = iso();
    this.commit(null);
  }

  /* ───────────────────────── admin: students ───────────────────────── */

  listStudents(ctx: Ctx, query: StudentsQuery = {}): Paginated<StudentListItem> {
    const user = this.user(ctx);
    if (!can(user.role, Capability.MANAGE_STUDENTS) && !can(user.role, Capability.MANAGE_MONEY)) {
      fail(ErrorCode.FORBIDDEN, 'Not permitted');
    }
    const q = query.search?.trim().toLowerCase();
    const rows = this.db.students
      .filter((s) => {
        if (query.active !== undefined && s.active !== query.active) return false;
        if (query.className && s.className !== query.className) return false;
        if (q && !s.fullName.toLowerCase().includes(q) && !s.studentCode.toLowerCase().includes(q))
          return false;
        return true;
      })
      .sort(
        (a, b) =>
          a.className.localeCompare(b.className) || a.fullName.localeCompare(b.fullName, 'vi'),
      )
      .map((s): StudentListItem => ({
        ...this.toStudent(s),
        balanceCredits: this.wallet(s.id).balanceCredits,
        cardStatus: this.activeCard(s.id)?.status ?? null,
        parentCount: this.parentsOf(s.id).length,
      }));
    return clone(paginate(rows, { pageSize: query.pageSize ?? 50, page: query.page }));
  }

  getStudent(ctx: Ctx, id: string): StudentDetailAdmin {
    const user = this.user(ctx);
    if (!can(user.role, Capability.MANAGE_STUDENTS) && !can(user.role, Capability.MANAGE_MONEY)) {
      fail(ErrorCode.FORBIDDEN, 'Not permitted');
    }
    const s = this.student(id);
    return clone({
      ...this.toStudent(s),
      wallet: this.wallet(id),
      cards: this.db.cards
        .filter((c) => c.studentId === id)
        .sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
      parents: this.db.parentStudents
        .filter((l) => l.studentId === id)
        .map((l) => {
          const p = this.db.users.find((u) => u.id === l.parentId)!;
          return {
            id: p.id,
            fullName: p.fullName,
            email: p.email,
            phone: p.phone,
            linkedAt: l.linkedAt,
          };
        }),
      invites: this.db.invites
        .filter((i) => i.studentId === id)
        .map((i) => ({ code: i.code, expiresAt: i.expiresAt, usedAt: i.usedAt })),
    });
  }

  studentTransactions(ctx: Ctx, id: string, query: PageQuery = {}): Paginated<Transaction> {
    this.getStudent(ctx, id);
    const page = paginate(this.ledgerOf(id), query);
    return clone({ ...page, items: page.items.map((e) => this.toTransaction(e)) });
  }

  createStudent(ctx: Ctx, dto: CreateStudentDto): Student {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    const code = requireText(dto.studentCode, 'studentCode', 30).toUpperCase();
    if (this.db.students.some((s) => s.studentCode === code))
      fail(ErrorCode.STUDENT_CODE_TAKEN, 'Code taken');
    const s: StudentRecord = {
      id: this.id('stu'),
      studentCode: code,
      fullName: requireText(dto.fullName, 'fullName', 100),
      className: requireText(dto.className, 'className', 20),
      photoUrl: dto.photoUrl ?? null,
      active: true,
      pin: null,
      pinFailedCount: 0,
      pinLockedUntil: null,
      dailyLimitCredits: null,
      lowBalanceThreshold: null,
      lowBalanceAlerted: false,
      createdAt: iso(),
    };
    this.db.students.push(s);
    this.db.wallets.push({ id: `wal_${s.id}`, studentId: s.id, balanceCredits: 0 }); // FR-WAL-01
    this.audit(
      admin,
      'student.create',
      'Student',
      s.id,
      null,
      { studentCode: s.studentCode, fullName: s.fullName },
      ctx,
    );
    return this.commit(this.toStudent(s));
  }

  updateStudent(ctx: Ctx, id: string, dto: UpdateStudentDto): Student {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    const s = this.student(id);
    const before = this.toStudent(s);
    if (dto.active === false && s.active) {
      const balance = this.wallet(id).balanceCredits;
      if (balance > 0) fail(ErrorCode.STUDENT_HAS_BALANCE, 'Refund first', { balance }); // BR-14
    }
    if (dto.studentCode !== undefined) {
      const code = requireText(dto.studentCode, 'studentCode', 30).toUpperCase();
      if (this.db.students.some((x) => x.studentCode === code && x.id !== id))
        fail(ErrorCode.STUDENT_CODE_TAKEN, 'Code taken');
      s.studentCode = code;
    }
    if (dto.fullName !== undefined) s.fullName = requireText(dto.fullName, 'fullName', 100);
    if (dto.className !== undefined) s.className = requireText(dto.className, 'className', 20);
    if (dto.photoUrl !== undefined) s.photoUrl = dto.photoUrl;
    if (dto.active !== undefined) s.active = dto.active;
    this.audit(
      admin,
      dto.active === false ? 'student.deactivate' : 'student.update',
      'Student',
      id,
      { ...before },
      { ...this.toStudent(s) },
      ctx,
    );
    return this.commit(this.toStudent(s));
  }

  importStudents(ctx: Ctx, csv: string): ImportStudentsResult {
    this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    const rows: ImportStudentsResult['rows'] = [];
    let created = 0;
    csv
      .split(/\r?\n/)
      .map((line) => line.trim())
      .forEach((line, index) => {
        if (!line || (index === 0 && /student|mã/i.test(line))) return;
        const [studentCode = '', fullName = '', className = '', photoUrl] = line
          .split(',')
          .map((c) => c.trim());
        try {
          this.createStudent(ctx, { studentCode, fullName, className, photoUrl: photoUrl || null });
          created += 1;
          rows.push({ line: index + 1, studentCode, ok: true });
        } catch (error) {
          rows.push({ line: index + 1, studentCode, ok: false, error: (error as Error).message });
        }
      });
    return clone({ created, rows });
  }

  issueCard(ctx: Ctx, studentId: string): Card {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    this.student(studentId);
    for (const card of this.db.cards) {
      if (card.studentId === studentId && card.status !== CardStatus.REPLACED)
        card.status = CardStatus.REPLACED; // BR-12
    }
    const bytes = crypto.getRandomValues(new Uint8Array(8)); // NFR-SEC-05: 64 bits
    const card: Card = {
      id: this.id('card'),
      studentId,
      code: Array.from(bytes, (b) => b.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase(),
      status: CardStatus.ACTIVE,
      issuedAt: iso(),
      issuedById: admin.id,
    };
    this.db.cards.push(card);
    this.audit(admin, 'card.issue', 'Card', card.id, null, { studentId }, ctx);
    return this.commit(card);
  }

  adminLockCard(ctx: Ctx, cardId: string): Card {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    const card = this.db.cards.find((c) => c.id === cardId);
    if (!card) fail(ErrorCode.NOT_FOUND, 'Card not found');
    if (card.status === CardStatus.ACTIVE) {
      card.status = CardStatus.LOCKED;
      const s = this.student(card.studentId);
      this.notify(
        this.parentsOf(s.id),
        NotificationType.CARD_LOCKED,
        `Thẻ của ${s.fullName} đã bị khóa`,
        'Nhà trường đã khóa thẻ. Thẻ mới sẽ được cấp tại văn phòng.',
        { studentId: s.id },
      );
      this.audit(
        admin,
        'card.lock',
        'Card',
        card.id,
        { status: 'ACTIVE' },
        { status: 'LOCKED' },
        ctx,
      );
    }
    return this.commit(card);
  }

  printCards(ctx: Ctx, studentIds: string[]): PrintableCard[] {
    this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    return clone(
      studentIds
        .map((id) => {
          const s = this.student(id);
          const card = this.activeCard(id);
          return card && card.status === CardStatus.ACTIVE
            ? {
                studentId: id,
                fullName: s.fullName,
                className: s.className,
                studentCode: s.studentCode,
                photoUrl: s.photoUrl,
                cardCode: card.code,
              }
            : null;
        })
        .filter((c): c is PrintableCard => c !== null),
    );
  }

  setPin(ctx: Ctx, studentId: string, pin: string) {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    if (!/^\d{4}$/.test(pin))
      fail(ErrorCode.VALIDATION_FAILED, 'PIN must be 4 digits', { field: 'pin' });
    const s = this.student(studentId);
    const hadPin = s.pin !== null;
    s.pin = pin;
    s.pinFailedCount = 0;
    s.pinLockedUntil = null;
    this.audit(admin, hadPin ? 'pin.reset' : 'pin.set', 'Student', studentId, null, null, ctx);
    this.commit(null);
  }

  createInvite(ctx: Ctx, studentId: string): CreateInviteResult {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    this.student(studentId);
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const bytes = crypto.getRandomValues(new Uint8Array(8));
    const code = Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
    const expiresAt = new Date(Date.now() + INVITE_VALID_DAYS * 86_400_000).toISOString();
    this.db.invites.push({
      code,
      studentId,
      expiresAt,
      usedById: null,
      usedAt: null,
      createdAt: iso(),
    });
    this.audit(admin, 'invite.create', 'Student', studentId, null, { code }, ctx);
    return this.commit({ code, expiresAt });
  }

  unlinkParent(ctx: Ctx, studentId: string, parentId: string) {
    const admin = this.requireCap(ctx, Capability.MANAGE_STUDENTS);
    this.db.parentStudents = this.db.parentStudents.filter(
      (l) => !(l.studentId === studentId && l.parentId === parentId),
    );
    this.audit(admin, 'family.unlink', 'Student', studentId, { parentId }, null, ctx);
    this.commit(null);
  }

  /* ───────────────────────── admin: staff ───────────────────────── */

  listUsers(ctx: Ctx, query: UsersQuery = {}): Paginated<UserProfile> {
    const user = this.user(ctx);
    const onlyCashiers = !can(user.role, Capability.MANAGE_STAFF);
    if (onlyCashiers && !can(user.role, Capability.MANAGE_CASHIERS))
      fail(ErrorCode.FORBIDDEN, 'Not permitted');
    const q = query.search?.trim().toLowerCase();
    const rows = this.db.users
      .filter((u) => u.role !== Role.PARENT || query.role === Role.PARENT)
      .filter((u) => (onlyCashiers ? u.role === Role.CASHIER : true))
      .filter((u) => (query.role ? u.role === query.role : true))
      .filter(
        (u) =>
          !q ||
          u.fullName.toLowerCase().includes(q) ||
          (u.email ?? u.username ?? '').toLowerCase().includes(q),
      )
      .map((u) => this.toProfile(u));
    return clone(paginate(rows, { pageSize: query.pageSize ?? 100, page: query.page }));
  }

  createUser(ctx: Ctx, dto: CreateUserDto): UserProfile {
    const actor = this.user(ctx);
    const allowed =
      can(actor.role, Capability.MANAGE_STAFF) ||
      (dto.role === Role.CASHIER && can(actor.role, Capability.MANAGE_CASHIERS));
    if (!allowed) fail(ErrorCode.FORBIDDEN, 'Not permitted');
    if (dto.role === Role.CASHIER) {
      const username = requireText(dto.username, 'username', 40).toLowerCase();
      if (this.db.users.some((u) => u.username === username))
        fail(ErrorCode.USERNAME_TAKEN, 'Username taken');
    } else {
      const email = requireText(dto.email, 'email', 200).toLowerCase();
      if (this.db.users.some((u) => u.email === email)) fail(ErrorCode.EMAIL_TAKEN, 'Email taken');
    }
    if (dto.password.length < 8)
      fail(ErrorCode.VALIDATION_FAILED, 'Password too short', { field: 'password' });
    const u: UserRecord = {
      id: this.id('usr'),
      role: dto.role,
      email: dto.role === Role.CASHIER ? null : (dto.email ?? '').trim().toLowerCase(),
      username: dto.role === Role.CASHIER ? (dto.username ?? '').trim().toLowerCase() : null,
      phone: dto.phone?.trim() || null,
      fullName: requireText(dto.fullName, 'fullName', 100),
      status: UserStatus.ACTIVE,
      createdAt: iso(),
      password: dto.password,
      failedLogins: 0,
      lockedUntil: null,
      emailPrefs: null,
    };
    this.db.users.push(u);
    this.audit(
      actor,
      'user.create',
      'User',
      u.id,
      null,
      { role: u.role, login: u.email ?? u.username },
      ctx,
    );
    return this.commit(this.toProfile(u));
  }

  updateUser(ctx: Ctx, id: string, dto: UpdateUserDto): UserProfile {
    const actor = this.user(ctx);
    const target = this.db.users.find((u) => u.id === id);
    if (!target) fail(ErrorCode.NOT_FOUND, 'User not found');
    const allowed =
      can(actor.role, Capability.MANAGE_STAFF) ||
      (target.role === Role.CASHIER &&
        can(actor.role, Capability.MANAGE_CASHIERS) &&
        (!dto.role || dto.role === Role.CASHIER));
    if (!allowed) fail(ErrorCode.FORBIDDEN, 'Not permitted');
    const before = this.toProfile(target);
    if (dto.fullName !== undefined) target.fullName = requireText(dto.fullName, 'fullName', 100);
    if (dto.phone !== undefined) target.phone = dto.phone.trim() || null;
    if (dto.role !== undefined) target.role = dto.role;
    if (dto.status !== undefined) target.status = dto.status;
    if (dto.password) target.password = dto.password;
    if (target.status === UserStatus.DEACTIVATED)
      this.db.sessions = this.db.sessions.filter((s) => s.userId !== id);
    this.audit(
      actor,
      dto.role ? 'user.role_change' : 'user.update',
      'User',
      id,
      { role: before.role, status: before.status },
      { role: target.role, status: target.status },
      ctx,
    );
    return this.commit(this.toProfile(target));
  }

  /* ───────────────────────── admin: menu ───────────────────────── */

  listMenu(ctx: Ctx): MenuCategoryWithItems[] {
    this.requireCap(ctx, Capability.MANAGE_MENU);
    return clone(
      [...this.db.categories]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((c) => ({ ...c, items: this.db.items.filter((i) => i.categoryId === c.id) })),
    );
  }

  createCategory(ctx: Ctx, dto: CreateCategoryDto): MenuCategory {
    const actor = this.requireCap(ctx, Capability.MANAGE_MENU);
    const c: MenuCategory = {
      id: this.id('cat'),
      name: requireText(dto.name, 'name', 60),
      sortOrder: dto.sortOrder ?? this.db.categories.length + 1,
      archived: false,
    };
    this.db.categories.push(c);
    this.audit(actor, 'menu.category_create', 'MenuCategory', c.id, null, { name: c.name }, ctx);
    return this.commit(c);
  }

  updateCategory(ctx: Ctx, id: string, dto: UpdateCategoryDto): MenuCategory {
    const actor = this.requireCap(ctx, Capability.MANAGE_MENU);
    const c = this.db.categories.find((x) => x.id === id);
    if (!c) fail(ErrorCode.NOT_FOUND, 'Category not found');
    const before = { ...c };
    if (dto.name !== undefined) c.name = requireText(dto.name, 'name', 60);
    if (dto.sortOrder !== undefined) c.sortOrder = dto.sortOrder;
    if (dto.archived !== undefined) c.archived = dto.archived;
    this.audit(actor, 'menu.category_update', 'MenuCategory', id, before, { ...c }, ctx);
    return this.commit(c);
  }

  createItem(ctx: Ctx, dto: CreateMenuItemDto): MenuItem {
    const actor = this.requireCap(ctx, Capability.MANAGE_MENU);
    if (!this.db.categories.some((c) => c.id === dto.categoryId))
      fail(ErrorCode.VALIDATION_FAILED, 'Unknown category', { field: 'categoryId' });
    const item: MenuItem = {
      id: this.id('item'),
      categoryId: dto.categoryId,
      name: requireText(dto.name, 'name', 80),
      priceCredits: requireInt(dto.priceCredits, 'priceCredits', 1, 1000),
      imageUrl: dto.imageUrl ?? null,
      available: dto.available ?? true,
      soldOutDate: null,
      archived: false,
    };
    this.db.items.push(item);
    this.audit(
      actor,
      'menu.item_create',
      'MenuItem',
      item.id,
      null,
      { name: item.name, priceCredits: item.priceCredits },
      ctx,
    );
    return this.commit(item);
  }

  updateItem(ctx: Ctx, id: string, dto: UpdateMenuItemDto): MenuItem {
    const actor = this.requireCap(ctx, Capability.MANAGE_MENU);
    const item = this.db.items.find((x) => x.id === id);
    if (!item) fail(ErrorCode.NOT_FOUND, 'Item not found');
    const before = { ...item };
    if (dto.name !== undefined) item.name = requireText(dto.name, 'name', 80);
    if (dto.categoryId !== undefined) item.categoryId = dto.categoryId;
    if (dto.priceCredits !== undefined)
      item.priceCredits = requireInt(dto.priceCredits, 'priceCredits', 1, 1000);
    if (dto.imageUrl !== undefined) item.imageUrl = dto.imageUrl;
    if (dto.available !== undefined) item.available = dto.available;
    if (dto.archived !== undefined) item.archived = dto.archived;
    const action =
      before.priceCredits !== item.priceCredits ? 'menu.price_change' : 'menu.item_update';
    this.audit(
      actor,
      action,
      'MenuItem',
      id,
      { priceCredits: before.priceCredits, available: before.available },
      { priceCredits: item.priceCredits, available: item.available },
      ctx,
    );
    return this.commit(item);
  }

  setSoldOut(ctx: Ctx, id: string, soldOut: boolean): MenuItem {
    this.requireCap(ctx, Capability.MANAGE_MENU);
    const item = this.db.items.find((x) => x.id === id);
    if (!item) fail(ErrorCode.NOT_FOUND, 'Item not found');
    item.soldOutDate = soldOut ? vnDate() : null;
    return this.commit(item);
  }

  /* ───────────────────────── admin: money ───────────────────────── */

  cashTopUp(ctx: Ctx, dto: CashTopUpDto): CashTopUpReceipt {
    const actor = this.requireCap(ctx, Capability.MANAGE_MONEY);
    const s = this.student(dto.studentId);
    const amount = requireInt(dto.amountCredits, 'amountCredits', 1, 100_000);
    const receiptNumber = `PT${String(this.db.receiptSeq++).padStart(6, '0')}`;
    const entry = this.post(
      s.id,
      LedgerType.TOPUP_CASH,
      amount,
      'TOP_UP',
      receiptNumber,
      actor.id,
      dto.note?.trim() || null,
    );
    this.notify(
      this.parentsOf(s.id),
      NotificationType.TOPUP_PAID,
      `Đã nạp ${amount} xu cho ${s.fullName}`,
      'Nạp tiền mặt tại văn phòng nhà trường.',
      { studentId: s.id },
    );
    this.audit(
      actor,
      'topup.cash',
      'Wallet',
      this.wallet(s.id).id,
      null,
      { amountCredits: amount, receiptNumber },
      ctx,
    );
    return this.commit({
      receiptNumber,
      studentId: s.id,
      studentName: s.fullName,
      amountCredits: amount,
      balanceAfter: entry.balanceAfter,
      note: entry.note,
      createdByName: actor.fullName,
      createdAt: entry.createdAt,
    });
  }

  listSepayTransactions(ctx: Ctx, query: SepayTransactionsQuery = {}): Paginated<SepayTransaction> {
    this.requireCap(ctx, Capability.MANAGE_MONEY);
    const rows = this.db.sepayTransactions
      .filter((t) => (query.status ? t.status === query.status : true))
      .filter((t) => (query.from ? vnDate(t.transactionDate) >= query.from : true))
      .filter((t) => (query.to ? vnDate(t.transactionDate) <= query.to : true))
      .sort((a, b) => b.transactionDate.localeCompare(a.transactionDate));
    return clone(paginate(rows, { pageSize: query.pageSize ?? 50, page: query.page }));
  }

  private openPayment(id: string) {
    const tx = this.db.sepayTransactions.find((t) => t.id === id);
    if (!tx) fail(ErrorCode.NOT_FOUND, 'Payment not found');
    if (tx.status !== SepayTxStatus.UNMATCHED)
      fail(ErrorCode.PAYMENT_ALREADY_RESOLVED, 'Already resolved');
    return tx;
  }

  assignPayment(ctx: Ctx, id: string, dto: AssignPaymentDto): SepayTransaction {
    const actor = this.requireCap(ctx, Capability.MANAGE_MONEY);
    const tx = this.openPayment(id);
    const s = this.student(dto.studentId);
    const credits = Math.floor(tx.transferAmountVnd / VND_PER_CREDIT);
    this.post(
      s.id,
      LedgerType.TOPUP_SEPAY,
      credits,
      'SEPAY_TX',
      tx.id,
      actor.id,
      dto.note?.trim() || 'Gán giao dịch không khớp',
    );
    tx.status = SepayTxStatus.RESOLVED;
    tx.creditedCredits = credits;
    tx.remainderVnd = tx.transferAmountVnd % VND_PER_CREDIT;
    tx.resolvedById = actor.id;
    tx.resolvedByName = actor.fullName;
    tx.resolvedAt = iso();
    tx.resolutionNote = dto.note?.trim() || null;
    tx.studentId = s.id;
    tx.studentName = s.fullName;
    this.notify(
      this.parentsOf(s.id),
      NotificationType.TOPUP_PAID,
      `Đã nạp ${credits} xu cho ${s.fullName}`,
      'Kế toán đã ghi nhận khoản chuyển khoản của bạn.',
      { studentId: s.id },
    );
    this.audit(
      actor,
      'sepay.assign',
      'SepayTransaction',
      tx.id,
      { status: 'UNMATCHED' },
      { status: 'RESOLVED', studentId: s.id, credits },
      ctx,
    );
    return this.commit(tx);
  }

  ignorePayment(ctx: Ctx, id: string, dto: IgnorePaymentDto): SepayTransaction {
    const actor = this.requireCap(ctx, Capability.MANAGE_MONEY);
    const tx = this.openPayment(id);
    tx.status = SepayTxStatus.IGNORED;
    tx.resolvedById = actor.id;
    tx.resolvedByName = actor.fullName;
    tx.resolvedAt = iso();
    tx.resolutionNote = requireText(dto.reason, 'reason', 200);
    this.audit(
      actor,
      'sepay.ignore',
      'SepayTransaction',
      tx.id,
      { status: 'UNMATCHED' },
      { status: 'IGNORED', reason: tx.resolutionNote },
      ctx,
    );
    return this.commit(tx);
  }

  listTopUpsToReview(ctx: Ctx): TopUpReviewItem[] {
    this.requireCap(ctx, Capability.MANAGE_MONEY);
    return clone(
      this.db.topUps
        .filter((t) => t.needsReview)
        .map((t) => {
          const tx = this.db.sepayTransactions.find((x) => x.topUpId === t.id);
          return {
            ...t,
            transferAmountVnd: tx?.transferAmountVnd ?? null,
            remainderVnd: tx?.remainderVnd ?? null,
          };
        }),
    );
  }

  markTopUpReviewed(ctx: Ctx, id: string): TopUp {
    const actor = this.requireCap(ctx, Capability.MANAGE_MONEY);
    const t = this.db.topUps.find((x) => x.id === id);
    if (!t) fail(ErrorCode.NOT_FOUND, 'Top-up not found');
    t.needsReview = false;
    this.audit(
      actor,
      'topup.reviewed',
      'TopUp',
      id,
      { needsReview: true },
      { needsReview: false },
      ctx,
    );
    return this.commit(t);
  }

  createRefund(ctx: Ctx, dto: CreateRefundDto): Refund {
    const actor = this.requireCap(ctx, Capability.MANAGE_MONEY);
    const s = this.student(dto.studentId);
    const balance = this.wallet(s.id).balanceCredits;
    const amount = requireInt(dto.amountCredits, 'amountCredits', 1, 1_000_000);
    if (amount > balance) fail(ErrorCode.REFUND_EXCEEDS_BALANCE, 'Exceeds balance', { balance });
    const refund: Refund = {
      id: this.id('rfd'),
      studentId: s.id,
      studentName: s.fullName,
      amountCredits: amount,
      method: dto.method,
      note: dto.note?.trim() || null,
      createdById: actor.id,
      createdByName: actor.fullName,
      createdAt: iso(),
    };
    this.post(s.id, LedgerType.REFUND, -amount, 'REFUND', refund.id, actor.id, refund.note);
    this.db.refunds.push(refund);
    this.audit(
      actor,
      'wallet.refund',
      'Wallet',
      this.wallet(s.id).id,
      { balance },
      { balance: balance - amount, method: dto.method },
      ctx,
    );
    return this.commit(refund);
  }

  listRefunds(ctx: Ctx): Refund[] {
    this.requireCap(ctx, Capability.MANAGE_MONEY);
    return clone([...this.db.refunds].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  createAdjustment(ctx: Ctx, dto: CreateAdjustmentDto): Adjustment {
    const actor = this.requireCap(ctx, Capability.MANAGE_MONEY);
    const s = this.student(dto.studentId);
    const balance = this.wallet(s.id).balanceCredits;
    const amount = requireInt(dto.amountCredits, 'amountCredits', -1_000_000, 1_000_000);
    if (amount === 0)
      fail(ErrorCode.VALIDATION_FAILED, 'Amount cannot be zero', { field: 'amountCredits' });
    if (balance + amount < 0)
      fail(ErrorCode.ADJUSTMENT_NEGATIVE_BALANCE, 'Would go negative', { balance });
    const adj: Adjustment = {
      id: this.id('adj'),
      studentId: s.id,
      studentName: s.fullName,
      amountCredits: amount,
      reason: requireText(dto.reason, 'reason', 200),
      createdById: actor.id,
      createdByName: actor.fullName,
      createdAt: iso(),
    };
    this.post(s.id, LedgerType.ADJUSTMENT, amount, 'ADJUSTMENT', adj.id, actor.id, adj.reason);
    this.db.adjustments.push(adj);
    this.audit(
      actor,
      'wallet.adjust',
      'Wallet',
      this.wallet(s.id).id,
      { balance },
      { balance: balance + amount, reason: adj.reason },
      ctx,
    );
    return this.commit(adj);
  }

  listAdjustments(ctx: Ctx): Adjustment[] {
    this.requireCap(ctx, Capability.MANAGE_MONEY);
    return clone([...this.db.adjustments].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  }

  /* ───────────────────────── admin: reports ───────────────────────── */

  dashboard(ctx: Ctx): DashboardReport {
    const user = this.user(ctx);
    if (!can(user.role, Capability.VIEW_SALES_REPORTS)) fail(ErrorCode.FORBIDDEN, 'Not permitted');
    const today = vnDate();
    const days = dateRange(addDays(today, -6), today);
    const completed = this.db.orders.filter((o) => o.status === OrderStatus.COMPLETED);
    const topUpEntries = this.db.ledger.filter(
      (e) => e.type === LedgerType.TOPUP_CASH || e.type === LedgerType.TOPUP_SEPAY,
    );
    const todayOrders = completed.filter((o) => vnDate(o.createdAt) === today);
    const todayTopUps = topUpEntries.filter((e) => vnDate(e.createdAt) === today);
    return clone({
      todaySalesCredits: todayOrders.reduce((s, o) => s + o.totalCredits, 0),
      todayOrderCount: todayOrders.length,
      todayTopUpsCredits: todayTopUps.reduce((s, e) => s + e.amountCredits, 0),
      todayTopUpCount: todayTopUps.length,
      unmatchedPayments: this.db.sepayTransactions.filter(
        (t) => t.status === SepayTxStatus.UNMATCHED,
      ).length,
      topUpsToReview: this.db.topUps.filter((t) => t.needsReview).length,
      outstandingCredits: this.db.wallets.reduce((s, w) => s + w.balanceCredits, 0),
      salesLast7Days: days.map((date) => ({
        date,
        totalCredits: completed
          .filter((o) => vnDate(o.createdAt) === date)
          .reduce((s, o) => s + o.totalCredits, 0),
      })),
      topUpsLast7Days: days.map((date) => ({
        date,
        totalCredits: topUpEntries
          .filter((e) => vnDate(e.createdAt) === date)
          .reduce((s, e) => s + e.amountCredits, 0),
      })),
      recentOrders: [...this.db.orders]
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, 8),
    });
  }

  salesReport(ctx: Ctx, query: ReportRangeQuery): SalesReport {
    const user = this.user(ctx);
    if (!can(user.role, Capability.VIEW_SALES_REPORTS)) fail(ErrorCode.FORBIDDEN, 'Not permitted');
    const inRange = this.db.orders.filter((o) => {
      const d = vnDate(o.createdAt);
      return d >= query.from && d <= query.to;
    });
    const completed = inRange.filter((o) => o.status === OrderStatus.COMPLETED);
    const byItem = new Map<
      string,
      { menuItemId: string; name: string; quantity: number; totalCredits: number }
    >();
    const byCategory = new Map<
      string,
      { categoryId: string; name: string; totalCredits: number }
    >();
    for (const o of completed) {
      for (const line of o.items) {
        const row = byItem.get(line.menuItemId) ?? {
          menuItemId: line.menuItemId,
          name: line.nameSnapshot,
          quantity: 0,
          totalCredits: 0,
        };
        row.quantity += line.quantity;
        row.totalCredits += line.quantity * line.unitPriceCredits;
        byItem.set(line.menuItemId, row);
        const item = this.db.items.find((i) => i.id === line.menuItemId);
        const cat = this.db.categories.find((c) => c.id === item?.categoryId);
        const key = cat?.id ?? 'other';
        const crow = byCategory.get(key) ?? {
          categoryId: key,
          name: cat?.name ?? 'Khác',
          totalCredits: 0,
        };
        crow.totalCredits += line.quantity * line.unitPriceCredits;
        byCategory.set(key, crow);
      }
    }
    return clone({
      from: query.from,
      to: query.to,
      totalCredits: completed.reduce((s, o) => s + o.totalCredits, 0),
      orderCount: completed.length,
      voidedCount: inRange.length - completed.length,
      byDay: dateRange(query.from, query.to).map((date) => {
        const day = completed.filter((o) => vnDate(o.createdAt) === date);
        return {
          date,
          totalCredits: day.reduce((s, o) => s + o.totalCredits, 0),
          orderCount: day.length,
        };
      }),
      byItem: [...byItem.values()].sort((a, b) => b.totalCredits - a.totalCredits),
      byCategory: [...byCategory.values()].sort((a, b) => b.totalCredits - a.totalCredits),
    });
  }

  topUpReport(ctx: Ctx, query: ReportRangeQuery): TopUpReport {
    this.requireCap(ctx, Capability.VIEW_FINANCE_REPORTS);
    const entries = this.db.ledger.filter((e) => {
      const d = vnDate(e.createdAt);
      return (
        (e.type === LedgerType.TOPUP_SEPAY || e.type === LedgerType.TOPUP_CASH) &&
        d >= query.from &&
        d <= query.to
      );
    });
    const sepay = entries.filter((e) => e.type === LedgerType.TOPUP_SEPAY);
    const cash = entries.filter((e) => e.type === LedgerType.TOPUP_CASH);
    const sum = (list: LedgerEntry[]) => list.reduce((s, e) => s + e.amountCredits, 0);
    return clone({
      from: query.from,
      to: query.to,
      totalCredits: sum(entries),
      byMethod: [
        { method: 'SEPAY' as const, totalCredits: sum(sepay), count: sepay.length },
        { method: 'CASH' as const, totalCredits: sum(cash), count: cash.length },
      ],
      byDay: dateRange(query.from, query.to).map((date) => ({
        date,
        sepayCredits: sum(sepay.filter((e) => vnDate(e.createdAt) === date)),
        cashCredits: sum(cash.filter((e) => vnDate(e.createdAt) === date)),
      })),
    });
  }

  balancesReport(ctx: Ctx): BalancesReport {
    this.requireCap(ctx, Capability.VIEW_FINANCE_REPORTS);
    const rows = this.db.students.map((s) => ({ s, balance: this.wallet(s.id).balanceCredits }));
    const byClass = new Map<
      string,
      { className: string; totalCredits: number; students: number }
    >();
    for (const { s, balance } of rows) {
      const row = byClass.get(s.className) ?? {
        className: s.className,
        totalCredits: 0,
        students: 0,
      };
      row.totalCredits += balance;
      row.students += 1;
      byClass.set(s.className, row);
    }
    return clone({
      totalOutstandingCredits: rows.reduce((t, r) => t + r.balance, 0),
      walletCount: rows.length,
      byClass: [...byClass.values()].sort((a, b) => a.className.localeCompare(b.className)),
      top: rows
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10)
        .map(({ s, balance }) => ({
          studentId: s.id,
          fullName: s.fullName,
          className: s.className,
          balanceCredits: balance,
        })),
    });
  }

  reconciliationReport(ctx: Ctx, query: ReportRangeQuery): ReconciliationReport {
    this.requireCap(ctx, Capability.VIEW_FINANCE_REPORTS);
    const txs = this.db.sepayTransactions.filter((t) => {
      const d = vnDate(t.transactionDate);
      return t.transferType === 'in' && d >= query.from && d <= query.to;
    });
    const credited = txs.filter(
      (t) => t.status === SepayTxStatus.MATCHED || t.status === SepayTxStatus.RESOLVED,
    );
    return clone({
      from: query.from,
      to: query.to,
      receivedVnd: txs.reduce((s, t) => s + t.transferAmountVnd, 0),
      creditedCredits: credited.reduce((s, t) => s + (t.creditedCredits ?? 0), 0),
      remainderVnd: credited.reduce((s, t) => s + (t.remainderVnd ?? 0), 0),
      matchedCount: credited.length,
      unmatchedCount: txs.filter((t) => t.status === SepayTxStatus.UNMATCHED).length,
      ignoredCount: txs.filter((t) => t.status === SepayTxStatus.IGNORED).length,
      unmatched: txs
        .filter((t) => t.status === SepayTxStatus.UNMATCHED)
        .map((t) => ({
          id: t.id,
          transactionDate: t.transactionDate,
          amountVnd: t.transferAmountVnd,
          content: t.content,
        })),
      ignored: txs
        .filter((t) => t.status === SepayTxStatus.IGNORED)
        .map((t) => ({
          id: t.id,
          transactionDate: t.transactionDate,
          amountVnd: t.transferAmountVnd,
          reason: t.resolutionNote,
        })),
    });
  }

  exportCsv(
    ctx: Ctx,
    kind: 'sales' | 'topups' | 'balances' | 'reconciliation',
    query?: ReportRangeQuery,
  ): string {
    const range = query ?? { from: addDays(vnDate(), -29), to: vnDate() };
    switch (kind) {
      case 'sales': {
        const r = this.salesReport(ctx, range);
        return toCsv([
          ['date', 'orders', 'total_credits', 'total_vnd'],
          ...r.byDay.map((d) => [
            d.date,
            d.orderCount,
            d.totalCredits,
            d.totalCredits * VND_PER_CREDIT,
          ]),
        ]);
      }
      case 'topups': {
        const r = this.topUpReport(ctx, range);
        return toCsv([
          ['date', 'sepay_credits', 'cash_credits', 'total_credits'],
          ...r.byDay.map((d) => [
            d.date,
            d.sepayCredits,
            d.cashCredits,
            d.sepayCredits + d.cashCredits,
          ]),
        ]);
      }
      case 'balances': {
        const r = this.balancesReport(ctx);
        return toCsv([
          ['class', 'students', 'total_credits'],
          ...r.byClass.map((c) => [c.className, c.students, c.totalCredits]),
        ]);
      }
      case 'reconciliation': {
        const r = this.reconciliationReport(ctx, range);
        return toCsv([
          ['id', 'date', 'amount_vnd', 'status', 'content'],
          ...r.unmatched.map((u) => [u.id, u.transactionDate, u.amountVnd, 'UNMATCHED', u.content]),
          ...r.ignored.map((u) => [u.id, u.transactionDate, u.amountVnd, 'IGNORED', u.reason]),
        ]);
      }
    }
  }

  /* ───────────────────── admin: audit, settings, devices ───────────────────── */

  listAuditLogs(ctx: Ctx, query: AuditLogQuery = {}): AuditLogPage {
    this.requireCap(ctx, Capability.VIEW_AUDIT_LOG);
    const rows = this.db.auditLogs
      .filter((a) => (query.actorId ? a.actorId === query.actorId : true))
      .filter((a) => (query.action ? a.action.startsWith(query.action) : true))
      .filter((a) => (query.entity ? a.entity === query.entity : true))
      .filter((a) => (query.from ? vnDate(a.createdAt) >= query.from : true))
      .filter((a) => (query.to ? vnDate(a.createdAt) <= query.to : true))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return clone(paginate(rows, query));
  }

  getSettings(ctx: Ctx): Settings {
    this.requireCap(ctx, Capability.MANAGE_SETTINGS);
    return clone(this.db.settings);
  }

  updateSettings(ctx: Ctx, dto: Settings): Settings {
    const actor = this.requireCap(ctx, Capability.MANAGE_SETTINGS);
    const before = clone(this.db.settings);
    const next: Settings = {
      pinThresholdCredits: requireInt(dto.pinThresholdCredits, 'pinThresholdCredits', 0, 10_000),
      topUpMinCredits: requireInt(dto.topUpMinCredits, 'topUpMinCredits', 1, 100_000),
      topUpMaxCredits: requireInt(dto.topUpMaxCredits, 'topUpMaxCredits', 1, 100_000),
      topUpExpiryMinutes: requireInt(dto.topUpExpiryMinutes, 'topUpExpiryMinutes', 5, 1440),
      bank: {
        bankName: requireText(dto.bank.bankName, 'bank.bankName', 50),
        accountNumber: requireText(dto.bank.accountNumber, 'bank.accountNumber', 30),
        accountHolder: requireText(dto.bank.accountHolder, 'bank.accountHolder', 100),
      },
    };
    if (next.topUpMinCredits > next.topUpMaxCredits)
      fail(ErrorCode.VALIDATION_FAILED, 'min > max', { field: 'topUpMinCredits' });
    this.db.settings = next;
    this.audit(
      actor,
      'settings.update',
      'Setting',
      'all',
      before as unknown as Record<string, unknown>,
      next as unknown as Record<string, unknown>,
      ctx,
    );
    return this.commit(next);
  }

  listKioskDevices(ctx: Ctx): KioskDevice[] {
    this.requireCap(ctx, Capability.MANAGE_SETTINGS);
    return clone(this.db.kioskDevices.map(({ key: _key, ...d }) => d));
  }

  createKioskDevice(ctx: Ctx, dto: CreateKioskDeviceDto): CreateKioskDeviceResult {
    const actor = this.requireCap(ctx, Capability.MANAGE_SETTINGS);
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    const key = `kd_${Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')}`;
    const device = {
      id: this.id('kiosk'),
      name: requireText(dto.name, 'name', 60),
      key,
      active: true,
      lastSeenAt: null,
      createdAt: iso(),
    };
    this.db.kioskDevices.push(device);
    this.audit(actor, 'kiosk.register', 'KioskDevice', device.id, null, { name: device.name }, ctx);
    return this.commit({ id: device.id, name: device.name, deviceKey: key });
  }

  revokeKioskDevice(ctx: Ctx, id: string) {
    const actor = this.requireCap(ctx, Capability.MANAGE_SETTINGS);
    const device = this.db.kioskDevices.find((d) => d.id === id);
    if (!device) fail(ErrorCode.NOT_FOUND, 'Device not found');
    device.active = false;
    this.audit(actor, 'kiosk.revoke', 'KioskDevice', id, { active: true }, { active: false }, ctx);
    this.commit(null);
  }

  /* ───────────────────────── SePay webhook (UC-23) ───────────────────────── */

  /** B5 webhook algorithm. Returns the stored transaction. */
  sepayWebhook(apiKey: string | null, payload: SepayWebhookPayload): SepayTransaction {
    if (apiKey !== DEMO_WEBHOOK_KEY) fail(ErrorCode.UNAUTHENTICATED, 'Bad API key');
    this.tick();
    const id = String(payload.id);
    const duplicate = this.db.sepayTransactions.find((t) => t.id === id);
    if (duplicate) return clone(duplicate); // NFR-REL-03
    const code =
      payload.code?.toUpperCase() ?? payload.content.toUpperCase().match(/SC\d{8}/)?.[0] ?? null;
    const tx: SepayTransaction = {
      id,
      gateway: payload.gateway,
      transactionDate: payload.transactionDate,
      accountNumber: payload.accountNumber,
      code: code && PAYMENT_CODE_PATTERN.test(code) ? code : null,
      content: payload.content,
      description: payload.description,
      transferType: payload.transferType,
      transferAmountVnd: payload.transferAmount,
      referenceCode: payload.referenceCode,
      status: SepayTxStatus.UNMATCHED,
      topUpId: null,
      creditedCredits: null,
      remainderVnd: null,
      resolvedById: null,
      resolvedByName: null,
      resolvedAt: null,
      resolutionNote: null,
      studentId: null,
      studentName: null,
    };
    this.db.sepayTransactions.push(tx);
    if (payload.transferType === 'out') {
      tx.status = SepayTxStatus.IGNORED;
      tx.resolutionNote = 'Giao dịch chuyển ra';
      return this.commit(tx);
    }
    const topUp = tx.code
      ? this.db.topUps.find((t) => t.paymentCode === tx.code && t.status !== TopUpStatus.PAID)
      : undefined;
    if (topUp && topUp.status !== TopUpStatus.CANCELLED) this.settleTopUp(topUp, tx);
    return this.commit(tx);
  }

  /* ───────────────────────────── dev ───────────────────────────── */

  simulateTransfer(input: { amountVnd: number; content: string }): SepayTransaction {
    const amount = requireInt(input.amountVnd, 'amountVnd', 1, 100_000_000);
    return this.sepayWebhook(DEMO_WEBHOOK_KEY, {
      id: String(9_500_000 + Math.floor(Math.random() * 400_000)),
      gateway: this.db.settings.bank.bankName,
      transactionDate: iso(),
      accountNumber: this.db.settings.bank.accountNumber,
      code: null,
      content: input.content,
      transferType: 'in',
      description: `BankAPINotify ${input.content}`,
      transferAmount: amount,
      referenceCode: `FT${Date.now()}`,
    });
  }

  demoCards() {
    return clone(demoCardsOf(this.db).map(({ status: _s, ...c }) => c));
  }

  reset() {
    this.db = createSeed();
    this.commit(null);
  }
}
