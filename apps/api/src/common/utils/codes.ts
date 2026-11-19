import { createHash, randomBytes, randomInt } from 'node:crypto';

function digits(n: number): string {
  return Array.from({ length: n }, () => randomInt(10)).join('');
}

/** FR-TOP-02: payment code for the transfer content, SC + 8 digits. */
export function paymentCode(): string {
  return `SC${digits(8)}`;
}

/** NFR-SEC-05: 80 random bits, base32 (16 chars), unrelated to the student code. */
export function cardCode(): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  const bytes = randomBytes(10);
  let bits = 0;
  let value = 0;
  let out = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      out += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  return out;
}

/** FR-FAM-01: one-time code given to parents. No look-alike characters (0/O, 1/I). */
export function inviteCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');
}

/** Opaque token for refresh, password reset, kiosk sessions and kiosk device keys. */
export function randomToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
