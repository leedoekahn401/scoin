import { SCHOOL_TIMEZONE, VND_PER_CREDIT } from '@schoolcoin/types';

/**
 * Formatting for every number, amount and date on screen (NFR-USE-01):
 * the unit is "xu" (1 xu = 1 credit = 1,000 VND) and VND uses Vietnamese
 * grouping: "25 xu (25.000 ₫)". Never format money inline in a component.
 */

const INT = new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 });

/** 1234 → "1.234" */
export function formatNumber(value: number): string {
  return INT.format(value);
}

/** 25 → "25 xu" (signed: "+25 xu" / "−25 xu"). */
export function formatCredits(credits: number, options: { signed?: boolean } = {}): string {
  const abs = INT.format(Math.abs(credits));
  if (options.signed) {
    if (credits > 0) return `+${abs} xu`;
    if (credits < 0) return `−${abs} xu`;
  }
  return `${credits < 0 ? '−' : ''}${abs} xu`;
}

/** 25000 → "25.000 ₫" */
export function formatVnd(vnd: number): string {
  return `${vnd < 0 ? '−' : ''}${INT.format(Math.abs(vnd))} ₫`;
}

/** Credits expressed in VND: 25 → "25.000 ₫" */
export function creditsToVnd(credits: number): string {
  return formatVnd(credits * VND_PER_CREDIT);
}

/** 25 → "25 xu (25.000 ₫)" — the SRS's canonical amount display. */
export function formatCreditsWithVnd(credits: number): string {
  return `${formatCredits(credits)} (${creditsToVnd(credits)})`;
}

const DATE_TIME = new Intl.DateTimeFormat('vi-VN', {
  timeZone: SCHOOL_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const DATE = new Intl.DateTimeFormat('vi-VN', {
  timeZone: SCHOOL_TIMEZONE,
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});
const TIME = new Intl.DateTimeFormat('vi-VN', {
  timeZone: SCHOOL_TIMEZONE,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});
const WEEKDAY_DATE = new Intl.DateTimeFormat('vi-VN', {
  timeZone: SCHOOL_TIMEZONE,
  weekday: 'long',
  day: 'numeric',
  month: 'numeric',
});
type DateInput = string | number | Date;

/** "19/11/2026 14:05" */
export function formatDateTime(value: DateInput): string {
  return DATE_TIME.format(new Date(value)).replace(',', '');
}

/** "19/11/2026" */
export function formatDate(value: DateInput): string {
  return DATE.format(new Date(value));
}

/** "14:05" */
export function formatTime(value: DateInput): string {
  return TIME.format(new Date(value));
}

/** "thứ Năm, 19/11" */
export function formatWeekdayDate(value: DateInput): string {
  return WEEKDAY_DATE.format(new Date(value));
}

/** A `YYYY-MM-DD` VN date → "19/11". Parsed at noon UTC so it never shifts a day. */
export function formatShortDay(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${d}/${m}`;
}

/** Time only if today (VN), otherwise "18/11 14:05". */
export function formatWhen(value: DateInput): string {
  const date = new Date(value);
  if (DATE.format(date) === DATE.format(new Date())) return formatTime(date);
  const [d, m] = DATE.format(date).split('/');
  return `${d}/${m} ${formatTime(date)}`;
}

/** "vừa xong", "5 phút trước", "3 giờ trước", "hôm qua", or the date. */
export function formatRelative(value: DateInput, now: Date = new Date()): string {
  const diff = now.getTime() - new Date(value).getTime();
  const minutes = Math.round(diff / 60_000);
  if (minutes < 1) return 'vừa xong';
  if (minutes < 60) return `${minutes} phút trước`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.round(hours / 24);
  if (days === 1) return 'hôm qua';
  if (days < 7) return `${days} ngày trước`;
  return formatDate(value);
}

/** Seconds → "29:41" */
export function formatCountdown(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}

/** "ABCD1234EF567890" → "ABCD 1234 EF56 7890" for card codes on screen and print. */
export function formatCardCode(code: string): string {
  return code.replace(/(.{4})(?=.)/g, '$1 ');
}

/** Initials for avatars: "Nguyễn Minh Anh" → "MA" (Vietnamese names: last two words). */
export function initials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  const picked = parts.length >= 2 ? parts.slice(-2) : parts;
  return picked.map((p) => p[0]?.toUpperCase() ?? '').join('');
}

/** First name for greetings: "Nguyễn Minh Anh" → "Anh"… Vietnamese uses the given name, i.e. the last word. */
export function givenName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/);
  return parts.at(-1) ?? fullName;
}
