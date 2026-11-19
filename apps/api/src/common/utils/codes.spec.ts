import { PAYMENT_CODE_PATTERN } from '@schoolcoin/types';
import { inviteCode, paymentCode } from './codes';

describe('codes', () => {
  it('payment code is SC + 8 digits', () => {
    expect(paymentCode()).toMatch(PAYMENT_CODE_PATTERN);
  });

  it('invite code has no look-alike characters', () => {
    expect(inviteCode(200)).not.toMatch(/[01OI]/);
  });
});
