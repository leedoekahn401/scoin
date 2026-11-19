import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Skips the global JWT guard. Used for sign-in/registration, the SePay webhook (API key)
 * and kiosk routes (device key + kiosk session).
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
