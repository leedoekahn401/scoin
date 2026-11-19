import { CREDIT_VND } from '@schoolcoin/types';

export function creditsToVnd(credits: number): number {
  return credits * CREDIT_VND;
}

/** Rounds down: a partial credit is never granted. */
export function vndToCredits(vnd: number): number {
  return Math.floor(vnd / CREDIT_VND);
}
