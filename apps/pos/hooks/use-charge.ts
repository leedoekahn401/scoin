'use client';

import { useRef } from 'react';

/**
 * One idempotency key per checkout: retries of the same checkout reuse it,
 * a new checkout gets a fresh one via reset().
 */
export function useIdempotencyKey() {
  const key = useRef<string>(crypto.randomUUID());
  return {
    get: () => key.current,
    reset: () => {
      key.current = crypto.randomUUID();
    },
  };
}
