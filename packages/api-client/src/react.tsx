'use client';

import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import type { Me, Role } from '@schoolcoin/types';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import type { SchoolCoinApi } from './contract';
import { isApiError } from './errors';
import { apiConfigFromEnv, createApi, type ApiConfig } from './index';

/* ───────────────────────────── API context ───────────────────────────── */

const ApiContext = createContext<SchoolCoinApi | null>(null);

/** The one way a component reaches the backend. */
export function useApi(): SchoolCoinApi {
  const api = useContext(ApiContext);
  if (!api) throw new Error('useApi() must be used inside <SchoolCoinProvider>');
  return api;
}

/* ───────────────────────────── Session ───────────────────────────── */

export type SessionStatus = 'loading' | 'authenticated' | 'anonymous';

export interface SessionValue {
  status: SessionStatus;
  user: Me | null;
  /** Signs in and verifies the role is allowed in this app. */
  signIn: (identifier: string, password: string) => Promise<Me>;
  signOut: () => Promise<void>;
  /** Re-read /me (after profile edits). */
  refresh: () => Promise<void>;
  /** Replace the user after register-parent. */
  setUser: (user: Me) => void;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const session = useContext(SessionContext);
  if (!session) throw new Error('useSession() must be used inside <SchoolCoinProvider>');
  return session;
}

class WrongAppError extends Error {
  constructor() {
    super('WRONG_APP');
    this.name = 'WrongAppError';
  }
}

export function isWrongAppError(error: unknown): boolean {
  return error instanceof WrongAppError;
}

function SessionProvider({
  allowedRoles,
  children,
}: {
  allowedRoles: readonly Role[] | null;
  children: ReactNode;
}) {
  const api = useApi();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<SessionStatus>('loading');
  const [user, setUserState] = useState<Me | null>(null);

  const setUser = useCallback((next: Me) => {
    setUserState(next);
    setStatus('authenticated');
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (allowedRoles === null || !api.auth.hasSession()) {
      setStatus('anonymous');
      return;
    }
    api.auth
      .me()
      .then((me) => {
        if (cancelled) return;
        if (!allowedRoles.includes(me.role)) {
          setStatus('anonymous');
          return;
        }
        setUser(me);
      })
      .catch(() => {
        if (!cancelled) setStatus('anonymous');
      });
    return () => {
      cancelled = true;
    };
  }, [api, allowedRoles, setUser]);

  const signIn = useCallback(
    async (identifier: string, password: string) => {
      const result = await api.auth.login({ identifier, password });
      if (allowedRoles && !allowedRoles.includes(result.user.role)) {
        await api.auth.logout().catch(() => undefined);
        throw new WrongAppError();
      }
      queryClient.clear();
      setUser(result.user);
      return result.user;
    },
    [api, allowedRoles, queryClient, setUser],
  );

  const signOut = useCallback(async () => {
    await api.auth.logout().catch(() => undefined);
    queryClient.clear();
    setUserState(null);
    setStatus('anonymous');
  }, [api, queryClient]);

  const refresh = useCallback(async () => {
    const me = await api.auth.me();
    setUser(me);
  }, [api, setUser]);

  const value = useMemo<SessionValue>(
    () => ({ status, user, signIn, signOut, refresh, setUser }),
    [status, user, signIn, signOut, refresh, setUser],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

/* ───────────────────────────── Provider ───────────────────────────── */

function makeQueryClient(onUnauthorized: () => void) {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 15_000,
        refetchOnWindowFocus: true,
        retry: (count, error) => {
          if (isApiError(error)) {
            if (error.code === 'UNAUTHENTICATED') onUnauthorized();
            if (error.status > 0 && error.status < 500) return false;
          }
          return count < 2;
        },
      },
      mutations: { retry: false },
    },
  });
}

/**
 * Wrap each app's root layout in this. `allowedRoles` is the set of roles
 * that may sign in to that app (null = no staff session, e.g. the kiosk).
 */
export function SchoolCoinProvider({
  allowedRoles,
  config,
  children,
}: {
  allowedRoles: readonly Role[] | null;
  config?: Partial<ApiConfig>;
  children: ReactNode;
}) {
  const [api] = useState(() => createApi(apiConfigFromEnv(config)));
  const [queryClient] = useState(() =>
    makeQueryClient(() => {
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('schoolcoin:unauthorized'));
    }),
  );

  return (
    <ApiContext.Provider value={api}>
      <QueryClientProvider client={queryClient}>
        <SessionProvider allowedRoles={allowedRoles}>{children}</SessionProvider>
      </QueryClientProvider>
    </ApiContext.Provider>
  );
}
