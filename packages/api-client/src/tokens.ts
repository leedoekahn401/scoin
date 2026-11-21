/**
 * Where the front-ends keep credentials. Per SRS §B3 the refresh token lives
 * in an httpOnly cookie the browser handles itself; only the short-lived
 * access token and the kiosk session token are kept here. Each app has its
 * own origin, so each app has its own store.
 */
const ACCESS_KEY = 'schoolcoin.accessToken';
const KIOSK_KEY = 'schoolcoin.kioskSession';

const storage = (): Storage | null =>
  typeof window === 'undefined' ? null : window.sessionStorage;

const persistent = (): Storage | null =>
  typeof window === 'undefined' ? null : window.localStorage;

export class TokenStore {
  get access(): string | null {
    return persistent()?.getItem(ACCESS_KEY) ?? null;
  }

  setAccess(token: string) {
    persistent()?.setItem(ACCESS_KEY, token);
  }

  clearAccess() {
    persistent()?.removeItem(ACCESS_KEY);
  }

  /** Kiosk sessions are per-tab and die with it (NFR-PRV-03). */
  get kiosk(): string | null {
    return storage()?.getItem(KIOSK_KEY) ?? null;
  }

  setKiosk(token: string) {
    storage()?.setItem(KIOSK_KEY, token);
  }

  clearKiosk() {
    storage()?.removeItem(KIOSK_KEY);
  }
}
