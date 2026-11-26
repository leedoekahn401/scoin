import { AppError } from '../errors/app-error';
import { dateRange, pageArgs, pageQuery, paginate } from './query';

describe('pageQuery', () => {
  it('coerces query-string numbers and fills defaults', () => {
    expect(pageQuery.parse({ page: '3', pageSize: '10' })).toEqual({ page: 3, pageSize: 10 });
    expect(pageQuery.parse({})).toEqual({ page: 1, pageSize: 20 });
  });

  it('refuses page 0 and oversized pages', () => {
    expect(pageQuery.safeParse({ page: '0' }).success).toBe(false);
    expect(pageQuery.safeParse({ pageSize: '101' }).success).toBe(false);
  });
});

describe('paginate', () => {
  it('passes skip/take to the fetch and wraps the result', async () => {
    const fetch = jest.fn(async () => ['c', 'd']);
    const page = await paginate({ page: 2, pageSize: 2 }, fetch, async () => 5);
    expect(fetch).toHaveBeenCalledWith(pageArgs({ page: 2, pageSize: 2 }));
    expect(pageArgs({ page: 2, pageSize: 2 })).toEqual({ skip: 2, take: 2 });
    expect(page).toEqual({ items: ['c', 'd'], page: 2, pageSize: 2, total: 5 });
  });
});

describe('dateRange', () => {
  it('covers whole Vietnam days, `to` inclusive', () => {
    expect(dateRange({ from: '2026-11-01', to: '2026-11-02' })).toEqual({
      gte: new Date('2026-10-31T17:00:00Z'),
      lt: new Date('2026-11-02T17:00:00Z'),
    });
  });

  it('leaves missing bounds open', () => {
    expect(dateRange({})).toEqual({});
    expect(dateRange({ to: '2026-11-01' })).toEqual({ lt: new Date('2026-11-01T17:00:00Z') });
  });

  it('refuses from after to', () => {
    expect(() => dateRange({ from: '2026-11-03', to: '2026-11-02' })).toThrow(AppError);
  });
});
