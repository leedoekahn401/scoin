-- Double-entry ledger (docs/adr/0006-double-entry-ledger.md).
--
-- Every movement of credits is one ledger_transactions row with exactly two ledger_entries legs:
-- -amount on the sending wallet, +amount on the receiving one. The other side of a student wallet
-- is one of four school-side wallets (bank, cash office, cafeteria, adjustments), so the balances
-- of all wallets always add up to 0.
--
-- wallets."balanceCredits" is written only by the ledger_entries insert trigger; any other UPDATE
-- of it is rejected. Existing single-entry rows are converted, each getting its school-side leg.

BEGIN;

-- ---------------------------------------------------------------- wallets

-- CreateEnum
CREATE TYPE "WalletKind" AS ENUM ('STUDENT', 'BANK', 'CASH_OFFICE', 'CAFETERIA', 'ADJUSTMENT');

-- AlterTable
ALTER TABLE "wallets" ADD COLUMN "kind" "WalletKind" NOT NULL DEFAULT 'STUDENT',
ALTER COLUMN "studentId" DROP NOT NULL;

-- BR-02 / FR-WAL-03: a student balance never goes below 0. School-side wallets go negative by design.
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_balance_non_negative";
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_student_balance_non_negative"
  CHECK ("kind" <> 'STUDENT' OR "balanceCredits" >= 0);

-- A wallet belongs to a student exactly when it is a STUDENT wallet.
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_student_matches_kind"
  CHECK (("kind" = 'STUDENT') = ("studentId" IS NOT NULL));

-- One wallet per school-side kind.
CREATE UNIQUE INDEX "wallets_one_per_school_kind" ON "wallets" ("kind") WHERE "kind" <> 'STUDENT';

INSERT INTO "wallets" ("id", "kind", "balanceCredits", "updatedAt")
SELECT gen_random_uuid()::text, k::"WalletKind", 0, CURRENT_TIMESTAMP
FROM unnest(ARRAY['BANK', 'CASH_OFFICE', 'CAFETERIA', 'ADJUSTMENT']) AS k;

-- ---------------------------------------------------------------- old single-entry rows

-- Keep the old rows, with the school-side wallet each one moved credits to or from.
CREATE TEMP TABLE "ledger_v1" ON COMMIT DROP AS
SELECT
  e.*,
  gen_random_uuid()::text AS "transactionId",
  (SELECT w."id" FROM "wallets" w WHERE w."kind" = (
    CASE
      WHEN e."type" = 'TOPUP_SEPAY' THEN 'BANK'
      WHEN e."type" = 'TOPUP_CASH' THEN 'CASH_OFFICE'
      WHEN e."type" IN ('PURCHASE', 'VOID_REVERSAL') THEN 'CAFETERIA'
      WHEN e."type" = 'ADJUSTMENT' THEN 'ADJUSTMENT'
      WHEN r."method" = 'BANK_TRANSFER' THEN 'BANK'
      ELSE 'CASH_OFFICE' -- REFUND paid in cash
    END)::"WalletKind") AS "counterWalletId"
FROM "ledger_entries" e
LEFT JOIN "refunds" r ON e."refType" = 'REFUND' AND r."id" = e."refId"
WHERE e."amountCredits" <> 0; -- a zero entry moved nothing and has no second leg

DROP TABLE "ledger_entries";
DROP FUNCTION "ledger_entries_append_only"();

-- ---------------------------------------------------------------- ledger tables

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "type" "LedgerType" NOT NULL,
    "amountCredits" INTEGER NOT NULL,
    "refType" TEXT NOT NULL,
    "refId" TEXT NOT NULL,
    "actorId" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" BIGSERIAL NOT NULL,
    "transactionId" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "amountCredits" INTEGER NOT NULL,
    "balanceAfter" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ledger_transactions_createdAt_idx" ON "ledger_transactions"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_type_refType_refId_key" ON "ledger_transactions"("type", "refType", "refId");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_entries_transactionId_walletId_key" ON "ledger_entries"("transactionId", "walletId");

-- CreateIndex
CREATE INDEX "ledger_entries_walletId_createdAt_idx" ON "ledger_entries"("walletId", "createdAt");

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ledger_transactions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_amount_positive" CHECK ("amountCredits" > 0);
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_amount_non_zero" CHECK ("amountCredits" <> 0);

-- ---------------------------------------------------------------- convert old rows

INSERT INTO "ledger_transactions" ("id", "type", "amountCredits", "refType", "refId", "actorId", "note", "createdAt")
SELECT "transactionId", "type", abs("amountCredits"), "refType", "refId", "actorId", "note", "createdAt"
FROM "ledger_v1"
ORDER BY "createdAt", "id";

-- The student leg keeps its recorded balanceAfter; the school-side leg gets a running balance.
INSERT INTO "ledger_entries" ("transactionId", "walletId", "amountCredits", "balanceAfter", "createdAt")
SELECT "transactionId", "walletId", "amountCredits", "balanceAfter", "createdAt"
FROM (
  SELECT "transactionId", "walletId", "amountCredits", "balanceAfter", "createdAt", "id", 0 AS leg
  FROM "ledger_v1"
  UNION ALL
  SELECT "transactionId", "counterWalletId", -"amountCredits",
         SUM(-"amountCredits") OVER (PARTITION BY "counterWalletId" ORDER BY "createdAt", "id"),
         "createdAt", "id", 1
  FROM "ledger_v1"
) legs
ORDER BY "createdAt", "id", leg;

