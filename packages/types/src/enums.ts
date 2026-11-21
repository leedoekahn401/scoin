/**
 * Enums mirror the Prisma schema in SRS §B4 one-to-one, written as string
 * unions + const objects so they survive JSON transport unchanged. The shared
 * Role, ledger and notification enums live in their API-owned modules.
 */

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
  DEACTIVATED: 'DEACTIVATED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

export const CardStatus = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
  REPLACED: 'REPLACED',
} as const;
export type CardStatus = (typeof CardStatus)[keyof typeof CardStatus];

export const TopUpStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED',
} as const;
export type TopUpStatus = (typeof TopUpStatus)[keyof typeof TopUpStatus];

export const SepayTxStatus = {
  MATCHED: 'MATCHED',
  UNMATCHED: 'UNMATCHED',
  RESOLVED: 'RESOLVED',
  IGNORED: 'IGNORED',
} as const;
export type SepayTxStatus = (typeof SepayTxStatus)[keyof typeof SepayTxStatus];

export const OrderStatus = {
  COMPLETED: 'COMPLETED',
  VOIDED: 'VOIDED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const RequestStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  DECLINED: 'DECLINED',
  EXPIRED: 'EXPIRED',
  PAID: 'PAID',
} as const;
export type RequestStatus = (typeof RequestStatus)[keyof typeof RequestStatus];

export const RefundMethod = {
  CASH: 'CASH',
  BANK_TRANSFER: 'BANK_TRANSFER',
} as const;
export type RefundMethod = (typeof RefundMethod)[keyof typeof RefundMethod];
