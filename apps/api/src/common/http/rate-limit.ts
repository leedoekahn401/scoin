import type { RequestHandler } from 'express';
import { AppError } from '../errors/app-error';

const WINDOW_MS = 60_000;

/**
 * Fixed one-minute window per client IP and route (NFR-SEC-07), like @nestjs/throttler's default.
 * shortcut: in-memory, so limits are per process; move to Redis when the API runs on more than one instance.
 */
export function rateLimit(limit: number, now: () => number = Date.now): RequestHandler {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (req, _res, next) => {
    const t = now();
    if (hits.size > 10_000) for (const [k, v] of hits) if (v.resetAt <= t) hits.delete(k);

    const key = req.ip ?? 'unknown';
    const entry = hits.get(key);
    if (!entry || entry.resetAt <= t) {
      hits.set(key, { count: 1, resetAt: t + WINDOW_MS });
    } else if (++entry.count > limit) {
      throw new AppError('RATE_LIMITED', 429, 'Too Many Requests');
    }
    next();
  };
}
