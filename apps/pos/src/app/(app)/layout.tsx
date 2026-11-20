'use client';

import { useSession } from '@schoolcoin/api-client/react';
import { BrandMark, ROLE_LABEL, RequireSession, cn, formatWeekdayDate } from '@schoolcoin/ui';
import { LogOut, ReceiptText, ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

/**
 * POS frame: one slim bar (brand, two big tabs, cashier, sign out) over a
 * full-height work area. Designed for a 1366×768 touchscreen at the counter.
 */
function PosShell({ children }: { children: ReactNode }) {
  const { user, signOut } = useSession();
  const pathname = usePathname();
  const tabs = [
    { href: '/', label: 'Bán hàng', icon: <ShoppingCart /> },
    { href: '/orders', label: 'Đơn hôm nay', icon: <ReceiptText /> },
  ];
  return (
    <div className="flex h-dvh flex-col bg-paper-bg">
      <header className="flex h-16 shrink-0 items-center gap-6 border-b border-border bg-surface-white px-5">
        <BrandMark product="Căng tin" />
        <nav className="flex h-full items-stretch gap-1">
          {tabs.map((tab) => {
            const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'workbook-press -mb-px flex items-center gap-2 border-b-2 px-4 text-[0.9375rem] font-semibold [&_svg]:size-5',
                  active
                    ? 'border-brand-strong text-ink-fg'
                    : 'border-transparent text-ink-muted hover:text-ink-fg',
                )}
              >
                {tab.icon}
                {tab.label}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden text-right md:block">
            <p className="text-sm font-semibold text-ink-fg">{user?.fullName}</p>
            <p className="text-xs text-ink-muted">
              {user ? ROLE_LABEL[user.role] : ''} · {formatWeekdayDate(new Date())}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="workbook-press flex h-11 items-center gap-2 rounded-[var(--ui-radius)] border border-border-strong bg-surface-white px-4 text-sm font-semibold text-ink-fg hover:bg-paper-bg"
          >
            <LogOut className="size-4" />
            Kết ca
          </button>
        </div>
      </header>
      <main className="min-h-0 flex-1">{children}</main>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <PosShell>{children}</PosShell>
    </RequireSession>
  );
}
