const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'SEPAY_WEBHOOK_KEY',
  'SCHOOL_BANK_NAME',
  'SCHOOL_BANK_ACCOUNT',
  'SCHOOL_BANK_HOLDER',
] as const;

/** Fails fast at boot if a required env var is missing. */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return env;
}
