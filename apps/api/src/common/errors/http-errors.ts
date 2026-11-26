import { Prisma } from '@prisma/client';
import type { ErrorCode } from '@schoolcoin/types';
import { AppError } from './app-error';

// Factories return the error so call sites read `throw notFound('Top-up')` and TypeScript sees the throw.

/** 400 VALIDATION_FAILED for input zod could not catch (cross-field checks, bad path params). */
export function badRequest(message: string, details?: unknown) {
  return new AppError('VALIDATION_FAILED', 400, message, details);
}

/** 401 UNAUTHENTICATED: no caller, or the caller's credentials are not valid. */
export function unauthenticated(message = 'Unauthorized') {
  return new AppError('UNAUTHENTICATED', 401, message);
}

/** 403 FORBIDDEN: the caller is known but may not touch this record (ownership, links). */
export function forbidden(message = 'Forbidden resource') {
  return new AppError('FORBIDDEN', 403, message);
}

/** 404 NOT_FOUND with "<entity> not found". */
export function notFound(entity: string) {
  return new AppError('NOT_FOUND', 404, `${entity} not found`);
}

/** 409: the request clashes with data that already exists (EMAIL_TAKEN, STUDENT_CODE_TAKEN…). */
export function conflict(code: ErrorCode, message: string, details?: unknown) {
  return new AppError(code, 409, message, details);
}

/** 422: well-formed input that a business rule refuses (INSUFFICIENT_BALANCE, TOPUP_NOT_PENDING…). */
export function ruleViolation(code: ErrorCode, message: string, details?: unknown) {
  return new AppError(code, 422, message, details);
}

/** Returns `value`, or throws 404 when it is null or undefined (a findUnique miss). */
export function ensureFound<T>(value: T | null | undefined, entity: string): T {
  if (value === null || value === undefined) throw notFound(entity);
  return value;
}

/** True for Prisma's unique-constraint error (P2002), optionally only on `field`. */
export function isUniqueViolation(err: unknown, field?: string): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002' &&
    (field === undefined || String(err.meta?.target).includes(field))
  );
}
