# 0002 — Append-only ledger with row locking

**Status:** Accepted

## Context

Wallet balances must never go negative or drift, even when the POS, a SePay webhook and a refund
hit the same wallet at the same moment.

## Decision

- Every balance change appends a `ledger_entries` row (signed `amount_credits`, `balance_after`).
  Rows are never updated or deleted; corrections are new entries (VOID, REFUND, ADJUSTMENT).
- `wallets.balance_credits` is a cached balance, updated in the same transaction.
- `WalletService` opens a transaction and runs `SELECT ... FROM wallets WHERE id = $1 FOR UPDATE`
  before reading the balance, so concurrent changes to one wallet run one at a time.
- A database `CHECK (balance_credits >= 0)` is the last line of defence.
- POS charges carry an `idempotencyKey` (unique on `Order`) so a retried request never charges twice.
- A nightly job checks `balance_credits = SUM(amount_credits)` for every wallet.

## Consequences

- Correct under concurrency without application-level locks.
- Full history for audits and reconciliation.
- All money code must go through `WalletService`; direct writes to `wallets` are a review blocker.
