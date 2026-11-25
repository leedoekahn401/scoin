import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../errors/app-error';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
  const req = (ip: string) => ({ ip }) as Request;
  const res = {} as Response;
  const next: NextFunction = () => {};

  it('allows `limit` calls per IP per minute, then 429, then resets', () => {
    let t = 0;
    const limiter = rateLimit(2, () => t);
    limiter(req('a'), res, next);
    limiter(req('a'), res, next);
    expect(() => limiter(req('a'), res, next)).toThrow(AppError);
    limiter(req('b'), res, next); // other IPs have their own budget

    t = 60_000;
    expect(() => limiter(req('a'), res, next)).not.toThrow();
  });
});
