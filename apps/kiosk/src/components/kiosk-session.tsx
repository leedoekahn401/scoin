'use client';

import { isApiError } from '@schoolcoin/api-client';
import { useApi } from '@schoolcoin/api-client/react';
import { KIOSK_IDLE_SECONDS } from '@schoolcoin/types';
import { useIdleTimer } from '@schoolcoin/ui';
import { useQueryClient } from '@tanstack/react-query';
import { createContext, useCallback, useContext, useEffect, type ReactNode } from 'react';

/**
 * One sign-out path for the whole kiosk (FR-KIO-05, NFR-PRV-03): end the
 * server session, drop every cached query about the student, return to idle.
 */
const SignOutContext = createContext<(() => Promise<void>) | null>(null);

export function KioskSessionProvider({
  onSignedOut,
  children,
}: {
  onSignedOut: () => void;
  children: ReactNode;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const signOut = useCallback(async () => {
    await api.kiosk.signOut().catch(() => undefined);
    queryClient.removeQueries({ queryKey: ['kiosk'] });
    onSignedOut();
  }, [api, queryClient, onSignedOut]);
  return <SignOutContext.Provider value={signOut}>{children}</SignOutContext.Provider>;
}

export function useKioskSignOut() {
  const signOut = useContext(SignOutContext);
  if (!signOut) throw new Error('useKioskSignOut outside KioskSessionProvider');
  return signOut;
}

/** Sign out when a query reports the session expired (401). */
export function useSignOutOnUnauthorized(error: unknown) {
  const signOut = useKioskSignOut();
  useEffect(() => {
    if (isApiError(error, 'UNAUTHENTICATED')) void signOut();
  }, [error, signOut]);
}

/** Idle auto sign-out with the last-10-seconds warning bar. Render it once per signed-in screen. */
export function IdleSignOut() {
  const signOut = useKioskSignOut();
  const left = useIdleTimer(KIOSK_IDLE_SECONDS, () => void signOut());
  if (left > 10) return null;
  return (
    <div className="fade-in fixed inset-x-0 bottom-0 z-20 border-t border-warning/30 bg-warning-tint px-6 py-4 text-center text-lg font-medium text-ink-fg">
      Tự động đăng xuất sau <span className="tabular">{left}</span> giây — chạm vào màn hình để tiếp
      tục
    </div>
  );
}
