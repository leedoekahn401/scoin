# 0004 — Permission matrix lives in @schoolcoin/types

**Status:** Accepted · SRS 4.12, FR-AUTH-04, NFR-SEC-04

## Context

The permission matrix decides both which API endpoints a role may call and which admin sections
it sees. Keeping two copies (API decorators, admin sidebar) invites drift.

## Decision

`packages/types/src/permissions.ts` defines `PERMISSIONS` (capability → roles) mirroring the
SRS table row by row. The API uses `@Roles(...PERMISSIONS.FINANCE)`; the admin app uses
`can(role, 'FINANCE')` for its sidebar and `<RoleGate>`. Every route needs a valid access token
unless marked `@Public()` (sign-in, SePay webhook, kiosk routes with their own guards).
Ownership rules (a parent's own children, a cashier's own order) are checked in services.

## Consequences

- Changing the matrix is a one-file change, reviewed against the SRS table.
- The permissions e2e test walks the same constant, so a new endpoint without `@Roles` is visible.
