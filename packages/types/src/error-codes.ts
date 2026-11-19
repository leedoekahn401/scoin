export const ERROR_CODES = [
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'INSUFFICIENT_BALANCE',
  'DAILY_LIMIT_REACHED',
  'CARD_LOCKED',
  'CARD_NOT_FOUND',
  'WALLET_LOCKED',
  'PIN_REQUIRED',
  'PIN_INVALID',
  'ITEM_SOLD_OUT',
  'TOPUP_EXPIRED',
  'INVITE_CODE_INVALID',
  'INTERNAL_ERROR',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Shape every API error response follows. */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
