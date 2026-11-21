import { SCHOOL_TIMEZONE } from './constants';

/**
 * BR-03: "today" is the calendar day in Asia/Ho_Chi_Minh. Every daily rule
 * (limits, same-day voids, request caps, reports) goes through these helpers
 * so the browser's own timezone never leaks into a business decision.
 */
const VN_DATE = new Intl.DateTimeFormat('en-CA', {
  timeZone: SCHOOL_TIMEZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** `YYYY-MM-DD` of the instant in Vietnam time. */
export function vnDate(value: Date | string | number = new Date()): string {
  return VN_DATE.format(new Date(value));
}

/** Vietnam is UTC+7 with no DST, so a VN date maps to a fixed UTC window. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;

/** UTC instant of 00:00 Vietnam time on `date` (`YYYY-MM-DD`). */
export function vnDayStart(date: string): Date {
  return new Date(Date.parse(`${date}T00:00:00Z`) - VN_OFFSET_MS);
}

/** `YYYY-MM-DD` that is `days` after `date` (negative goes back). */
export function addDays(date: string, days: number): string {
  const t = Date.parse(`${date}T00:00:00Z`) + days * 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/** Inclusive list of VN dates from `from` to `to`. */
export function dateRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to && out.length < 400; d = addDays(d, 1)) out.push(d);
  return out;
}
