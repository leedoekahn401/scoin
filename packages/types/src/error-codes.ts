export const ERROR_CODES = [
  // generic
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'NOT_IMPLEMENTED',
  'INTERNAL_ERROR',
  // auth & families
  'INVALID_CREDENTIALS',
  'ACCOUNT_LOCKED',
  'INVITE_CODE_INVALID',
  'PARENT_LIMIT_REACHED',
  'RESET_TOKEN_INVALID',
  // POS (B7)
  'CARD_INACTIVE',
  'PIN_REQUIRED',
  'PIN_INVALID',
  'PIN_LOCKED',
  'INSUFFICIENT_BALANCE',
  'DAILY_LIMIT_REACHED',
  'ITEM_UNAVAILABLE',
  'VOID_NOT_ALLOWED',
  // top-ups & finance
  'TOPUP_AMOUNT_OUT_OF_RANGE',
  'TOPUP_NOT_PENDING',
  'PAYMENT_ALREADY_RESOLVED',
  'STUDENT_HAS_BALANCE',
  // kiosk & requests
  'KIOSK_UNKNOWN',
  'KIOSK_SESSION_EXPIRED',
  'REQUEST_LIMIT_REACHED',
  'NO_PARENT_LINKED',
  'REQUEST_CLOSED',
] as const;

export type ErrorCode = (typeof ERROR_CODES)[number];

/** Shape every API error response follows (B7). */
export interface ApiErrorBody {
  error: {
    code: ErrorCode;
    message: string;
    details?: unknown;
  };
}
