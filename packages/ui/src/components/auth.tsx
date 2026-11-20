'use client';

import { ChevronRight } from 'lucide-react';
import type { ReactNode } from 'react';

import { ROLE_LABEL } from '../lib/labels';
import { cn } from '../lib/cn';
import { BrandMark } from './brand';

/**
 * Sign-in / register frame shared by every app: brand on top, one white card,
 * a muted footer line. Calm, centred, no hero art.
 */
export function AuthLayout({
  product,
  title,
  description,
  children,
  footer,
  aside,
}: {
  product: string;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Optional panel under the card (demo accounts). */
  aside?: ReactNode;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-paper-bg px-4 py-10">
      <div className="w-full max-w-[25rem]">
        <div className="mb-8 flex justify-center">
          <BrandMark product={product} size="lg" />
        </div>
        <div className="workbook-panel px-6 py-7 sm:px-8">
          <h1 className="font-display text-xl font-semibold tracking-tight text-ink-fg">{title}</h1>
          {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
          <div className="mt-6">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-ink-muted">{footer}</div>}
        {aside && <div className="mt-6">{aside}</div>}
      </div>
    </div>
  );
}

export interface DemoAccountOption {
  role: keyof typeof ROLE_LABEL;
  label: string;
  identifier: string;
  password: string;
}

/**
 * One-click demo sign-in list, shown only when demo tools are on. Keeps the
 * MVP walkable without anyone typing credentials.
 */
export function DemoAccounts({
  accounts,
  onPick,
  className,
}: {
  accounts: DemoAccountOption[];
  onPick: (account: DemoAccountOption) => void;
  className?: string;
}) {
  if (!accounts.length) return null;
  return (
    <div className={cn('workbook-panel-muted p-2', className)}>
      <p className="px-2.5 pb-1.5 pt-1 text-xs font-medium text-ink-muted">
        Tài khoản demo · mật khẩu demo1234
      </p>
      <ul className="flex flex-col">
        {accounts.map((a) => (
          <li key={a.identifier}>
            <button
              type="button"
              onClick={() => onPick(a)}
              className="workbook-press flex w-full items-center gap-3 rounded-[var(--ui-radius-sm)] px-2.5 py-2 text-left hover:bg-surface-white"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-ink-fg">{a.label}</span>
                <span className="block truncate font-mono text-xs text-ink-muted">
                  {a.identifier}
                </span>
              </span>
              <span className="shrink-0 text-xs text-ink-muted">{ROLE_LABEL[a.role]}</span>
              <ChevronRight className="size-4 shrink-0 text-ink-faint" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
