import type { Prisma } from '@prisma/client';
import { API_PREFIX, type Role } from '@schoolcoin/types';
import type { Request, RequestHandler, Response, Router } from 'express';
import type { ZodType } from 'zod';
import { z } from '../zod';
import { registry, type SecurityScheme } from '../../openapi';
import { prisma } from '../../prisma';
import { authenticate, requireRoles } from './auth';
import { rateLimit } from './rate-limit';

/** Default for every route (NFR-SEC-07); tighter per route with `throttle`. */
const DEFAULT_LIMIT = 300;

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface RouteSpec {
  method: Method;
  /** Express path relative to the router mount, e.g. '/pos/orders/:id/void'. */
  path: string;
  /** Becomes the OpenAPI operationId `<tag>_<name>`. */
  name: string;
  tag: string;
  /** Skip authentication (sign-in, SePay webhook, kiosk routes). Without it every route needs a JWT. */
  public?: boolean;
  /** Allowed roles, taken from PERMISSIONS in @schoolcoin/types. */
  roles?: readonly Role[];
  /** Extra checks after auth (kioskDevice, kioskSession, sepayApiKey). */
  guards?: RequestHandler[];
  security?: SecurityScheme[];
  body?: ZodType;
  query?: ZodType;
  /** Default 201 for POST, 200 otherwise. 204 sends no body. */
  status?: number;
  /** Requests per minute per IP for this route; false turns the limit off. */
  throttle?: number | false;
  /** Writes an AuditLog row after success (FR-AUD-01). */
  audit?: { action: string; entity: string };
  /** Leave out of the OpenAPI document. */
  hidden?: boolean;
  /** Return value is sent as JSON; a handler that streams (SSE) writes `res` itself. */
  handler: (req: Request, res: Response) => unknown;
}

/** Mounts one route on `router` and registers it in the OpenAPI document. */
export function route(router: Router, spec: RouteSpec, mount = `/${API_PREFIX}`) {
  const status = spec.status ?? (spec.method === 'post' ? 201 : 200);
  const chain: RequestHandler[] = [];

  // Same order as before: rate limit, authenticate, authorise, route guards, validate.
  if (spec.throttle !== false) chain.push(rateLimit(spec.throttle ?? DEFAULT_LIMIT));
  if (!spec.public) chain.push(authenticate);
  if (spec.roles?.length) chain.push(requireRoles(spec.roles));
  chain.push(...(spec.guards ?? []));
  if (spec.body || spec.query) {
    chain.push((req, _res, next) => {
      // zod strips unknown keys, like ValidationPipe({ whitelist: true }).
      if (spec.body) req.body = spec.body.parse(req.body ?? {});
      if (spec.query) Object.defineProperty(req, 'query', { value: spec.query.parse(req.query) });
      next();
    });
  }

  router[spec.method](spec.path, ...chain, async (req: Request, res: Response) => {
    const result = await spec.handler(req, res);
    if (res.headersSent) return;
    if (spec.audit) await writeAudit(req, spec.audit, result);
    if (status === 204) res.status(204).end();
    else res.status(status).json(result ?? null);
  });

  if (!spec.hidden) register(spec, status, mount);
}

async function writeAudit(req: Request, meta: { action: string; entity: string }, result: unknown) {
  const entityId =
    typeof result === 'object' && result !== null && 'id' in result
      ? String(result.id)
      : String(req.params.id ?? '');
  await prisma.auditLog.create({
    data: {
      action: meta.action,
      entity: meta.entity,
      entityId,
      actorId: req.user?.id,
      after: (result ?? undefined) as Prisma.InputJsonValue | undefined,
      ip: req.ip,
    },
  });
}

function register(spec: RouteSpec, status: number, mount: string) {
  const params = [...spec.path.matchAll(/:(\w+)/g)].map((m) => m[1]!);
  const security = spec.security
    ? [Object.fromEntries(spec.security.map((s) => [s, []]))]
    : spec.public
      ? undefined
      : [{ bearer: [] }];

  registry.registerPath({
    method: spec.method,
    path: `${mount}${spec.path}`.replace(/:(\w+)/g, '{$1}').replace(/\/$/, '') || '/',
    operationId: `${spec.tag.replace(/\W+/g, '_')}_${spec.name}`,
    tags: [spec.tag],
    security,
    request: {
      ...(params.length > 0 && {
        params: z.object(Object.fromEntries(params.map((p) => [p, z.string()]))),
      }),
      ...(spec.body && {
        body: { required: true, content: { 'application/json': { schema: spec.body } } },
      }),
      ...(spec.query && { query: spec.query as z.ZodObject }),
    },
    responses: { [status]: { description: '' } },
  });
}
