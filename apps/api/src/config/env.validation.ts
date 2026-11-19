const REQUIRED = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
  'SEPAY_API_KEY',
  'SEPAY_BANK_ACCOUNT',
  'SEPAY_BANK_CODE',
] as const;

/** Fails fast at boot if a required env var is missing. */
export function validateEnv(env: Record<string, unknown>) {
  const missing = REQUIRED.filter((key) => !env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  return env;
}
