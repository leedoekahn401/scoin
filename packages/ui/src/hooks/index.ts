'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * USB barcode/QR scanners act as a keyboard: they type the code very fast
 * and press Enter (FR-POS-03, §2.3). This hook listens globally, so the scan
 * works no matter which element has focus (FR-POS-09), while normal typing
 * in inputs is left alone unless it ends in a fast burst + Enter.
 *
 *   useCardScanner((code) => lookup(code), { enabled: !modalOpen });
 */
export function useCardScanner(
  onScan: (code: string) => void,
  {
    enabled = true,
    minLength = 6,
    maxGapMs = 45,
  }: { enabled?: boolean; minLength?: number; maxGapMs?: number } = {},
) {
  const buffer = useRef('');
  const last = useRef(0);
  const handler = useRef(onScan);
  handler.current = onScan;

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const now = performance.now();
      const gap = now - last.current;
      last.current = now;
      if (e.key === 'Enter') {
        const code = buffer.current;
        buffer.current = '';
        if (code.length >= minLength) {
          e.preventDefault();
          handler.current(code);
        }
        return;
      }
      if (e.key.length !== 1 || e.ctrlKey || e.metaKey || e.altKey) return;
      if (gap > maxGapMs) buffer.current = '';
      buffer.current += e.key;
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [enabled, minLength, maxGapMs]);
}

/** Seconds left until `expiresAt`, ticking once a second. */
export function useCountdown(expiresAt: string | null | undefined): number {
  const compute = useCallback(
    () => (expiresAt ? Math.max(0, Math.round((Date.parse(expiresAt) - Date.now()) / 1000)) : 0),
    [expiresAt],
  );
  const [left, setLeft] = useState(compute);
  useEffect(() => {
    setLeft(compute());
    const t = window.setInterval(() => setLeft(compute()), 1000);
    return () => window.clearInterval(t);
  }, [compute]);
  return left;
}

/**
 * Calls `onIdle` after `seconds` without pointer/keyboard/touch activity
 * (kiosk auto sign-out, FR-KIO-05). Returns seconds remaining so the screen
 * can show a gentle countdown near the end.
 */
export function useIdleTimer(seconds: number, onIdle: () => void, enabled = true): number {
  const [left, setLeft] = useState(seconds);
  const deadline = useRef(Date.now() + seconds * 1000);
  const idle = useRef(onIdle);
  idle.current = onIdle;

  useEffect(() => {
    if (!enabled) return;
    deadline.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    const bump = () => {
      deadline.current = Date.now() + seconds * 1000;
    };
    const events = ['pointerdown', 'keydown', 'touchstart', 'wheel'] as const;
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    const t = window.setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) {
        window.clearInterval(t);
        idle.current();
      }
    }, 250);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      window.clearInterval(t);
    };
  }, [seconds, enabled]);

  return left;
}

/** A stable random key per logical attempt (POS idempotency, NFR-REL-02). */
export function newIdempotencyKey(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
