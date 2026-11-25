# 0007 — Payment provider add-in, mock first

**Status:** Accepted · defers SePay (ADR 0003) · SRS FR-TOP-01…07, BR-06, BR-08

## Context

Parent top-ups were planned around SePay (ADR 0003). The team wants the top-up flow and the
ledger working end to end before connecting a real payment service.

## Decision

- **One interface, swappable providers.** `PaymentProvider` (`apps/api/src/modules/payments`)
  turns a top-up into payment instructions (QR, bank, account, holder). `payments.service.ts`
  exports the active one; today it is `MockPaymentProvider`.
- **Provider-neutral intake.** Every provider reports money in as an `IncomingTransfer` to
  `PaymentsService.receiveTransfer()`, which:
  - records the transfer once, keyed on the provider's transaction id (NFR-REL-03);
  - finds the `SC########` payment code in the content and locks that top-up;
  - for a PENDING or EXPIRED top-up (BR-08), credits ⌊VND / 1,000⌋ through the double-entry
    ledger (`BANK` → student, ADR 0006), marks it PAID and flags a different amount for review
    (BR-06);
  - leaves anything else UNMATCHED for an accountant (FR-TOP-06), including transfers for
    cancelled or already-paid top-ups.

- **Storage.** Transfers are stored in `sepay_transactions` with `gateway = 'MOCKBANK'`; the table
  is the record of incoming transfers whatever the provider.
- **The mock.** Its QR is a placeholder SVG and nothing leaves the server. A payment happens only
  through `POST /api/v1/dev/simulate-transfer {amountVnd, content}`, the route the front ends'
  "Simulate transfer" button already calls. `app.ts` mounts the `/dev` routes only while the mock
  is the active provider.
- **SePay later.** Add a `SepayPaymentProvider` (VietQR from `qr.ts`), make the webhook build an
  `IncomingTransfer` and call `receiveTransfer()`, and switch `paymentProvider`. The `/dev` routes
  then disappear.

## Consequences

- Top-ups, the ledger and the parent screens can be built and demoed without SePay credentials.
- While the mock is active, **any signed-in user can create credits** with the simulate route.
  It must not be the active provider where real money is involved.
- Ledger type `TOPUP_SEPAY` (shared with the front ends) now means "bank-transfer top-up", whatever
  the provider.
