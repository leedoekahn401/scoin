export const LEDGER_TYPES = [
  'TOPUP_SEPAY',
  'TOPUP_CASH',
  'PURCHASE',
  'VOID_REVERSAL',
  'REFUND',
  'ADJUSTMENT',
] as const;

export type LedgerType = (typeof LEDGER_TYPES)[number];

/** What a ledger entry's refId points at. */
export const LEDGER_REF_TYPES = ['ORDER', 'TOP_UP', 'SEPAY_TX', 'REFUND', 'ADJUSTMENT'] as const;

export type LedgerRefType = (typeof LEDGER_REF_TYPES)[number];

export const NOTIFICATION_TYPES = [
  'TOPUP_PAID',
  'LOW_BALANCE',
  'NEW_REQUEST',
  'CARD_LOCKED',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];
