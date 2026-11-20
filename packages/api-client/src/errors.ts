import type { ApiErrorBody, ErrorCode, ErrorDetailsMap } from '@schoolcoin/types';

/**
 * The single error type every API call rejects with, in both mock and http
 * modes. Screens branch on `code` (see `isApiError`) and show Vietnamese copy
 * from `errorMessage()` in @schoolcoin/ui.
 */
export class ApiError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details: Record<string, unknown> | undefined;

  constructor(code: ErrorCode, message: string, status = 400, details?: Record<string, unknown>) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }

  /** Typed access to details for codes that carry numbers. */
  detailsOf<C extends keyof ErrorDetailsMap>(code: C): ErrorDetailsMap[C] | undefined {
    return this.code === code ? (this.details as ErrorDetailsMap[C] | undefined) : undefined;
  }

  toBody(): ApiErrorBody {
    return { error: { code: this.code, message: this.message, details: this.details } };
  }
}

export function isApiError(value: unknown, code?: ErrorCode): value is ApiError {
  return value instanceof ApiError && (code === undefined || value.code === code);
}

const STATUS_BY_CODE: Partial<Record<ErrorCode, number>> = {
  UNAUTHENTICATED: 401,
  INVALID_CREDENTIALS: 401,
  FORBIDDEN: 403,
  KIOSK_UNKNOWN: 403,
  NOT_FOUND: 404,
  CARD_NOT_FOUND: 404,
  CONFLICT: 409,
  EMAIL_TAKEN: 409,
  USERNAME_TAKEN: 409,
  STUDENT_CODE_TAKEN: 409,
  RATE_LIMITED: 429,
  INTERNAL_ERROR: 500,
  VALIDATION_FAILED: 400,
};

export function statusForCode(code: ErrorCode): number {
  return STATUS_BY_CODE[code] ?? 422;
}

export function fail(code: ErrorCode, message: string, details?: Record<string, unknown>): never {
  throw new ApiError(code, message, statusForCode(code), details);
}
