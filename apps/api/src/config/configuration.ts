// Values marked `!` are required; validateEnv() fails at boot when one is missing.
export default () => ({
  env: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  appUrls: {
    parent: process.env.PARENT_APP_URL ?? 'http://localhost:3002',
    admin: process.env.ADMIN_APP_URL ?? 'http://localhost:3004',
  },
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET!,
    refreshSecret: process.env.JWT_REFRESH_SECRET!,
    // B3: 15-minute access token; the refresh cookie's lifetime follows the role (FR-AUTH-05).
    accessTtl: '15m',
  },
  sepay: {
    webhookKey: process.env.SEPAY_WEBHOOK_KEY!,
  },
  schoolBank: {
    name: process.env.SCHOOL_BANK_NAME!,
    account: process.env.SCHOOL_BANK_ACCOUNT!,
    holder: process.env.SCHOOL_BANK_HOLDER!,
  },
  uploadDir: process.env.UPLOAD_DIR ?? './uploads',
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    from: process.env.MAIL_FROM ?? 'SchoolCoin <no-reply@schoolcoin.local>',
  },
});
