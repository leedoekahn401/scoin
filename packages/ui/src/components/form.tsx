'use client';

import { Search, X } from 'lucide-react';
import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

import { cn } from '../lib/cn';

/**
 * Field = label + control + one helper line OR one error line. Explain on
 * screen, never with a `title` tooltip (DESIGN §1). Pass the control as the
 * child; `Field` wires `id`, `aria-describedby` and `aria-invalid`.
 */
export function Field({
  label,
  hint,
  error,
  optional,
  className,
  children,
}: {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  optional?: boolean;
  className?: string;
  children: (props: {
    id: string;
    'aria-describedby'?: string;
    'aria-invalid'?: boolean;
  }) => ReactNode;
}) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-[0.8125rem] font-medium text-ink-fg">
        {label}
        {optional && <span className="ml-1 font-normal text-ink-muted">(không bắt buộc)</span>}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': error ? true : undefined })}
      {error ? (
        <p id={`${id}-error`} className="text-[0.8125rem] text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-[0.8125rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  /** Text or icon rendered inside the right edge, e.g. "xu". */
  suffix?: ReactNode;
  prefix?: ReactNode;
  inputSize?: 'md' | 'lg';
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, suffix, prefix, inputSize = 'md', ...props },
  ref,
) {
  const sizeClass = inputSize === 'lg' ? 'h-12 text-base' : 'h-9';
  if (!suffix && !prefix) {
    return <input ref={ref} className={cn('workbook-input', sizeClass, className)} {...props} />;
  }
  return (
    <div className="relative">
      {prefix && (
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-ink-muted [&_svg]:size-4">
          {prefix}
        </span>
      )}
      <input
        ref={ref}
        className={cn('workbook-input', sizeClass, prefix && 'pl-9', suffix && 'pr-12', className)}
        {...props}
      />
      {suffix && (
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-ink-muted">
          {suffix}
        </span>
      )}
    </div>
  );
});

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      rows={rows}
      className={cn('workbook-input resize-none py-2', className)}
      {...props}
    />
  );
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn('workbook-input h-9', className)} {...props}>
        {children}
      </select>
    );
  },
);

export function SearchInput({
  value,
  onChange,
  placeholder = 'Tìm kiếm…',
  className,
  autoFocus,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-muted" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="workbook-input h-9 pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          aria-label="Xóa tìm kiếm"
          onClick={() => onChange('')}
          className="workbook-press absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-muted hover:bg-paper-bg hover:text-ink-fg"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  description,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: ReactNode;
  description?: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label className={cn('flex items-start gap-2.5', disabled ? 'opacity-60' : 'cursor-pointer')}>
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 size-4 shrink-0 rounded accent-[var(--color-brand-strong)]"
      />
      {(label || description) && (
        <span className="flex flex-col gap-0.5">
          {label && <span className="text-sm text-ink-fg">{label}</span>}
          {description && <span className="text-[0.8125rem] text-ink-muted">{description}</span>}
        </span>
      )}
    </label>
  );
}

/** An on/off control for settings rows. Gold track when on. */
export function Switch({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'workbook-press relative inline-flex h-6 w-10 shrink-0 items-center rounded-full border outline-none focus-visible:ring-[3px] focus-visible:ring-brand/30 disabled:opacity-50',
        checked ? 'border-brand-strong bg-brand' : 'border-border-strong bg-surface-inset',
      )}
    >
      <span
        className={cn(
          'inline-block size-[1.125rem] rounded-full bg-surface-white shadow-[var(--ui-shadow)] transition-[margin] duration-150',
          checked ? 'ml-[1.125rem]' : 'ml-[0.1875rem]',
        )}
      />
    </button>
  );
}
