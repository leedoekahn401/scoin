# 0002 — Append-only ledger with row locking

**Status:** Accepted · SRS B5, NFR-REL-01, FR-WAL-01…05

## Context

Wallet balances must never go negative or drift, even when the POS, a SePay webhook and a refund
hit the same wallet at the same moment.

## Decision

- Every balance change appends a `ledger_entries` row: type (`TOPUP_SEPAY`, `TOPUP_CASH`,
  `PURCHASE`, `VOID_REVERSAL`, `REFUND`, `ADJUSTMENT`), signed `amountCredits`, `balanceAfter`,
  `refType`/`refId`, actor and time. Corrections are new entries, never edits (FR-WAL-04);
  a database trigger rejects UPDATE and DELETE on the table.
- `wallets.balanceCredits` is a cached balance, updated in the same transaction.
- `WalletService` opens a transaction and runs
  `SELECT id, "balanceCredits" FROM wallets WHERE "studentId" = $1 FOR UPDATE` before reading the
  balance, so concurrent changes to one wallet run one after the other.
- `CHECK ("balanceCredits" >= 0)` is the last line of defence (BR-02).
- POS charges carry an `idempotencyKey` (unique on `orders`) so a retried request never charges
  twice (NFR-REL-02). Webhooks dedup on SePay's transaction id, the primary key of
  `sepay_transactions` (NFR-REL-03).
- Emails, SSE events and low-balance alerts happen after commit, never inside the transaction.
- A nightly job checks `balanceCredits = SUM(amountCredits)` for every wallet (B9).

## Consequences

- Correct under concurrency without application-level locks.
- Full history for audits and reconciliation.
- All money code goes through `WalletService`; direct writes to `wallets` are a review blocker.
