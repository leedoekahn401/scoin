# 0001 — Monorepo with Turborepo and pnpm

**Status:** Accepted

## Context

Five deployables (API, POS, parent PWA, kiosk, admin) share types, error codes, UI components
and a generated API client. Six people work on them in parallel.

## Decision

One repository, pnpm workspaces, Turborepo for task orchestration and caching.
Shared code lives in `packages/` (`ui`, `api-client`, `types`, `config`).

## Consequences

- One PR can change the API and its clients together, with one CI run.
- `pnpm dev` starts everything; Turbo only rebuilds what changed.
- Everyone must use pnpm and the Node version in `.nvmrc`.
