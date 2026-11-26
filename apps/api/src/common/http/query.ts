import type { Paginated } from '@schoolcoin/types';
import { badRequest } from '../errors/http-errors';
import { z } from '../zod';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * `?page&pageSize` (PageQuery in @schoolcoin/types). Query strings are text, so the numbers are coerced.
 * Spread `.shape` into a route's query object: z.object({ ...pageQuery.shape, q: … }).
 */
export const pageQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
});
export type PageParams = z.infer<typeof pageQuery>;

/** `?from&to` as YYYY-MM-DD Vietnam calendar days, both inclusive. Turn into a filter with dateRange(). */
export const dateRangeQuery = z.object({
  from: z.iso.date().optional().openapi({ description: 'First day, YYYY-MM-DD (Vietnam time)' }),
  to: z.iso
    .date()
    .optional()
    .openapi({ description: 'Last day, YYYY-MM-DD (Vietnam time), inclusive' }),
});
export type DateRangeParams = z.infer<typeof dateRangeQuery>;

/** Prisma `skip`/`take` for a page. */
export function pageArgs({ page, pageSize }: PageParams) {
  return { skip: (page - 1) * pageSize, take: pageSize };
}

/** Runs the page fetch and the total count together and wraps them as { items, page, pageSize, total }. */
export async function paginate<T>(
  query: PageParams,
  fetch: (args: { skip: number; take: number }) => Promise<T[]>,
  count: () => Promise<number>,
): Promise<Paginated<T>> {
  const [items, total] = await Promise.all([fetch(pageArgs(query)), count()]);
  return { items, page: query.page, pageSize: query.pageSize, total };
}

/**
 * A Prisma DateTime filter `{ gte, lt }` covering whole Vietnam days: `from` 00:00 to the
 * midnight after `to`, both at UTC+7. Missing bounds are left open.
 */
export function dateRange({ from, to }: DateRangeParams): { gte?: Date; lt?: Date } {
  const gte = from ? vnMidnight(from) : undefined;
  const lt = to ? new Date(vnMidnight(to).getTime() + DAY_MS) : undefined;
  if (gte && lt && gte >= lt) throw badRequest('`from` must not be after `to`', { from, to });
  return { ...(gte && { gte }), ...(lt && { lt }) };
}

/** Vietnam has no DST, so a day always starts at 00:00+07:00. */
function vnMidnight(day: string): Date {
  return new Date(`${day}T00:00:00+07:00`);
}
