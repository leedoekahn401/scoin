/** One credit is worth this many VND. Money is stored as integer credits everywhere. */
export const CREDIT_VND = 1000;

/** All "today" calculations use this timezone. */
export const SCHOOL_TIMEZONE = 'Asia/Ho_Chi_Minh';

/** Payment code sent in the bank transfer note: SC + 8 digits. */
export const PAYMENT_CODE_PATTERN = /^SC\d{8}$/;
