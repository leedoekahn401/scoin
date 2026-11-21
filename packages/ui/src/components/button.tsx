'use client';

import { Loader2 } from 'lucide-react';
import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

import { cn } from '../lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'ink' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl';

const VARIANT: Record<ButtonVariant, string> = {
  // Gold carries ink, never white (DESIGN §1 Color).
  primary:
    'bg-brand text-ink-fg border-transparent shadow-[var(--ui-shadow-xs)] hover:bg-brand-strong hover:shadow-[var(--ui-shadow-md)] disabled:hover:bg-brand disabled:hover:shadow-[var(--ui-shadow-xs)]',
  secondary:
    'bg-surface-white text-ink-fg border-border-strong shadow-[var(--ui-shadow-xs)] hover:bg-paper-bg disabled:hover:bg-surface-white',
  ghost: 'bg-transparent text-ink-muted border-transparent hover:bg-paper-bg hover:text-ink-fg',
  ink: 'bg-ink-fg text-surface-white border-transparent shadow-[var(--ui-shadow-xs)] hover:bg-ink-fg/90',
  danger:
    'bg-surface-white text-danger border-border-strong shadow-[var(--ui-shadow-xs)] hover:bg-danger-tint hover:border-danger/40',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-2.5 text-[0.8125rem] rounded-[var(--ui-radius-sm)] [&_svg]:size-3.5',
  md: 'h-9 gap-2 px-3.5 text-sm rounded-[var(--ui-radius-sm)] [&_svg]:size-4',
  // Touch sizes for POS / kiosk: ≥ 48 px (NFR-USE-03).
  lg: 'h-12 gap-2 px-5 text-base rounded-[var(--ui-radius)] [&_svg]:size-5',
  xl: 'h-16 gap-3 px-7 text-lg rounded-[var(--ui-radius)] [&_svg]:size-6',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  fullWidth?: boolean;
}

/** Class string for anything that should look like a Button (see LinkButton). */
export function buttonClasses(
  variant: ButtonVariant = 'secondary',
  size: ButtonSize = 'md',
  fullWidth?: boolean,
) {
  return cn(
    'workbook-press inline-flex shrink-0 select-none items-center justify-center whitespace-nowrap border font-semibold leading-none outline-none',
    'focus-visible:ring-[3px] focus-visible:ring-brand/30 disabled:cursor-default disabled:opacity-50',
    VARIANT[variant],
    SIZE[size],
    fullWidth && 'w-full',
  );
}

/**
 * The only button. One gold `primary` per region; everything else is
 * `secondary` or `ghost`. Hover/press change colour and shadow only.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'secondary',
    size = 'md',
    loading = false,
    leadingIcon,
    trailingIcon,
    fullWidth,
    className,
    children,
    disabled,
    type = 'button',
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(buttonClasses(variant, size, fullWidth), className)}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden /> : leadingIcon}
      {children}
      {!loading && trailingIcon}
    </button>
  );
});

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required: icon-only buttons need an accessible name. */
  label: string;
  variant?: 'ghost' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
}

const ICON_SIZE = {
  sm: 'h-8 w-8 [&_svg]:size-4',
  md: 'h-9 w-9 [&_svg]:size-[1.125rem]',
  lg: 'h-12 w-12 [&_svg]:size-5',
};

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { label, variant = 'ghost', size = 'md', className, type = 'button', ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-label={label}
      className={cn(
        'workbook-press inline-flex shrink-0 items-center justify-center rounded-[var(--ui-radius-sm)] border text-ink-muted outline-none hover:text-ink-fg',
        'focus-visible:ring-[3px] focus-visible:ring-brand/30 disabled:opacity-50',
        variant === 'ghost'
          ? 'border-transparent hover:bg-paper-bg'
          : 'border-border bg-surface-white shadow-[var(--ui-shadow-xs)] hover:bg-paper-bg',
        ICON_SIZE[size],
        className,
      )}
      {...props}
    />
  );
});
