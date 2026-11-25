import type { ApiErrorBody } from '@schoolcoin/types';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error';

/** Unmatched routes get the same envelope as every other error. */
export const notFound: RequestHandler = (req) => {
  throw new AppError('NOT_FOUND', 404, `Cannot ${req.method} ${req.path}`);
};

/** Every error leaves the API as { error: { code, message, details } }. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let status = 500;
  let body: ApiErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Internal error' } };

  if (err instanceof AppError) {
    status = err.status;
    body = { error: { code: err.code, message: err.message, details: err.details } };
  } else if (err instanceof ZodError) {
    status = 400;
    body = {
      error: { code: 'VALIDATION_FAILED', message: 'Validation failed', details: err.issues },
    };
  } else if (err?.type === 'entity.parse.failed') {
    // Malformed JSON body from express.json().
    status = 400;
    body = { error: { code: 'VALIDATION_FAILED', message: 'Malformed JSON body' } };
  } else {
    console.error(err);
  }

  res.status(status).json(body);
};
