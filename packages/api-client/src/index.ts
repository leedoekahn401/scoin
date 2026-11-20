import type { SchoolCoinApi } from './contract';
import { createHttpApi } from './http/client';
import { createMockApi } from './mock/browser';

export * from './contract';
export * from './errors';
export { createHttpApi } from './http/client';
export { createMockApi } from './mock/browser';

export interface ApiConfig {
  /** "mock" runs everything in the browser; "http" calls `baseUrl`. */
  mode: 'mock' | 'http';
  baseUrl?: string;
  kioskKey?: string;
}

/**
 * Reads NEXT_PUBLIC_API_MODE / NEXT_PUBLIC_API_BASE_URL. Next inlines
 * `process.env.NEXT_PUBLIC_*` at build time only for literal property access,
 * so each variable is read by name rather than through a helper.
 */
export function apiConfigFromEnv(overrides: Partial<ApiConfig> = {}): ApiConfig {
  const mode = (process.env.NEXT_PUBLIC_API_MODE === 'http' ? 'http' : 'mock') as ApiConfig['mode'];
  return {
    mode,
    baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000/api/v1',
    kioskKey: process.env.NEXT_PUBLIC_KIOSK_DEVICE_KEY ?? 'demo-kiosk-key',
    ...overrides,
  };
}

export function createApi(config: ApiConfig): SchoolCoinApi {
  if (config.mode === 'http') {
    return createHttpApi({
      baseUrl: config.baseUrl ?? 'http://localhost:4000/api/v1',
      kioskKey: config.kioskKey,
    });
  }
  return createMockApi({ kioskKey: config.kioskKey });
}
