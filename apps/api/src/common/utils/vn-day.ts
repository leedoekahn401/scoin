/** Vietnam has no DST, so the offset is fixed at UTC+7. */
const VN_OFFSET_MS = 7 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Start of "today" in Asia/Ho_Chi_Minh, as a UTC Date. */
export function startOfVnDay(now: Date = new Date()): Date {
  const vnMidnight = Math.floor((now.getTime() + VN_OFFSET_MS) / DAY_MS) * DAY_MS;
  return new Date(vnMidnight - VN_OFFSET_MS);
}

/** End of "today" (exclusive) in Asia/Ho_Chi_Minh, as a UTC Date. */
export function endOfVnDay(now: Date = new Date()): Date {
  return new Date(startOfVnDay(now).getTime() + DAY_MS);
}
