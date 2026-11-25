# 0006 — Double-entry ledger

**Status:** Accepted · amends 0002 · SRS B5, FR-WAL-02…05, BR-02

## Context

ADR 0002 recorded each balance change as one signed row on the student's wallet, and the
application then updated `wallets.balanceCredits` itself. Nothing in the data said where the
credits came from or went to, and any code path could write a balance that no entry explains.

## Decision

- **Every movement has a sender and a receiver.** A `ledger_transactions` row (type, amount > 0,
  `refType`/`refId`, actor, note) owns exactly two `ledger_entries`: `-amount` on the sending
  wallet and `+amount` on the receiving one.
- **School-side wallets are the other side.** `wallets.kind` is `STUDENT` or one of four
  single school-side wallets, created by the migration:

  | Movement                     | From → to                                                     |
  | ---------------------------- | ------------------------------------------------------------- |
  | `TOPUP_SEPAY`                | `SEPAY_BANK` → student                                        |
  | `TOPUP_CASH`                 | `CASH_OFFICE` → student                                       |
  | `PURCHASE` / `VOID_REVERSAL` | student → `CAFETERIA` / `CAFETERIA` → student                 |
  | `REFUND`                     | student → `CASH_OFFICE` (or `SEPAY_BANK` for a bank transfer) |
  | `ADJUSTMENT`                 | `ADJUSTMENT` ↔ student                                        |

  School-side wallets go negative by design (`SEPAY_BANK` = −credits issued against bank
  transfers), so **the balances of all wallets always add up to 0**.

- **Nobody edits a balance.** A `BEFORE INSERT` trigger on `ledger_entries` adds the amount to
  its wallet and records `balanceAfter`. A trigger on `wallets` rejects any other change to
  `balanceCredits`, and a new wallet must start at 0. `wallets.balanceCredits` is still a cached
  balance, but only the ledger writes it.
- **The database enforces the shape.** A deferred constraint trigger rejects, at COMMIT, any
  transaction that is not exactly one `-amount` and one `+amount` entry on two different wallets.
  `UNIQUE (type, refType, refId)` posts a business event at most once. Both tables reject UPDATE,
  DELETE and TRUNCATE (FR-WAL-04). `CHECK (kind <> 'STUDENT' OR balanceCredits >= 0)` keeps
  BR-02.
- **Locking (unchanged from 0002, extended).** `LedgerService.post()` locks both wallets with
  `SELECT … FOR UPDATE ORDER BY (kind = 'STUDENT') DESC, id`: students first, then school-side
  wallets. Every posting locks in that order, so postings never deadlock. `WalletService`
  still locks the student wallet first, checks the balance, then posts.
- **Code path.** Modules call `WalletService.credit()` / `debit()`; they pick the school-side wallet
  from the type. `LedgerService.post()` is the general form; the seed uses
  `postLedgerTransaction()` directly.
- `LedgerService.checkConsistency()` (B9 nightly job) reports wallets whose balance differs from
  their entries, transactions that do not balance, and the sum of all balances.
- Migration `0002_double_entry_ledger` converts existing single-entry rows: each gets a
  transaction and a school-side leg with a running balance.

## Consequences

- Every credit can be traced to a source (bank, cash, cafeteria, correction), and the school-side
  balances double as reconciliation totals: `-SEPAY_BANK` should match SePay receipts minus bank
  refunds, `-CASH_OFFICE` the cash taken in minus paid out, `CAFETERIA` the net sales.
- The API's wire `LedgerEntry` (student view: type, signed amount, balanceAfter) is unchanged; it is
  now the student's leg joined with its transaction.
- Every purchase also locks the `CAFETERIA` row, so purchases commit one at a time. At a
  school cafeteria's volume this is fine. If it ever becomes a bottleneck, split the cafeteria
  into several wallets (one per counter) rather than dropping the cached balance.
- Writes go through the triggers, so a bulk import must post transactions too; it cannot copy
  balances.
