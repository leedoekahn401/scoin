import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { ApiErrorBody, ErrorCode } from '@schoolcoin/types';
import type { Response } from 'express';
import { AppError } from '../errors/app-error';

const STATUS_CODES: Partial<Record<number, ErrorCode>> = {
  400: 'VALIDATION_FAILED',
  401: 'UNAUTHENTICATED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
};

/** Every error leaves the API as { error: { code, message, details } }. */
@Catch()
export class AppExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AppExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse<Response>();
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let body: ApiErrorBody = { error: { code: 'INTERNAL_ERROR', message: 'Internal error' } };

    if (exception instanceof AppError) {
      status = exception.status;
      body = {
        error: { code: exception.code, message: exception.message, details: exception.details },
      };
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const response = exception.getResponse();
      const message =
        typeof response === 'object' && response !== null && 'message' in response
          ? response.message
          : exception.message;
      body = {
        error: {
          code: STATUS_CODES[status] ?? 'INTERNAL_ERROR',
          message: Array.isArray(message) ? 'Validation failed' : String(message),
          details: Array.isArray(message) ? message : undefined,
        },
      };
    } else {
      this.logger.error(exception);
    }

    res.status(status).json(body);
  }
}
