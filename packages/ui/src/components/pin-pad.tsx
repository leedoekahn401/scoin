'use client';

import { Delete } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

import { cn } from '../lib/cn';

/**
 * Touch PIN entry for POS and kiosk (FR-POS-05, FR-KIO-01). Keys are ≥ 64 px
 * (NFR-USE-03), digits also come from the physical keyboard, and the dots
 * shake on a wrong PIN. The PIN itself is never rendered (NFR-SEC-02).
 *
 * Usage: <PinPad length={4} onComplete={(pin) => …} error={msg} />
 * Change `resetKey` to clear it after a failed attempt.
 */
export function PinPad({
  length = 4,
  onComplete,
  error,
  disabled,
  resetKey,
  size = 'lg',
  className,
}: {
  length?: number;
  onComplete: (pin: string) => void;
  error?: string | null;
  disabled?: boolean;
  resetKey?: number | string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const [pin, setPin] = useState('');
  const [shakeKey, setShakeKey] = useState(0);

  useEffect(() => {
    setPin('');
  }, [resetKey]);

  useEffect(() => {
    if (error) setShakeKey((k) => k + 1);
  }, [error, resetKey]);

  const press = useCallback(
    (digit: string) => {
      if (disabled) return;
      setPin((current) => {
        if (current.length >= length) return current;
        const next = current + digit;
        if (next.length === length) window.setTimeout(() => onComplete(next), 90);
        return next;
      });
    },
    [disabled, length, onComplete],
  );

  const back = useCallback(() => setPin((p) => p.slice(0, -1)), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        press(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        back();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [press, back]);

  const key = size === 'lg' ? 'h-[4.5rem] text-3xl' : 'h-14 text-2xl';

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      <div
        key={shakeKey}
        className={cn('flex items-center gap-4', shakeKey > 0 && error && 'shake')}
        aria-live="polite"
      >
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn(
              'pin-dot size-4 rounded-full border-2',
              i < pin.length ? 'border-ink-fg bg-ink-fg' : 'border-border-strong bg-transparent',
              error && pin.length === 0 && 'border-danger',
            )}
          />
        ))}
        <span className="sr-only">
          {pin.length} trên {length} chữ số
        </span>
      </div>
      <p className={cn('min-h-5 text-center text-sm', error ? 'text-danger' : 'text-transparent')}>
        {error ?? '.'}
      </p>
      <div
        className={cn(
          'grid max-w-full grid-cols-3 gap-3',
          size === 'lg' ? 'w-[20rem]' : 'w-[17rem]',
        )}
      >
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
          <PadKey key={d} className={key} onClick={() => press(d)} disabled={disabled}>
            {d}
          </PadKey>
        ))}
        <span />
        <PadKey className={key} onClick={() => press('0')} disabled={disabled}>
          0
        </PadKey>
        <PadKey
          className={cn(key, 'text-ink-muted')}
          onClick={back}
          disabled={disabled || pin.length === 0}
          label="Xóa"
        >
          <Delete className="size-6" />
        </PadKey>
      </div>
    </div>
  );
}

function PadKey({
  children,
  onClick,
  disabled,
  className,
  label,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'workbook-press flex select-none items-center justify-center rounded-[var(--ui-radius)] border border-border bg-surface-white font-display font-medium tabular text-ink-fg shadow-[var(--ui-shadow-xs)]',
        'hover:bg-paper-bg active:bg-brand-tint active:border-brand/50 disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  );
}
