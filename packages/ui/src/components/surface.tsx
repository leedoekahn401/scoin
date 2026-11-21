import { Loader2 } from 'lucide-react';
import type { HTMLAttributes, ReactNode } from 'react';

import { cn } from '../lib/cn';
import { creditsToVnd, formatCredits, formatNumber } from '../lib/format';
import type { Tone } from '../lib/labels';

/* ───────────────────────────── Panel ───────────────────────────── */

/** The resting white card on the paper canvas. */
export function Panel({
  className,
  muted,
  ...props
}: HTMLAttributes<HTMLDivElement> & { muted?: boolean }) {
  return (
    <div className={cn(muted ? 'workbook-panel-muted' : 'workbook-panel', className)} {...props} />
  );
}

/** Title row inside a Panel: one heading, one optional muted line, actions right. */
export function PanelHeader({
  title,
  description,
  actions,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b border-border px-5 py-4',
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="font-display text-base font-semibold tracking-tight text-ink-fg">{title}</h2>
        {description && <p className="mt-0.5 text-[0.8125rem] text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}

/* ───────────────────────────── Badge ───────────────────────────── */

const TONE: Record<Tone, string> = {
  neutral: 'border-border bg-paper-bg text-ink-muted',
  brand: 'border-brand/40 bg-brand-tint text-brand-deep',
  success: 'border-success/25 bg-success-tint text-success',
  danger: 'border-danger/25 bg-danger-tint text-danger',
  info: 'border-info/20 bg-info-tint text-info',
  warning: 'border-warning/30 bg-warning-tint text-warning-ink',
};

/** A small hairline tag. Labels are never full pills (DESIGN §2 Tags). */
export function Badge({
  tone = 'neutral',
  dot,
  className,
  children,
}: {
  tone?: Tone;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex h-6 w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-[var(--ui-radius-sm)] border px-2 text-xs font-medium',
        TONE[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

/** Round count badge (unread notifications). */
export function CountBadge({ count, className }: { count: number; className?: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={cn(
        'inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[0.6875rem] font-semibold leading-none text-white tabular',
        className,
      )}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}

/* ───────────────────────────── Money ───────────────────────────── */

/**
 * The canonical amount display: "25 xu" with "25.000 ₫" beneath or beside.
 * `size="hero"` is the big balance on wallets, POS and kiosk.
 */
export function Money({
  credits,
  size = 'md',
  signed,
  showVnd = true,
  inline,
  className,
}: {
  credits: number;
  size?: 'sm' | 'md' | 'lg' | 'hero';
  signed?: boolean;
  showVnd?: boolean;
  inline?: boolean;
  className?: string;
}) {
  const tone = signed ? (credits > 0 ? 'text-success' : credits < 0 ? 'text-ink-fg' : '') : '';
  if (size === 'hero' || size === 'lg') {
    return (
      <div className={cn('flex flex-col', className)}>
        <span
          className={cn(
            'font-display font-semibold tracking-tight tabular text-ink-fg',
            size === 'hero' ? 'text-5xl leading-none' : 'text-3xl leading-tight',
            tone,
          )}
        >
          {signed && credits > 0 ? '+' : ''}
          {formatNumber(credits)}
          <span
            className={cn(
              'ml-1.5 font-sans font-medium text-ink-muted',
              size === 'hero' ? 'text-2xl' : 'text-lg',
            )}
          >
            xu
          </span>
        </span>
        {showVnd && (
          <span
            className={cn(
              'tabular text-ink-muted',
              size === 'hero' ? 'mt-2 text-base' : 'mt-0.5 text-sm',
            )}
          >
            {creditsToVnd(Math.abs(credits))}
          </span>
        )}
      </div>
    );
  }
  return (
    <span className={cn('tabular', inline ? 'inline' : 'inline-flex flex-col', className)}>
      <span className={cn('font-semibold', size === 'sm' ? 'text-[0.8125rem]' : 'text-sm', tone)}>
        {formatCredits(credits, { signed })}
      </span>
      {showVnd && (
        <span className={cn('text-ink-muted', inline ? 'ml-1 text-xs' : 'text-xs')}>
          {inline ? `(${creditsToVnd(Math.abs(credits))})` : creditsToVnd(Math.abs(credits))}
        </span>
      )}
    </span>
  );
}

/* ───────────────────────────── Stat ───────────────────────────── */

export function Stat({
  label,
  value,
  sub,
  icon,
  emphasis,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  sub?: ReactNode;
  icon?: ReactNode;
  /** The one highlighted stat in a row gets a gold tint. */
  emphasis?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'workbook-panel flex flex-col gap-2 p-4',
        emphasis && 'border-brand/50 bg-brand-tint',
        className,
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[0.8125rem] font-medium text-ink-muted">{label}</span>
        {icon && <span className="text-ink-muted [&_svg]:size-4">{icon}</span>}
      </div>
      <div className="font-display text-2xl font-semibold tracking-tight tabular text-ink-fg">
        {value}
      </div>
      {sub && <div className="text-[0.8125rem] text-ink-muted">{sub}</div>}
    </div>
  );
}

/* ───────────────────────── KeyValue list ───────────────────────── */

export function KeyValue({
  items,
  className,
}: {
  items: { label: ReactNode; value: ReactNode }[];
  className?: string;
}) {
  return (
    <dl className={cn('divide-y divide-border', className)}>
      {items.map((item, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2.5 text-sm">
          <dt className="text-ink-muted">{item.label}</dt>
          <dd className="text-right font-medium text-ink-fg">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/* ───────────────────────── Loading & empty ───────────────────────── */

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton h-4', className)} aria-hidden />;
}

export function Spinner({ className, label = 'Đang tải' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      className={cn('inline-flex items-center gap-2 text-sm text-ink-muted', className)}
    >
      <Loader2 className="size-4 animate-spin" aria-hidden />
      <span className="sr-only">{label}</span>
    </span>
  );
}

/** Centred loading block for a page or panel body. */
export function LoadingBlock({ className }: { className?: string }) {
  return (
    <div className={cn('flex min-h-40 items-center justify-center', className)}>
      <Spinner />
    </div>
  );
}

/**
 * An empty or error state says WHAT it is in one line, and offers the way
 * out as an action. No illustrations, no marketing copy.
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className,
      )}
    >
      {icon && (
        <div className="mb-1 flex size-10 items-center justify-center rounded-full border border-border bg-paper-bg text-ink-muted [&_svg]:size-5">
          {icon}
        </div>
      )}
      <p className="text-sm font-medium text-ink-fg">{title}</p>
      {description && <p className="max-w-sm text-[0.8125rem] text-ink-muted">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

/** Inline notice band (info/warning/danger/success) for page-level messages. */
export function Notice({
  tone = 'info',
  title,
  children,
  action,
  className,
}: {
  tone?: Exclude<Tone, 'neutral' | 'brand'> | 'brand';
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const tones: Record<string, string> = {
    info: 'border-info/20 bg-info-tint',
    warning: 'border-warning/30 bg-warning-tint',
    danger: 'border-danger/25 bg-danger-tint',
    success: 'border-success/25 bg-success-tint',
    brand: 'border-brand/40 bg-brand-tint',
  };
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn(
        'flex items-start justify-between gap-3 rounded-[var(--ui-radius)] border px-4 py-3 text-sm',
        tones[tone],
        className,
      )}
    >
      <div className="min-w-0">
        {title && <p className="font-semibold text-ink-fg">{title}</p>}
        {children && <div className={cn('text-ink-fg/80', title && 'mt-0.5')}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function Divider({ className }: { className?: string }) {
  return <hr className={cn('border-0 border-t border-border', className)} />;
}

/** Keyboard key hint, e.g. <Kbd>Enter</Kbd>. */
export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 items-center rounded-[0.3rem] border border-border-strong bg-surface-white px-1.5 font-mono text-[0.6875rem] text-ink-muted shadow-[var(--ui-shadow-xs)]">
      {children}
    </kbd>
  );
}
