'use client';

import { LogOut, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { cn } from '../lib/cn';
import { Avatar } from './avatar';
import { BrandMark } from './brand';

export interface NavItem {
  href: string;
  label: string;
  icon: ReactNode;
  /** Small count on the right (unmatched payments, pending reviews). */
  badge?: number;
  /** Match child routes too (default true; set false for "/"). */
  matchPrefix?: boolean;
}

export interface NavGroup {
  heading?: string;
  items: NavItem[];
}

function isActive(pathname: string, item: NavItem) {
  if (item.matchPrefix === false || item.href === '/') return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function NavLinks({ groups, onNavigate }: { groups: NavGroup[]; onNavigate?: () => void }) {
  const pathname = usePathname() ?? '/';
  return (
    <nav className="flex flex-col gap-5">
      {groups.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.heading && (
            <p className="px-2.5 pb-1.5 text-xs font-medium text-ink-muted">{group.heading}</p>
          )}
          {group.items.map((item) => {
            const active = isActive(pathname, item);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'workbook-press flex h-9 items-center gap-2.5 rounded-[var(--ui-radius-sm)] px-2.5 text-sm',
                  '[&_svg]:size-[1.125rem] [&_svg]:shrink-0',
                  active
                    ? 'bg-brand-tint font-semibold text-ink-fg [&_svg]:text-brand-deep'
                    : 'text-ink-muted hover:bg-paper-bg hover:text-ink-fg',
                )}
              >
                {item.icon}
                <span className="min-w-0 flex-1 truncate">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="tabular rounded-full bg-warning-tint px-1.5 py-0.5 text-[0.6875rem] font-semibold leading-none text-warning-ink ring-1 ring-warning/30">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}

/**
 * Desktop app frame with a left rail (DESIGN §3 Sidebar): identity on top,
 * grouped sections in the middle, the signed-in user + sign out pinned at the
 * bottom. Below `lg` the rail becomes a slide-over opened from a top bar.
 */
export function AppShell({
  product,
  groups,
  user,
  onSignOut,
  topRight,
  children,
}: {
  product: string;
  groups: NavGroup[];
  user: { name: string; caption: string };
  onSignOut: () => void;
  topRight?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]);

  const rail = (
    <div className="flex h-full flex-col">
      <div className="flex h-[var(--app-bar-h)] shrink-0 items-center border-b border-border px-4">
        <BrandMark product={product} />
      </div>
      <div className="workbook-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <NavLinks groups={groups} onNavigate={() => setOpen(false)} />
      </div>
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex items-center gap-2.5 rounded-[var(--ui-radius-sm)] px-1.5 py-1.5">
          <Avatar name={user.name} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-ink-fg">{user.name}</p>
            <p className="truncate text-xs text-ink-muted">{user.caption}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Đăng xuất"
            className="workbook-press flex size-8 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-muted hover:bg-danger-tint hover:text-danger"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-dvh bg-paper-bg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] border-r border-border bg-surface-white lg:block">
        {rail}
      </aside>

      {/* Mobile / tablet top bar */}
      <header className="sticky top-0 z-30 flex h-[var(--app-bar-h)] items-center justify-between border-b border-border bg-surface-white px-4 lg:hidden">
        <button
          type="button"
          aria-label="Mở menu"
          onClick={() => setOpen(true)}
          className="workbook-press -ml-1.5 flex size-9 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-fg hover:bg-paper-bg"
        >
          <Menu className="size-5" />
        </button>
        <BrandMark />
        <div className="flex min-w-9 justify-end">{topRight}</div>
      </header>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="workbook-modal-backdrop fade-in absolute inset-0"
            onClick={() => setOpen(false)}
          />
          <aside className="menu-pop absolute inset-y-0 left-0 w-[min(18rem,85vw)] bg-surface-white shadow-[var(--ui-shadow-lg)]">
            <button
              type="button"
              aria-label="Đóng menu"
              onClick={() => setOpen(false)}
              className="workbook-press absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-muted hover:bg-paper-bg"
            >
              <X className="size-4" />
            </button>
            {rail}
          </aside>
        </div>
      )}

      <div className="lg:pl-[var(--sidebar-w)]">
        {topRight && (
          <div className="sticky top-0 z-20 hidden h-[var(--app-bar-h)] items-center justify-end gap-2 border-b border-border bg-paper-bg/95 px-8 lg:flex">
            {topRight}
          </div>
        )}
        <main className="mx-auto w-full max-w-[90rem] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}

/** Page title row: one heading, one short muted line, actions on the right. */
export function PageHeader({
  title,
  description,
  actions,
  back,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Optional breadcrumb-style link above the title. */
  back?: { href: string; label: string };
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div className="min-w-0">
        {back && (
          <Link
            href={back.href}
            className="workbook-press mb-2 inline-flex items-center gap-1 text-[0.8125rem] text-ink-muted hover:text-ink-fg"
          >
            ← {back.label}
          </Link>
        )}
        <h1 className="font-display text-2xl font-semibold tracking-tight text-ink-fg">{title}</h1>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
