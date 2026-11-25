import type { Role } from '@schoolcoin/types';
import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { AppError } from '../errors/app-error';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
}

/** Access token from the httpOnly cookie, falling back to a Bearer header. */
export const authenticate: RequestHandler = (req, _res, next) => {
  const bearer = req.header('authorization')?.match(/^Bearer (.+)$/)?.[1];
  const token: string | undefined = req.cookies?.access_token ?? bearer;
  if (!token) throw new AppError('UNAUTHENTICATED', 401, 'Unauthorized');
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    req.user = { id: payload.sub, email: payload.email, role: payload.role };
  } catch {
    throw new AppError('UNAUTHENTICATED', 401, 'Unauthorized');
  }
  next();
};

/** Runs after authenticate: enforces the permission matrix (NFR-SEC-04). */
export function requireRoles(roles: readonly Role[]): RequestHandler {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Forbidden resource');
    }
    next();
  };
}
