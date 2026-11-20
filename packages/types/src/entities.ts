import type { LedgerRefType, LedgerType, NotificationType } from './ledger';
import type { Role } from './roles';
import type {
  CardStatus,
  OrderStatus,
  RefundMethod,
  RequestStatus,
  SepayTxStatus,
  TopUpStatus,
  UserStatus,
} from './enums';

/**
 * Wire shapes for the SchoolCoin API (SRS §B4 entities as the API returns
 * them, never the raw DB rows: no password/PIN hashes, ISO-8601 strings for
 * every DateTime, integers in CREDITS unless a field is suffixed `Vnd`).
 */

export type ISODateTime = string;
/** Calendar date in Asia/Ho_Chi_Minh, `YYYY-MM-DD`. */
export type ISODate = string;

export interface UserProfile {
  id: string;
  role: Role;
  email: string | null;
  username: string | null;
  phone: string | null;
  fullName: string;
  status: UserStatus;
  createdAt: ISODateTime;
}

export interface EmailPrefs {
  TOPUP_PAID: boolean;
  LOW_BALANCE: boolean;
  NEW_REQUEST: boolean;
  CARD_LOCKED: boolean;
}

export interface Me extends UserProfile {
  emailPrefs: EmailPrefs | null;
}

export interface Student {
  id: string;
  studentCode: string;
  fullName: string;
  className: string;
  photoUrl: string | null;
  active: boolean;
  hasPin: boolean;
  pinLockedUntil: ISODateTime | null;
  dailyLimitCredits: number | null;
  lowBalanceThreshold: number | null;
  createdAt: ISODateTime;
}

export interface Card {
  id: string;
  studentId: string;
  code: string;
  status: CardStatus;
  issuedAt: ISODateTime;
  issuedById: string;
}

export interface Wallet {
  id: string;
  studentId: string;
  balanceCredits: number;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  type: LedgerType;
  /** Signed: + credit, − debit. */
  amountCredits: number;
  balanceAfter: number;
  refType: LedgerRefType;
  refId: string;
  actorId: string | null;
  note: string | null;
  createdAt: ISODateTime;
}

/** Ledger row enriched for display (parent transactions, kiosk, admin wallet history). */
export interface Transaction extends LedgerEntry {
  /** Order lines when `refType === "ORDER"`. */
  items?: OrderItem[];
  /** Human label the server already resolved, e.g. cashier name or "SePay". */
  actorName?: string | null;
}

export interface MenuCategory {
  id: string;
  name: string;
  sortOrder: number;
  archived: boolean;
}

export interface MenuItem {
  id: string;
  categoryId: string;
  name: string;
  priceCredits: number;
  imageUrl: string | null;
  available: boolean;
  /** Set when sold out for that VN calendar day only (FR-MENU-03). */
  soldOutDate: ISODate | null;
  archived: boolean;
}

export interface MenuCategoryWithItems extends MenuCategory {
  items: MenuItem[];
}

export interface OrderItem {
  id: string;
  orderId: string;
  menuItemId: string;
  nameSnapshot: string;
  unitPriceCredits: number;
  quantity: number;
}

export interface Order {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  cardId: string;
  cashierId: string;
  cashierName: string;
  totalCredits: number;
  status: OrderStatus;
  pinVerified: boolean;
  idempotencyKey: string;
  voidedAt: ISODateTime | null;
  voidedById: string | null;
  voidReason: string | null;
  createdAt: ISODateTime;
  items: OrderItem[];
}

export interface TopUp {
  id: string;
  studentId: string;
  studentName: string;
  parentId: string;
  amountCredits: number;
  amountVnd: number;
  paymentCode: string;
  status: TopUpStatus;
  expiresAt: ISODateTime;
  paidAt: ISODateTime | null;
  needsReview: boolean;
  creditRequestId: string | null;
  createdAt: ISODateTime;
}

/** Response of POST /parent/topups — everything the VietQR screen needs. */
export interface TopUpCheckout extends TopUp {
  qrUrl: string;
  bank: string;
  account: string;
  holder: string;
}

export interface SepayTransaction {
  id: string;
  gateway: string;
  transactionDate: ISODateTime;
  accountNumber: string;
  code: string | null;
  content: string;
  description: string;
  transferType: 'in' | 'out';
  transferAmountVnd: number;
  referenceCode: string | null;
  status: SepayTxStatus;
  topUpId: string | null;
  creditedCredits: number | null;
  remainderVnd: number | null;
  resolvedById: string | null;
  resolvedByName: string | null;
  resolvedAt: ISODateTime | null;
  resolutionNote: string | null;
  /** Student credited when MATCHED or RESOLVED. */
  studentId: string | null;
  studentName: string | null;
}

export interface CreditRequest {
  id: string;
  studentId: string;
  studentName: string;
  amountCredits: number;
  note: string | null;
  status: RequestStatus;
  decidedById: string | null;
  decidedByName: string | null;
  decidedAt: ISODateTime | null;
  declineReason: string | null;
  expiresAt: ISODateTime;
  createdAt: ISODateTime;
  topUpId: string | null;
}

export interface Refund {
  id: string;
  studentId: string;
  studentName: string;
  amountCredits: number;
  method: RefundMethod;
  note: string | null;
  createdById: string;
  createdByName: string;
  createdAt: ISODateTime;
}

export interface Adjustment {
  id: string;
  studentId: string;
  studentName: string;
  amountCredits: number;
  reason: string;
  createdById: string;
  createdByName: string;
  createdAt: ISODateTime;
}

export interface CashTopUpReceipt {
  receiptNumber: string;
  studentId: string;
  studentName: string;
  amountCredits: number;
  balanceAfter: number;
  note: string | null;
  createdByName: string;
  createdAt: ISODateTime;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  readAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface InviteCode {
  code: string;
  studentId: string;
  expiresAt: ISODateTime;
  usedById: string | null;
  usedAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface KioskDevice {
  id: string;
  name: string;
  active: boolean;
  lastSeenAt: ISODateTime | null;
  createdAt: ISODateTime;
}

export interface AuditLog {
  id: string;
  actorId: string | null;
  actorName: string | null;
  action: string;
  entity: string;
  entityId: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  createdAt: ISODateTime;
}

export interface SchoolBankDetails {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
}

/** GET/PUT /admin/settings (FR-ADM-05). */
export interface Settings {
  pinThresholdCredits: number;
  topUpMinCredits: number;
  topUpMaxCredits: number;
  topUpExpiryMinutes: number;
  bank: SchoolBankDetails;
}

export interface LinkedParent {
  id: string;
  fullName: string;
  email: string | null;
  phone: string | null;
  linkedAt: ISODateTime;
}
