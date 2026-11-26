# Agent instructions

Applies to every AI coding agent (Kiro, Claude Code, Cursor, opencode, Copilot…) and to humans working in this repo.

## Front-end (`apps/pos`, `apps/parent`, `apps/kiosk`, `apps/admin`, `packages/ui`)

Before writing or changing any UI, read:

1. [`docs/frontend/DESIGN.md`](docs/frontend/DESIGN.md): the design system ("The Warm Studio"). **Mandatory.** Tokens only, one gold primary per region, 1px hairlines, soft shadows, no uppercase, Vietnamese UI copy.
2. [`docs/frontend/CONVENTIONS.md`](docs/frontend/CONVENTIONS.md): stack, folder layout, data-fetching pattern, code quality.
3. [`docs/frontend/API-NOTES.md`](docs/frontend/API-NOTES.md) and `packages/api-client/src/contract.ts`: the only way screens reach data.

Use the primitives from `@schoolcoin/ui`. If one is missing, add it to `packages/ui` (re-skinned to the tokens) rather than hand-rolling it in an app.

Before finishing: `pnpm lint:design`, `pnpm lint`, `pnpm typecheck` must pass.

## Backend (`apps/api`)

Before adding or changing a route, read [`docs/api/express-utils.md`](docs/api/express-utils.md): the **MUST** rules for `route()`, errors, request helpers, pagination, date ranges and SSE. `apps/api/src/modules/examples` is a working mock-up of all of them.

Money is stored in integer credits; "today" is the Asia/Ho_Chi_Minh day. Shared enums, error codes, constants and the permission matrix live in `packages/types`: keep the names `apps/api` imports stable.

## Requirements

The spec is [`docs/srs/schoolcoin-srs-v1.0.md`](docs/srs/schoolcoin-srs-v1.0.md) (Part A requirements, Part B technical design).
