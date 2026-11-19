export default () => ({
  port: Number(process.env.PORT ?? 4000),
  corsOrigins: (process.env.CORS_ORIGINS ?? '').split(',').filter(Boolean),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '7d',
  },
  sepay: {
    apiKey: process.env.SEPAY_API_KEY,
    bankAccount: process.env.SEPAY_BANK_ACCOUNT,
    bankCode: process.env.SEPAY_BANK_CODE,
  },
  mail: {
    host: process.env.SMTP_HOST ?? 'localhost',
    port: Number(process.env.SMTP_PORT ?? 1025),
    from: process.env.MAIL_FROM ?? 'SchoolCoin <no-reply@schoolcoin.local>',
  },
});
