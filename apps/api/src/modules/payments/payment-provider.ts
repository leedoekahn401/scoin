import type { Prisma } from '@prisma/client';

/** What the parent needs to pay a top-up (shown on the checkout screen, FR-TOP-02). */
export interface PaymentInstructions {
  qrUrl: string;
  bank: string;
  account: string;
  holder: string;
}

/** A transfer into the school's account, as the provider reports it. */
export interface IncomingTransfer {
  /** The provider's transaction id; the same transfer always has the same id (NFR-REL-03). */
  id: bigint;
  gateway: string;
  accountNumber: string;
  amountVnd: number;
  /** Transfer content typed by the payer; the payment code is found in here. */
  content: string;
  description?: string;
  referenceCode?: string;
  receivedAt: Date;
  rawPayload: Prisma.InputJsonValue;
}

/**
 * The payment add-in (ADR 0007). A provider turns a top-up into payment instructions and reports
 * transfers to PaymentsService.receiveTransfer(), which matches them and credits the ledger.
 * The mock provider is active today; SePay will plug in behind the same interface.
 */
export interface PaymentProvider {
  readonly name: string;
  checkout(topUp: { paymentCode: string; amountVnd: number }): PaymentInstructions;
}
