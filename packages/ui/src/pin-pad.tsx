'use client';

import { useState } from 'react';
import { cn } from './lib/utils';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const;

export interface PinPadProps {
  length?: number;
  onComplete: (pin: string) => void;
  disabled?: boolean;
}

/** Shared by POS and kiosk. The PIN is never shown, only the dot count (NFR-SEC-02). */
export function PinPad({ length = 4, onComplete, disabled }: PinPadProps) {
  const [pin, setPin] = useState('');

  function press(key: (typeof KEYS)[number]) {
    if (key === 'clear') return setPin('');
    if (key === 'back') return setPin((p) => p.slice(0, -1));
    const next = (pin + key).slice(0, length);
    setPin(next);
    if (next.length === length) {
      onComplete(next);
      setPin('');
    }
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-3" aria-label={`Đã nhập ${pin.length} trên ${length} số`}>
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={cn('h-4 w-4 rounded-full', i < pin.length ? 'bg-foreground' : 'bg-muted')}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            disabled={disabled}
            onClick={() => press(key)}
            aria-label={key === 'clear' ? 'Xóa hết' : key === 'back' ? 'Xóa số cuối' : key}
            className="h-20 w-20 rounded-xl bg-secondary text-2xl font-semibold hover:bg-secondary/70 disabled:opacity-50"
          >
            {key === 'clear' ? 'C' : key === 'back' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  );
}
