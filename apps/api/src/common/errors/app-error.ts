import type { ErrorCode } from '@schoolcoin/types';

/** Business error with a stable code the front ends can switch on. */
export class AppError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message?: string,
    readonly details?: unknown,
  ) {
    super(message ?? code);
  }
}
