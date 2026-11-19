'use client';

import { useState } from 'react';

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'clear', '0', 'back'] as const;

export interface PinPadProps {
  length?: number;
  onComplete: (pin: string) => void;
}

/** Shared by POS and kiosk. */
export function PinPad({ length = 4, onComplete }: PinPadProps) {
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
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2" aria-label={`${pin.length} of ${length} digits entered`}>
        {Array.from({ length }, (_, i) => (
          <span
            key={i}
            className={`h-4 w-4 rounded-full ${i < pin.length ? 'bg-gray-900' : 'bg-gray-300'}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            aria-label={key === 'clear' ? 'Clear' : key === 'back' ? 'Delete last digit' : key}
            className="h-16 w-16 rounded-lg bg-gray-100 text-xl font-semibold hover:bg-gray-200"
          >
            {key === 'clear' ? 'C' : key === 'back' ? '⌫' : key}
          </button>
        ))}
      </div>
    </div>
  );
}
