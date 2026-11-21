import type {
  Adjustment,
  AuditLog,
  Card,
  CreditRequest,
  EmailPrefs,
  InviteCode,
  KioskDevice,
  LedgerEntry,
  MenuCategory,
  MenuItem,
  Notification,
  Order,
  Refund,
  SepayTransaction,
  Settings,
  Student,
  TopUp,
  UserProfile,
  Wallet,
} from '@schoolcoin/types';

/**
 * The mock database. Shapes are the API's wire types plus the private
 * columns a real backend keeps server-side (passwords, PINs, counters). The
 * mock stores secrets in plain text because it is a demo running on seed
 * data; the NestJS API hashes them with Argon2id (NFR-SEC-02).
 */

export interface UserRecord extends UserProfile {
  password: string;
  failedLogins: number;
  lockedUntil: string | null;
  emailPrefs: EmailPrefs | null;
}

export interface StudentRecord extends Omit<Student, 'hasPin'> {
  pin: string | null;
  pinFailedCount: number;
  lowBalanceAlerted: boolean;
}

export interface ParentStudentRecord {
  parentId: string;
  studentId: string;
  linkedAt: string;
}

export interface KioskDeviceRecord extends KioskDevice {
  key: string;
}

export interface KioskSessionRecord {
  token: string;
  deviceId: string;
  studentId: string;
  expiresAt: string;
  endedAt: string | null;
}

export interface SessionRecord {
  token: string;
  userId: string;
  createdAt: string;
}

export interface DbState {
  version: number;
  seq: number;
  receiptSeq: number;
  users: UserRecord[];
  students: StudentRecord[];
  parentStudents: ParentStudentRecord[];
  invites: InviteCode[];
  cards: Card[];
  wallets: Wallet[];
  ledger: LedgerEntry[];
  categories: MenuCategory[];
  items: MenuItem[];
  orders: Order[];
  topUps: TopUp[];
  sepayTransactions: SepayTransaction[];
  requests: CreditRequest[];
  refunds: Refund[];
  adjustments: Adjustment[];
  notifications: Notification[];
  kioskDevices: KioskDeviceRecord[];
  kioskSessions: KioskSessionRecord[];
  auditLogs: AuditLog[];
  settings: Settings;
  sessions: SessionRecord[];
}

/** Bump when the seed shape changes so persisted demo state is discarded. */
export const DB_VERSION = 4;
