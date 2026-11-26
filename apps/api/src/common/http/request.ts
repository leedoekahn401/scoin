import type { Request } from 'express';
import type { ZodType } from 'zod';
import { badRequest, unauthenticated } from '../errors/http-errors';
import { z } from '../zod';
import type { AuthUser } from './auth';

const guid = z.guid();

/** The signed-in user; use instead of `req.user!` so a public route that calls it fails with 401, not a crash. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthenticated();
  return req.user;
}

/**
 * `req.query` typed by the same schema passed as route()'s `query`, which already parsed it.
 * Do not parse it again: coerced and transformed values (z.stringbool()) would fail a second pass.
 */
export function parsedQuery<S extends ZodType>(req: Request, _schema: S): z.output<S> {
  return req.query as z.output<S>;
}

/** A required path parameter as a string. */
export function param(req: Request, name = 'id'): string {
  const value = req.params[name];
  if (typeof value !== 'string' || value === '')
    throw badRequest(`Missing path parameter :${name}`);
  return value;
}

/** A path parameter that must be a record id; a malformed id is a 400, not a 500 from Prisma. */
export function idParam(req: Request, name = 'id'): string {
  const value = param(req, name);
  if (!guid.safeParse(value).success)
    throw badRequest(`:${name} is not a valid id`, { [name]: value });
  return value;
}
