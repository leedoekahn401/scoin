import { randomInt } from 'node:crypto';
import type { IncomingTransfer, PaymentInstructions, PaymentProvider } from './payment-provider';

const BANK = 'MOCKBANK';
const ACCOUNT = '0000000000';
const HOLDER = 'SCHOOLCOIN THANH TOAN THU';

function escapeXml(text: string): string {
  return text.replace(/[<>&"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

/**
 * Stands in for a real payment provider until SePay is wired (ADR 0007). Nothing leaves the
 * server: the "QR" is a placeholder image, and a payment happens only when someone calls
 * POST /dev/simulate-transfer.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = 'mock';

  checkout({
    paymentCode,
    amountVnd,
  }: {
    paymentCode: string;
    amountVnd: number;
  }): PaymentInstructions {
    const amount = `${amountVnd.toLocaleString('vi-VN')} ₫`;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">` +
      `<rect width="240" height="240" rx="16" fill="#f4efe6" stroke="#c9b88f" stroke-dasharray="6 4"/>` +
      `<text x="120" y="88" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#6b5d43">Thanh toán thử</text>` +
      `<text x="120" y="128" text-anchor="middle" font-family="monospace" font-size="22" fill="#2b2418">${escapeXml(paymentCode)}</text>` +
      `<text x="120" y="162" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#2b2418">${escapeXml(amount)}</text>` +
      `</svg>`;
    return {
      qrUrl: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`,
      bank: BANK,
      account: ACCOUNT,
      holder: HOLDER,
    };
  }

  /** The transfer a bank would report after a payer sent `amountVnd` with `content`. */
  transfer({ amountVnd, content }: { amountVnd: number; content: string }): IncomingTransfer {
    const id = BigInt(Date.now()) * 1000n + BigInt(randomInt(1000));
    const receivedAt = new Date();
    const description = `MockTransfer ${content}`;
    return {
      id,
      gateway: BANK,
      accountNumber: ACCOUNT,
      amountVnd,
      content,
      description,
      referenceCode: `MOCK${id}`,
      receivedAt,
      rawPayload: {
        provider: this.name,
        amountVnd,
        content,
        description,
        receivedAt: receivedAt.toISOString(),
      },
    };
  }
}

export const mockPaymentProvider = new MockPaymentProvider();
