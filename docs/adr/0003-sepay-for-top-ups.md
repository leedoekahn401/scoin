# 0003 — SePay for parent top-ups

**Status:** Accepted

## Context

Parents top up by bank transfer (VietQR). We need to know automatically when money arrives
and which student it is for.

## Decision

Use SePay to watch the school's bank account. Each top-up gets a unique payment code
(`SC` + 8 digits) that goes in the transfer note. SePay calls `POST /webhooks/sepay` with
`Authorization: Apikey <key>`; the API dedups on the SePay transaction `id`, finds the code in
`content`, and credits the wallet. Transfers with no matching code are stored as unmatched for
an accountant to assign or ignore.

## Consequences

- No card payments or payment gateway fees; parents use their own banking app.
- Wrong or missing transfer notes need manual handling (unmatched list, review list).
- Dev needs a public URL for the webhook (`infra/scripts/tunnel.sh`).
