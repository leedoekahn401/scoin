# 0003 — SePay for parent top-ups

**Status:** Accepted · SRS B6, C-02, FR-TOP-01…07

## Context

Parents top up by bank transfer (VietQR). We need to know automatically when money arrives
and which student it is for.

## Decision

Use SePay to watch the school's bank account (SePay Test mode for development and the demo).
Each top-up gets a unique payment code (`SC` + 8 digits) that goes in the transfer content.
SePay calls `POST /api/v1/webhooks/sepay` with `Authorization: Apikey <SEPAY_WEBHOOK_KEY>`; the API
stores the transaction keyed by SePay's `id` (duplicates are ignored), matches `code` to a top-up,
and credits ⌊amount / 1,000⌋ credits. Transfers with no matching code become unmatched payments
for an accountant to assign or ignore. The endpoint always answers `200 {"success": true}` to an
authenticated delivery, otherwise SePay retries.

## Consequences

- No card payments or gateway fees; parents use their own banking app.
- Wrong or missing transfer content needs manual handling (unmatched list, review list).
- The webhook needs a public URL in dev (`infra/scripts/tunnel.sh`).
