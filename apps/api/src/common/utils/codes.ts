import { createHash, randomInt } from 'node:crypto';

function digits(n: number): string {
  return Array.from({ length: n }, () => randomInt(10)).join('');
}

/** Payment code for the bank transfer note: SC + 8 digits. */
export function paymentCode(): string {
  return `SC${digits(8)}`;
}

/** Printed on the student card / barcode. */
export function cardCode(): string {
  return `CARD${digits(6)}`;
}

/** Given to parents to link to a student. No look-alike characters (0/O, 1/I). */
export function inviteCode(length = 8): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => alphabet[randomInt(alphabet.length)]).join('');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}
