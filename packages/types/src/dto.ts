import type {
  AuditLog,
  Card,
  CreditRequest,
  ISODate,
  ISODateTime,
  LinkedParent,
  Me,
  Order,
  Student,
  TopUp,
  Transaction,
  Wallet,
} from './entities';
import type { LedgerType } from './ledger';
import type { Role } from './roles';
import type { CardStatus, RefundMethod, RequestStatus, SepayTxStatus } from './enums';

/** Request/response bodies for every endpoint in SRS §B7, grouped by area. */

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

/* ───────────────────────────── Auth ───────────────────────────── */

export interface LoginDto {
  /** Email for parents and staff, username for cashiers (FR-AUTH-01). */
  identifier: string;
  password: string;
}

export interface LoginResult {
  accessToken: string;
  /** Seconds until the access token expires (15 min per §B3). */
  expiresIn: number;
  user: Me;
}

export interface RegisterParentDto {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  inviteCode: string;
}

export interface ForgotPasswordDto {
  email: string;
}

export interface ResetPasswordDto {
  token: string;
  password: string;
}

export interface UpdateMeDto {
  fullName?: string;
  phone?: string;
  emailPrefs?: Partial<
    Record<'TOPUP_PAID' | 'LOW_BALANCE' | 'CREDIT_REQUEST' | 'CARD_LOCKED', boolean>
  >;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

/* ───────────────────────────── Parent ───────────────────────────── */

export interface ChildSummary {
  studentId: string;
  fullName: string;
  className: string;
  photoUrl: string | null;
  balanceCredits: number;
  spentTodayCredits: number;
  dailyLimitCredits: number | null;
  lowBalanceThreshold: number | null;
  cardStatus: CardStatus | null;
  pendingRequests: number;
}

export interface ChildDetail extends ChildSummary {
  studentCode: string;
  remainingTodayCredits: number | null;
  card: Pick<Card, 'id' | 'status' | 'issuedAt'> | null;
  /** Other linked parent, if any (FR-FAM-03: max two). */
  coParents: Pick<LinkedParent, 'id' | 'fullName'>[];
}

export interface LinkChildDto {
  inviteCode: string;
}

export interface TransactionsQuery extends PageQuery {
  from?: ISODate;
  to?: ISODate;
  type?: LedgerType;
}

export interface UpdateControlsDto {
  /** null = remove the limit. 1–1,000 (FR-CTL-01). */
  dailyLimitCredits?: number | null;
  /** null = no alert (FR-CTL-02). */
  lowBalanceThreshold?: number | null;
}

export interface CreateTopUpDto {
  studentId: string;
  amountCredits: number;
  creditRequestId?: string;
}

export interface DeclineRequestDto {
  reason?: string;
}

export interface RequestsQuery {
  status?: RequestStatus;
}

/** Event pushed on GET /parent/topups/:id/events (SSE). */
export type TopUpEvent =
  | { type: 'PAID'; topUpId: string; creditedCredits: number; balanceAfter: number | null }
  | { type: 'EXPIRED'; topUpId: string };

/* ───────────────────────────── POS ───────────────────────────── */

export interface PosLookupDto {
  cardCode: string;
}

/** FR-POS-04 + NFR-PRV-02: only what the cashier may see. */
export interface PosLookupResult {
  studentId: string;
  fullName: string;
  className: string;
  photoUrl: string | null;
  balance: number;
  /** null when no daily limit is set. */
  remainingToday: number | null;
  pinThreshold: number;
  pinLocked: boolean;
}

export interface CreateOrderDto {
  cardCode: string;
  items: { menuItemId: string; quantity: number }[];
  pin?: string;
  idempotencyKey: string;
}

export interface CreateOrderResult {
  order: Order;
  balanceAfter: number;
  remainingToday: number | null;
}

export interface VoidOrderDto {
  reason: string;
}

/* ───────────────────────────── Kiosk ───────────────────────────── */

export interface KioskSignInDto {
  cardCode: string;
  pin: string;
}

export interface KioskSession {
  sessionToken: string;
  expiresAt: ISODateTime;
}

export interface KioskMe {
  studentId: string;
  fullName: string;
  className: string;
  photoUrl: string | null;
  balanceCredits: number;
  spentTodayCredits: number;
  dailyLimitCredits: number | null;
  /** Last 10 (FR-KIO-02, NFR-PRV-03). */
  transactions: Transaction[];
  /** Last 7 days (FR-KIO-04). */
  requests: CreditRequest[];
  requestsSentToday: number;
  maxRequestsPerDay: number;
  hasLinkedParent: boolean;
}

export interface KioskCreateRequestDto {
  amountCredits: number;
  note?: string;
}

/* ───────────────────────────── Admin ───────────────────────────── */

export interface StudentsQuery extends PageQuery {
  search?: string;
  className?: string;
  active?: boolean;
}

export interface StudentListItem extends Student {
  balanceCredits: number;
  cardStatus: CardStatus | null;
  parentCount: number;
}

export interface StudentDetailAdmin extends Student {
  wallet: Wallet;
  cards: Card[];
  parents: LinkedParent[];
  invites: { code: string; expiresAt: ISODateTime; usedAt: ISODateTime | null }[];
}

export interface CreateStudentDto {
  studentCode: string;
  fullName: string;
  className: string;
  photoUrl?: string | null;
}

export type UpdateStudentDto = Partial<CreateStudentDto> & { active?: boolean };

export interface ImportStudentsDto {
  /** Raw CSV text: studentCode,fullName,className[,photoUrl] */
  csv: string;
}

export interface ImportStudentsResult {
  created: number;
  rows: { line: number; studentCode: string; ok: boolean; error?: string }[];
}

export interface SetPinDto {
  pin: string;
}

export interface UsersQuery extends PageQuery {
  role?: Role;
  search?: string;
}

export interface CreateUserDto {
  role: Exclude<Role, 'PARENT'>;
  fullName: string;
  /** Required for every role except CASHIER. */
  email?: string;
  /** Required for CASHIER. */
  username?: string;
  phone?: string;
  password: string;
}

export interface UpdateUserDto {
  fullName?: string;
  phone?: string;
  role?: Exclude<Role, 'PARENT'>;
  status?: 'ACTIVE' | 'DEACTIVATED';
  password?: string;
}

export interface CreateCategoryDto {
  name: string;
  sortOrder?: number;
}

export interface UpdateCategoryDto {
  name?: string;
  sortOrder?: number;
  archived?: boolean;
}

export interface CreateMenuItemDto {
  categoryId: string;
  name: string;
  priceCredits: number;
  imageUrl?: string | null;
  available?: boolean;
}

export interface UpdateMenuItemDto extends Partial<CreateMenuItemDto> {
  archived?: boolean;
}

export interface CashTopUpDto {
  studentId: string;
  amountCredits: number;
  note?: string;
}

export interface SepayTransactionsQuery extends PageQuery {
  status?: SepayTxStatus;
  from?: ISODate;
  to?: ISODate;
}

export interface AssignPaymentDto {
  studentId: string;
  note?: string;
}

export interface IgnorePaymentDto {
  reason: string;
}

export interface CreateRefundDto {
  studentId: string;
  amountCredits: number;
  method: RefundMethod;
  note?: string;
}

export interface CreateAdjustmentDto {
  studentId: string;
  /** Signed (±). */
  amountCredits: number;
  reason: string;
}

export interface ReportRangeQuery {
  from: ISODate;
  to: ISODate;
}

export interface SalesReport {
  from: ISODate;
  to: ISODate;
  totalCredits: number;
  orderCount: number;
  voidedCount: number;
  byDay: { date: ISODate; totalCredits: number; orderCount: number }[];
  byItem: { menuItemId: string; name: string; quantity: number; totalCredits: number }[];
  byCategory: { categoryId: string; name: string; totalCredits: number }[];
}

export interface TopUpReport {
  from: ISODate;
  to: ISODate;
  totalCredits: number;
  byMethod: { method: 'SEPAY' | 'CASH'; totalCredits: number; count: number }[];
  byDay: { date: ISODate; sepayCredits: number; cashCredits: number }[];
}

export interface BalancesReport {
  totalOutstandingCredits: number;
  walletCount: number;
  byClass: { className: string; totalCredits: number; students: number }[];
  top: { studentId: string; fullName: string; className: string; balanceCredits: number }[];
}

export interface ReconciliationReport {
  from: ISODate;
  to: ISODate;
  receivedVnd: number;
  creditedCredits: number;
  remainderVnd: number;
  matchedCount: number;
  unmatchedCount: number;
  ignoredCount: number;
  unmatched: { id: string; transactionDate: ISODateTime; amountVnd: number; content: string }[];
  ignored: { id: string; transactionDate: ISODateTime; amountVnd: number; reason: string | null }[];
}

export interface DashboardReport {
  todaySalesCredits: number;
  todayOrderCount: number;
  todayTopUpsCredits: number;
  todayTopUpCount: number;
  unmatchedPayments: number;
  topUpsToReview: number;
  outstandingCredits: number;
  /** Last 7 VN days, oldest first, for the sparkline. */
  salesLast7Days: { date: ISODate; totalCredits: number }[];
  topUpsLast7Days: { date: ISODate; totalCredits: number }[];
  recentOrders: Order[];
}

export interface AuditLogQuery extends PageQuery {
  actorId?: string;
  action?: string;
  entity?: string;
  from?: ISODate;
  to?: ISODate;
}

export type AuditLogPage = Paginated<AuditLog>;

export interface CreateKioskDeviceDto {
  name: string;
}

export interface CreateKioskDeviceResult {
  id: string;
  name: string;
  /** Shown exactly once (§B7). */
  deviceKey: string;
}

export interface CreateInviteResult {
  code: string;
  expiresAt: ISODateTime;
}

/** Shape of a card on the printable layout (FR-ADM-02). */
export interface PrintableCard {
  studentId: string;
  fullName: string;
  className: string;
  studentCode: string;
  photoUrl: string | null;
  cardCode: string;
}

export type WalletHistory = Paginated<Transaction>;

/** GET /admin/topups/review row: the top-up plus what actually arrived (BR-06). */
export interface TopUpReviewItem extends TopUp {
  transferAmountVnd: number | null;
  remainderVnd: number | null;
}

export type { Student };
