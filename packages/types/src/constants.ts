/** BR-01: one credit is worth this many VND. Money is stored as integer credits everywhere. */
export const CREDIT_VND = 1000;

/** BR-03: all "today" calculations use this timezone. */
export const SCHOOL_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** FR-TOP-02: payment code in the transfer content, SC + 8 digits. */
export const PAYMENT_CODE_PATTERN = /^SC\d{8}$/;

/** API base path (B7). */
export const API_PREFIX = 'api/v1';

/**
 * Business-rule defaults. Values marked (setting) can be changed by the council admin
 * at runtime (FR-ADM-05); the API reads the Setting table and falls back to these.
 */
export const RULES = {
  /** BR-05 (setting) */
  PIN_THRESHOLD_CREDITS: 50,
  /** BR-07 (setting) */
  TOPUP_MIN_CREDITS: 10,
  TOPUP_MAX_CREDITS: 2000,
  /** BR-08 (setting) */
  TOPUP_EXPIRY_MINUTES: 30,
  /** UC-04 step 1 */
  TOPUP_PRESETS: [50, 100, 200, 500],
  /** BR-11: shared between kiosk and POS */
  PIN_MAX_ATTEMPTS: 5,
  PIN_LOCK_MINUTES: 15,
  /** FR-AUTH-06 */
  LOGIN_MAX_ATTEMPTS: 5,
  LOGIN_LOCK_MINUTES: 15,
  /** FR-AUTH-03 */
  PASSWORD_RESET_MINUTES: 30,
  /** FR-FAM-01, FR-FAM-03 */
  INVITE_VALID_DAYS: 14,
  MAX_PARENTS_PER_STUDENT: 2,
  /** FR-CTL-01 */
  DAILY_LIMIT_MIN: 1,
  DAILY_LIMIT_MAX: 1000,
  /** UC-11, BR-09 */
  REQUEST_AMOUNTS: [20, 50, 100, 200],
  REQUEST_NOTE_MAX: 100,
  REQUESTS_PER_DAY: 3,
  REQUEST_EXPIRY_DAYS: 7,
  /** FR-KIO-02, FR-KIO-04, FR-KIO-05 */
  KIOSK_RECENT_TRANSACTIONS: 10,
  KIOSK_REQUEST_HISTORY_DAYS: 7,
  KIOSK_IDLE_SECONDS: 30,
  /** B7: kiosk session token lifetime after last activity */
  KIOSK_SESSION_MINUTES: 2,
  /** NFR-SEC-07, requests per minute */
  RATE_LIMIT_LOGIN: 10,
  RATE_LIMIT_KIOSK_PIN: 5,
  RATE_LIMIT_WEBHOOK: 60,
} as const;

/** Keys of the Setting table (FR-ADM-05). */
export const SETTING_KEYS = [
  'pinThresholdCredits',
  'topupMinCredits',
  'topupMaxCredits',
  'topupExpiryMinutes',
  'schoolBank',
] as const;

export type SettingKey = (typeof SETTING_KEYS)[number];

/** Front-end aliases, all derived from the single source of truth above. */
export const VND_PER_CREDIT = CREDIT_VND;
export const DEFAULT_PIN_THRESHOLD = RULES.PIN_THRESHOLD_CREDITS;
export const PIN_LENGTH = 4;
export const PIN_MAX_ATTEMPTS = RULES.PIN_MAX_ATTEMPTS;
export const PIN_LOCK_MINUTES = RULES.PIN_LOCK_MINUTES;
export const TOPUP_MIN_CREDITS = RULES.TOPUP_MIN_CREDITS;
export const TOPUP_MAX_CREDITS = RULES.TOPUP_MAX_CREDITS;
export const TOPUP_EXPIRY_MINUTES = RULES.TOPUP_EXPIRY_MINUTES;
export const TOPUP_PRESETS = RULES.TOPUP_PRESETS;
export const REQUEST_PRESETS = RULES.REQUEST_AMOUNTS;
export const REQUEST_NOTE_MAX = RULES.REQUEST_NOTE_MAX;
export const REQUESTS_PER_DAY = RULES.REQUESTS_PER_DAY;
export const REQUEST_EXPIRY_DAYS = RULES.REQUEST_EXPIRY_DAYS;
export const DAILY_LIMIT_MIN = RULES.DAILY_LIMIT_MIN;
export const DAILY_LIMIT_MAX = RULES.DAILY_LIMIT_MAX;
export const MAX_PARENTS_PER_STUDENT = RULES.MAX_PARENTS_PER_STUDENT;
export const INVITE_VALID_DAYS = RULES.INVITE_VALID_DAYS;
export const KIOSK_IDLE_SECONDS = RULES.KIOSK_IDLE_SECONDS;
export const KIOSK_TRANSACTIONS_SHOWN = RULES.KIOSK_RECENT_TRANSACTIONS;
