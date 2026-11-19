import { endOfVnDay, startOfVnDay } from './vn-day';

describe('vn-day', () => {
  it('returns 17:00 UTC of the previous day for a VN morning', () => {
    // 2026-03-10 08:00 in Vietnam = 01:00 UTC
    expect(startOfVnDay(new Date('2026-03-10T01:00:00Z')).toISOString()).toBe(
      '2026-03-09T17:00:00.000Z',
    );
  });

  it('rolls over at VN midnight, not UTC midnight', () => {
    // 2026-03-10 23:30 UTC = 2026-03-11 06:30 in Vietnam
    expect(startOfVnDay(new Date('2026-03-10T23:30:00Z')).toISOString()).toBe(
      '2026-03-10T17:00:00.000Z',
    );
  });

  it('end of day is 24 hours after start', () => {
    const now = new Date('2026-03-10T01:00:00Z');
    expect(endOfVnDay(now).getTime() - startOfVnDay(now).getTime()).toBe(86_400_000);
  });
});
