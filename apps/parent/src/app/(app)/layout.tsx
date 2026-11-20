'use client';

import { useApi, useSession } from '@schoolcoin/api-client/react';
import { Avatar, BrandMark, CountBadge, RequireSession, cn } from '@schoolcoin/ui';
import { useQuery } from '@tanstack/react-query';
import { Bell, Home, MessageCircleHeart, UserRound } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { queryKeys } from '@/lib/query-keys';

/**
 * Parent PWA frame (works from 360 px, NFR-USE-04): a white top bar with the
 * brand and the notification bell, a narrow reading column, and a compact
 * bottom navigation on phones that becomes inline links on wider screens.
 */
function ParentShell({ children }: { children: ReactNode }) {
  const api = useApi();
  const { user } = useSession();
  const pathname = usePathname();

  const notifications = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: () => api.notifications.list(),
    refetchInterval: 15_000,
  });
  const requests = useQuery({
    queryKey: queryKeys.requests('PENDING'),
    queryFn: () => api.parent.listRequests({ status: 'PENDING' }),
    refetchInterval: 15_000,
  });

  const unread = notifications.data?.unreadCount ?? 0;
  const pending = requests.data?.length ?? 0;

  const nav = [
    { href: '/', label: 'Con', icon: <Home />, exact: true },
    { href: '/requests', label: 'Yêu cầu', icon: <MessageCircleHeart />, count: pending },
    { href: '/notifications', label: 'Thông báo', icon: <Bell />, count: unread },
    { href: '/account', label: 'Tài khoản', icon: <UserRound /> },
  ];
  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href || pathname.startsWith('/children') || pathname.startsWith('/topup')
      : pathname.startsWith(href);

  return (
    <div className="min-h-dvh bg-paper-bg pb-20 sm:pb-0">
      <header className="sticky top-0 z-30 border-b border-border bg-surface-white/95">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-4 px-4">
          <Link href="/" aria-label="Trang chủ">
            <BrandMark />
          </Link>
          <nav className="ml-6 hidden items-center gap-1 sm:flex">
            {nav.slice(0, 3).map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'workbook-press flex h-9 items-center gap-2 rounded-[var(--ui-radius-sm)] px-3 text-sm font-medium',
                  isActive(item.href, item.exact)
                    ? 'bg-brand-tint text-ink-fg'
                    : 'text-ink-muted hover:bg-paper-bg hover:text-ink-fg',
                )}
              >
                {item.label === 'Con' ? 'Các con' : item.label}
                <CountBadge count={item.count ?? 0} />
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1">
            <Link
              href="/notifications"
              aria-label={`Thông báo${unread ? `, ${unread} chưa đọc` : ''}`}
              className="workbook-press relative flex size-10 items-center justify-center rounded-[var(--ui-radius-sm)] text-ink-fg hover:bg-paper-bg sm:hidden"
            >
              <Bell className="size-5" />
              {unread > 0 && (
                <span className="absolute right-2 top-2 size-2 rounded-full bg-danger ring-2 ring-surface-white" />
              )}
            </Link>
            <Link
              href="/account"
              aria-label="Tài khoản"
              className="workbook-press hidden rounded-full sm:block"
            >
              <Avatar name={user?.fullName ?? ''} size="sm" />
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-5 sm:py-8">{children}</main>

      {/* Phone navigation */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface-white pb-[env(safe-area-inset-bottom)] sm:hidden">
        <div className="grid grid-cols-4">
          {nav.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'workbook-press relative flex h-16 flex-col items-center justify-center gap-1 text-[0.6875rem] font-medium [&_svg]:size-[1.375rem]',
                  active ? 'text-ink-fg [&_svg]:text-brand-deep' : 'text-ink-muted',
                )}
              >
                {item.icon}
                {item.label}
                {(item.count ?? 0) > 0 && (
                  <CountBadge count={item.count!} className="absolute left-1/2 top-2 ml-2" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <RequireSession>
      <ParentShell>{children}</ParentShell>
    </RequireSession>
  );
}
