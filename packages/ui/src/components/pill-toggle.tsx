'use client';

import { motion, useReducedMotion } from 'framer-motion';
import type { ReactNode } from 'react';

import { cn } from '../lib/cn';

export interface PillOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Small count after the label (e.g. pending requests). */
  count?: number;
}

/**
 * Single-select pill toggle (ronansat PillToggleGroup): white shell, hairline,
 * active option is a sliding `brand-tint` plate with a gold hairline.
 * `layoutIdPrefix` must be unique per mounted group.
 */
export function PillToggle<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  layoutIdPrefix,
  size = 'md',
  className,
}: {
  options: readonly PillOption<T>[];
  value: T;
  onChange: (next: T) => void;
  ariaLabel: string;
  layoutIdPrefix: string;
  size?: 'md' | 'lg';
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'no-scrollbar inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-[var(--ui-radius)] border border-border bg-surface-white p-1',
        className,
      )}
    >
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cn(
              'workbook-press relative isolate inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--ui-radius-sm)] font-semibold',
              size === 'lg' ? 'h-10 px-4 text-sm' : 'h-7 px-3 text-xs',
              active ? 'text-ink-fg' : 'text-ink-muted hover:text-ink-fg',
            )}
          >
            {active && (
              <motion.span
                layoutId={`${layoutIdPrefix}-pill`}
                transition={reduce ? { duration: 0 } : { duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 -z-10 rounded-[var(--ui-radius-sm)] border border-brand bg-brand-tint"
              />
            )}
            {option.label}
            {option.count !== undefined && option.count > 0 && (
              <span className="tabular rounded-full bg-ink-fg/8 px-1.5 text-[0.6875rem] text-ink-muted">
                {option.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/** Underline tabs for page sections: gold text + gold underline when active. */
export function Tabs<T extends string>({
  tabs,
  value,
  onChange,
  className,
}: {
  tabs: readonly { value: T; label: ReactNode; count?: number }[];
  value: T;
  onChange: (next: T) => void;
  className?: string;
}) {
  return (
    <div
      role="tablist"
      className={cn('no-scrollbar flex gap-5 overflow-x-auto border-b border-border', className)}
    >
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(tab.value)}
            className={cn(
              'workbook-press -mb-px inline-flex shrink-0 items-center gap-1.5 border-b-2 pb-2.5 pt-1 text-sm font-medium',
              active
                ? 'border-brand-strong text-ink-fg'
                : 'border-transparent text-ink-muted hover:text-ink-fg',
            )}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="tabular rounded-full bg-paper-bg px-1.5 text-[0.6875rem] text-ink-muted ring-1 ring-border">
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
