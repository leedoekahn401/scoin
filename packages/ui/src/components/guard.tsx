'use client';

import { useSession } from '@schoolcoin/api-client/react';
import type { Role } from '@schoolcoin/types';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { CoinMark } from './brand';

/** Full-screen boot state: the coin mark alone, softly pulsing. */
export function Splash() {
  return (
    <div
      className="flex min-h-dvh items-center justify-center bg-paper-bg"
      role="status"
      aria-label="Đang tải"
    >
      <CoinMark className="size-10 animate-pulse" />
    </div>
  );
}

/**
 * Client-side route guard. Shows the splash while /me resolves, redirects to
 * `loginPath` when signed out, and optionally narrows to specific roles.
 * (The server still enforces every permission — NFR-SEC-04.)
 */
export function RequireSession({
  children,
  loginPath = '/login',
  roles,
  fallback,
}: {
  children: ReactNode;
  loginPath?: string;
  roles?: readonly Role[];
  fallback?: ReactNode;
}) {
  const { status, user } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'anonymous') {
      const next = pathname && pathname !== '/' ? `?next=${encodeURIComponent(pathname)}` : '';
      router.replace(`${loginPath}${next}`);
    }
  }, [status, router, loginPath, pathname]);

  useEffect(() => {
    const onUnauthorized = () => router.replace(loginPath);
    window.addEventListener('schoolcoin:unauthorized', onUnauthorized);
    return () => window.removeEventListener('schoolcoin:unauthorized', onUnauthorized);
  }, [router, loginPath]);

  if (status !== 'authenticated' || !user) return <Splash />;
  if (roles && !roles.includes(user.role)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}

/** Inverse guard for /login: bounce signed-in users to `home`. */
export function RedirectIfSignedIn({
  home = '/',
  children,
}: {
  home?: string;
  children: ReactNode;
}) {
  const { status } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (status === 'authenticated') {
      const next = new URLSearchParams(window.location.search).get('next');
      router.replace(next && next.startsWith('/') ? next : home);
    }
  }, [status, router, home]);
  if (status === 'loading' || status === 'authenticated') return <Splash />;
  return <>{children}</>;
}
