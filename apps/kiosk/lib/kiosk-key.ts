/** Device key sent as X-Kiosk-Key (FR-KIO-06). Set per kiosk machine in .env.local. */
export function kioskKey(): string {
  const key = process.env.NEXT_PUBLIC_KIOSK_KEY;
  if (!key) throw new Error('NEXT_PUBLIC_KIOSK_KEY is not set for this kiosk');
  return key;
}
