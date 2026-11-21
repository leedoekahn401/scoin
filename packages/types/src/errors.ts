import { ERROR_CODES } from './error-codes';

/** String-literal union used by the API; the const object below is the same set as values. */
export type ErrorCode = (typeof ERROR_CODES)[number];

/**
 * Value-object form (`ErrorCode.PIN_INVALID`) for front-end code, generated
 * from the single ERROR_CODES list so the two can never drift apart.
 */
export const ErrorCode = Object.fromEntries(ERROR_CODES.map((code) => [code, code])) as unknown as {
  readonly [K in ErrorCode]: K;
};

/** Typed details for the codes whose UI copy needs numbers (UC-08 6a, 4a). */
export interface ErrorDetailsMap {
  INSUFFICIENT_BALANCE: { balance: number; total: number };
  DAILY_LIMIT_REACHED: { remainingToday: number; total: number; dailyLimit: number };
  PIN_INVALID: { attemptsLeft: number };
  PIN_LOCKED: { lockedUntil: string };
  ACCOUNT_LOCKED: { lockedUntil: string };
  REQUEST_LIMIT_REACHED: { maxPerDay: number };
  TOPUP_AMOUNT_OUT_OF_RANGE: { min: number; max: number };
  REFUND_EXCEEDS_BALANCE: { balance: number };
  STUDENT_HAS_BALANCE: { balance: number };
  ITEM_UNAVAILABLE: { menuItemIds: string[] };
}