-- Student wallets already hold their cached sum (the nightly check reports any old drift).
UPDATE "wallets" w
SET "balanceCredits" = s."sum", "updatedAt" = CURRENT_TIMESTAMP
FROM (SELECT "walletId", SUM("amountCredits") AS "sum" FROM "ledger_entries" GROUP BY "walletId") s
WHERE w."id" = s."walletId" AND w."kind" <> 'STUDENT';

-- ---------------------------------------------------------------- invariants

-- Inserting an entry is the only way a balance changes: the trigger adds the amount to the wallet
-- (taking its row lock, so the CHECK above sees the real result) and records balanceAfter.
CREATE FUNCTION "ledger_entry_apply"() RETURNS trigger AS $$
BEGIN
  UPDATE "wallets"
     SET "balanceCredits" = "balanceCredits" + NEW."amountCredits", "updatedAt" = CURRENT_TIMESTAMP
   WHERE "id" = NEW."walletId"
  RETURNING "balanceCredits" INTO NEW."balanceAfter";
  IF NOT FOUND THEN
    RAISE EXCEPTION 'wallet % does not exist', NEW."walletId" USING ERRCODE = 'foreign_key_violation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ledger_entries_apply"
  BEFORE INSERT ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "ledger_entry_apply"();

-- Never edit a wallet balance directly. pg_trigger_depth() is 2 only when the UPDATE comes from
-- ledger_entry_apply().
CREATE FUNCTION "wallets_balance_guard"() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW."balanceCredits" <> 0 THEN
      RAISE EXCEPTION 'a wallet starts at 0 credits; post a ledger transaction to fund it';
    END IF;
  ELSE
    IF NEW."kind" <> OLD."kind" THEN
      RAISE EXCEPTION 'a wallet''s kind never changes';
    END IF;
    IF NEW."balanceCredits" <> OLD."balanceCredits" AND pg_trigger_depth() < 2 THEN
      RAISE EXCEPTION 'wallets.balanceCredits changes only through ledger_entries; post a ledger transaction instead';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "wallets_balance_guard"
  BEFORE INSERT OR UPDATE ON "wallets"
  FOR EACH ROW EXECUTE FUNCTION "wallets_balance_guard"();

-- Checked at COMMIT: a transaction has exactly two entries, -amount and +amount.
CREATE FUNCTION "ledger_transaction_balanced"() RETURNS trigger AS $$
DECLARE
  tx_id TEXT;
  tx_amount INTEGER;
  legs INTEGER;
  total BIGINT;
  matching INTEGER;
BEGIN
  IF TG_TABLE_NAME = 'ledger_transactions' THEN
    tx_id := NEW."id";
  ELSE
    tx_id := NEW."transactionId";
  END IF;

  SELECT t."amountCredits",
         count(e."id"),
         coalesce(sum(e."amountCredits"), 0),
         count(*) FILTER (WHERE abs(e."amountCredits") = t."amountCredits")
    INTO tx_amount, legs, total, matching
    FROM "ledger_transactions" t
    LEFT JOIN "ledger_entries" e ON e."transactionId" = t."id"
   WHERE t."id" = tx_id
   GROUP BY t."amountCredits";

  IF legs <> 2 OR total <> 0 OR matching <> 2 THEN
    RAISE EXCEPTION 'ledger transaction % must have 2 entries of -% and +% (has % entries summing to %)',
      tx_id, tx_amount, tx_amount, legs, total
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE CONSTRAINT TRIGGER "ledger_transactions_balanced"
  AFTER INSERT ON "ledger_transactions"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "ledger_transaction_balanced"();

CREATE CONSTRAINT TRIGGER "ledger_entries_balanced"
  AFTER INSERT ON "ledger_entries"
  DEFERRABLE INITIALLY DEFERRED
  FOR EACH ROW EXECUTE FUNCTION "ledger_transaction_balanced"();

-- FR-WAL-04: the ledger is never edited or deleted; mistakes are corrected with new transactions.
CREATE FUNCTION "ledger_append_only"() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION '% is append-only; correct mistakes with a new ledger transaction', TG_TABLE_NAME;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER "ledger_transactions_append_only"
  BEFORE UPDATE OR DELETE ON "ledger_transactions"
  FOR EACH ROW EXECUTE FUNCTION "ledger_append_only"();

CREATE TRIGGER "ledger_transactions_no_truncate"
  BEFORE TRUNCATE ON "ledger_transactions"
  FOR EACH STATEMENT EXECUTE FUNCTION "ledger_append_only"();

CREATE TRIGGER "ledger_entries_append_only"
  BEFORE UPDATE OR DELETE ON "ledger_entries"
  FOR EACH ROW EXECUTE FUNCTION "ledger_append_only"();

CREATE TRIGGER "ledger_entries_no_truncate"
  BEFORE TRUNCATE ON "ledger_entries"
  FOR EACH STATEMENT EXECUTE FUNCTION "ledger_append_only"();

COMMIT;
