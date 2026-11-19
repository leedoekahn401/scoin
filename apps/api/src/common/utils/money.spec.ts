import { creditsToVnd, vndToCredits } from './money';

describe('money', () => {
  it('converts credits to VND', () => {
    expect(creditsToVnd(25)).toBe(25_000);
  });

  it('floors VND to whole credits', () => {
    expect(vndToCredits(25_999)).toBe(25);
    expect(vndToCredits(999)).toBe(0);
  });
});
