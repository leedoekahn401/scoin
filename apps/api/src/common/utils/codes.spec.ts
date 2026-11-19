import { PAYMENT_CODE_PATTERN } from '@schoolcoin/types';
import { cardCode, inviteCode, paymentCode } from './codes';

describe('codes', () => {
  it('payment code is SC + 8 digits', () => {
    expect(paymentCode()).toMatch(PAYMENT_CODE_PATTERN);
  });

  it('card code is 16 base32 chars (80 bits)', () => {
    expect(cardCode()).toMatch(/^[A-Z2-7]{16}$/);
    expect(cardCode()).not.toBe(cardCode());
  });

  it('invite code has no look-alike characters', () => {
    expect(inviteCode(200)).not.toMatch(/[01OI]/);
  });
});
