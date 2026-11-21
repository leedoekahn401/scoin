'use client';

import { useEffect, useState } from 'react';

import { cn } from '../lib/cn';
import { creditsToVnd, formatNumber } from '../lib/format';

/**
 * Pick an amount in credits: preset tiles plus an optional custom field.
 * Used by the parent top-up (presets 50/100/200/500, UC-04) and the kiosk
 * credit request (20/50/100/200, UC-11).
 */
export function AmountPicker({
  presets,
  value,
  onChange,
  min,
  max,
  allowCustom = true,
  size = 'md',
  className,
}: {
  presets: readonly number[];
  value: number | null;
  onChange: (credits: number | null) => void;
  min?: number;
  max?: number;
  allowCustom?: boolean;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const isPreset = value !== null && presets.includes(value);
  const [custom, setCustom] = useState(value !== null && !isPreset ? String(value) : '');

  useEffect(() => {
    if (value !== null && presets.includes(value)) setCustom('');
  }, [value, presets]);

  const outOfRange =
    custom !== '' &&
    ((min !== undefined && Number(custom) < min) || (max !== undefined && Number(custom) > max));

  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div
        className={cn(
          'grid gap-2.5',
          presets.length === 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3',
        )}
      >
        {presets.map((amount) => {
          const active = value === amount;
          return (
            <button
              key={amount}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(amount)}
              className={cn(
                'workbook-press flex flex-col items-start rounded-[var(--ui-radius)] border text-left shadow-[var(--ui-shadow-xs)]',
                size === 'lg' ? 'gap-1 px-5 py-5' : 'gap-0.5 px-4 py-3',
                active
                  ? 'border-brand bg-brand-tint ring-[3px] ring-brand/20'
                  : 'border-border bg-surface-white hover:border-border-strong hover:bg-paper-bg',
              )}
            >
              <span
                className={cn(
                  'font-display font-semibold tabular text-ink-fg',
                  size === 'lg' ? 'text-3xl' : 'text-xl',
                )}
              >
                {formatNumber(amount)}
                <span
                  className={cn(
                    'ml-1 font-sans font-medium text-ink-muted',
                    size === 'lg' ? 'text-base' : 'text-sm',
                  )}
                >
                  xu
                </span>
              </span>
              <span className={cn('tabular text-ink-muted', size === 'lg' ? 'text-sm' : 'text-xs')}>
                {creditsToVnd(amount)}
              </span>
            </button>
          );
        })}
      </div>
      {allowCustom && (
        <div className="flex flex-col gap-1.5">
          <label className="text-[0.8125rem] font-medium text-ink-fg" htmlFor="amount-custom">
            Hoặc nhập số khác
          </label>
          <div className="relative">
            <input
              id="amount-custom"
              inputMode="numeric"
              value={custom}
              aria-invalid={outOfRange || undefined}
              placeholder={
                min !== undefined && max !== undefined
                  ? `${formatNumber(min)} – ${formatNumber(max)}`
                  : ''
              }
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
                setCustom(digits);
                onChange(digits ? Number(digits) : null);
              }}
              className="workbook-input h-11 pr-28 text-base tabular"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted tabular">
              {custom ? `xu · ${creditsToVnd(Number(custom))}` : 'xu'}
            </span>
          </div>
          {outOfRange && (
            <p className="text-[0.8125rem] text-danger">
              Số xu phải từ {formatNumber(min ?? 0)} đến {formatNumber(max ?? 0)}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
