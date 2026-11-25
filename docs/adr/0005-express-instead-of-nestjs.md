# 0005 — Express instead of NestJS for the API

**Status:** Accepted · replaces the NestJS skeleton in `apps/api`

## Context

`apps/api` was a NestJS skeleton: every route existed, most returned 501, and the business rules
lived in `packages/api-client/src/mock/engine.ts`. Before the real services are written, the team
chose plain Express to drop the decorator/DI layer (Nest itself ran on Express underneath).

## Decision

- **Express 5**, which forwards errors from async handlers to the error middleware.
- **One `route()` call per endpoint** (`src/common/http/route.ts`). It mounts the handler and
  registers the path in the OpenAPI document, so paths are written once. Order of checks:
  rate limit → JWT → roles → route guards (kiosk, SePay) → zod validation → handler → audit log.
- **Every route needs a JWT** unless it sets `public: true`, just as the global guard plus
  `@Public()` worked before.
- **zod** schemas replace class-validator DTOs; unknown keys are stripped. Request types that
  already exist in `@schoolcoin/types` are checked with `satisfies z.ZodType<…>`.
- **@asteasolutions/zod-to-openapi** builds `/docs-json`, and `swagger-ui-express` serves `/docs`,
  so `pnpm api:generate` keeps working.
- Services are plain classes. Each file creates one instance from the shared `prisma` client
  (`src/prisma.ts`). Config is a plain object (`src/config`).
- Jobs use `cron`, started only in `main.ts`. Rate limits are in-memory per process
  (`common/http/rate-limit.ts`), like the `@nestjs/throttler` default.

## Consequences

- Fewer dependencies and no `reflect-metadata` or decorators; `tsx watch` runs the API in dev.
- Wiring is explicit: a new module adds a `*.routes.ts` and one line in `src/app.ts`.
- The HTTP contract did not change. The same 73 paths, methods and status codes appear in
  `/docs-json`; only the OpenAPI `operationId`s are new (`<tag>_<name>`).
- Running more than one API instance needs a shared store (for example Redis) for rate limits.
