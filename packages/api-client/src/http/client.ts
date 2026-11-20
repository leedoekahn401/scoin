import { ErrorCode, TopUpStatus, type ApiErrorBody, type TopUpEvent } from '@schoolcoin/types';

import type { SchoolCoinApi } from '../contract';
import { ApiError } from '../errors';
import { TokenStore } from '../tokens';

type Query = Record<string, string | number | boolean | undefined | null | string[]>;

interface RequestOptions {
  query?: Query;
  body?: unknown;
  /** Send X-Kiosk-Key / X-Kiosk-Session instead of the bearer token. */
  kiosk?: boolean;
  /** Return the raw text body (CSV export). */
  text?: boolean;
  /** Internal: do not attempt a refresh on 401. */
  noRefresh?: boolean;
}

export interface HttpApiOptions {
  /** e.g. http://localhost:4000/api/v1 */
  baseUrl: string;
  /** The registered device key for the kiosk app (FR-KIO-06). */
  kioskKey?: string;
}

function buildQuery(query?: Query): string {
  if (!query) return '';
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, Array.isArray(value) ? value.join(',') : String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : '';
}

/**
 * `SchoolCoinApi` over fetch, matching SRS §B7. Point `baseUrl` at the NestJS
 * API (or the bundled mock server on :4000) and every screen works unchanged.
 */
export function createHttpApi({ baseUrl, kioskKey }: HttpApiOptions): SchoolCoinApi {
  const tokens = new TokenStore();
  const root = baseUrl.replace(/\/$/, '');

  async function refresh(): Promise<boolean> {
    try {
      const res = await fetch(`${root}/auth/refresh`, { method: 'POST', credentials: 'include' });
      if (!res.ok) return false;
      const data = (await res.json()) as { accessToken?: string };
      if (!data.accessToken) return false;
      tokens.setAccess(data.accessToken);
      return true;
    } catch {
      return false;
    }
  }

  async function request<T>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const headers: Record<string, string> = {
      Accept: options.text ? 'text/csv' : 'application/json',
    };
    if (options.body !== undefined) headers['Content-Type'] = 'application/json';
    if (options.kiosk) {
      if (kioskKey) headers['X-Kiosk-Key'] = kioskKey;
      if (tokens.kiosk) headers['X-Kiosk-Session'] = tokens.kiosk;
    } else if (tokens.access) {
      headers.Authorization = `Bearer ${tokens.access}`;
    }

    let res: Response;
    try {
      res = await fetch(`${root}${path}${buildQuery(options.query)}`, {
        method,
        headers,
        credentials: 'include',
        body: options.body === undefined ? undefined : JSON.stringify(options.body),
      });
    } catch {
      throw new ApiError(ErrorCode.NETWORK_ERROR, 'Network unreachable', 0);
    }

    if (res.status === 401 && !options.kiosk && !options.noRefresh && path !== '/auth/login') {
      if (await refresh()) return request<T>(method, path, { ...options, noRefresh: true });
      tokens.clearAccess();
    }

    if (!res.ok) {
      let body: ApiErrorBody | null = null;
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        // Non-JSON error page (proxy, crash): fall through to a generic code.
      }
      const code =
        body?.error?.code ??
        (res.status === 401
          ? ErrorCode.UNAUTHENTICATED
          : res.status === 403
            ? ErrorCode.FORBIDDEN
            : res.status === 404
              ? ErrorCode.NOT_FOUND
              : ErrorCode.INTERNAL_ERROR);
      throw new ApiError(
        code,
        body?.error?.message ?? res.statusText,
        res.status,
        body?.error?.details as Record<string, unknown> | undefined,
      );
    }

    if (options.text) return (await res.text()) as T;
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  const get = <T>(path: string, query?: Query, kiosk = false) =>
    request<T>('GET', path, { query, kiosk });
  const post = <T>(path: string, body?: unknown, kiosk = false) =>
    request<T>('POST', path, { body: body ?? {}, kiosk });
  const patch = <T>(path: string, body: unknown) => request<T>('PATCH', path, { body });
  const put = <T>(path: string, body: unknown) => request<T>('PUT', path, { body });
  const del = <T>(path: string, kiosk = false) => request<T>('DELETE', path, { kiosk });
  const enc = encodeURIComponent;

  /**
   * SSE over fetch so the Authorization header can be sent (EventSource
   * cannot). Falls back to polling GET /parent/topups/:id every 3 s if the
   * stream is unavailable, so FR-TOP-05 holds either way.
   */
  function subscribeTopUp(id: string, onEvent: (event: TopUpEvent) => void) {
    const controller = new AbortController();
    let finished = false;
    let pollTimer: ReturnType<typeof setInterval> | null = null;
    const finish = (event: TopUpEvent) => {
      if (finished) return;
      finished = true;
      controller.abort();
      if (pollTimer) clearInterval(pollTimer);
      onEvent(event);
    };

    const poll = () => {
      if (pollTimer || finished) return;
      pollTimer = setInterval(async () => {
        try {
          const t = await get<{ status: string; amountCredits: number }>(
            `/parent/topups/${enc(id)}`,
          );
          if (t.status === TopUpStatus.PAID)
            finish({
              type: 'PAID',
              topUpId: id,
              creditedCredits: t.amountCredits,
              balanceAfter: null,
            });
          if (t.status === TopUpStatus.EXPIRED) finish({ type: 'EXPIRED', topUpId: id });
        } catch {
          // Keep polling through transient errors.
        }
      }, 3000);
    };

    (async () => {
      try {
        const res = await fetch(`${root}/parent/topups/${enc(id)}/events`, {
          headers: {
            Accept: 'text/event-stream',
            ...(tokens.access ? { Authorization: `Bearer ${tokens.access}` } : {}),
          },
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error('no stream');
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        for (;;) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          let boundary: number;
          while ((boundary = buffer.indexOf('\n\n')) !== -1) {
            const chunk = buffer.slice(0, boundary);
            buffer = buffer.slice(boundary + 2);
            const data = chunk
              .split('\n')
              .filter((line) => line.startsWith('data:'))
              .map((line) => line.slice(5).trim())
              .join('\n');
            if (data) finish(JSON.parse(data) as TopUpEvent);
          }
        }
        if (!finished) poll();
      } catch {
        if (!finished && !controller.signal.aborted) poll();
      }
    })();

    return () => {
      finished = true;
      controller.abort();
      if (pollTimer) clearInterval(pollTimer);
    };
  }

  return {
    mode: 'http',
    publicSettings: () => get('/settings/public'),
    auth: {
      login: async (dto) => {
        const result = await request<Awaited<ReturnType<SchoolCoinApi['auth']['login']>>>(
          'POST',
          '/auth/login',
          { body: dto, noRefresh: true },
        );
        tokens.setAccess(result.accessToken);
        return result;
      },
      logout: async () => {
        try {
          await post('/auth/logout');
        } finally {
          tokens.clearAccess();
        }
      },
      me: () => get('/me'),
      updateMe: (dto) => patch('/me', dto),
      changePassword: (dto) => post('/me/password', dto),
      registerParent: async (dto) => {
        const result = await request<Awaited<ReturnType<SchoolCoinApi['auth']['login']>>>(
          'POST',
          '/auth/register-parent',
          { body: dto, noRefresh: true },
        );
        tokens.setAccess(result.accessToken);
        return result;
      },
      forgotPassword: (dto) => post('/auth/forgot-password', dto),
      resetPassword: (dto) => post('/auth/reset-password', dto),
      hasSession: () => tokens.access !== null,
    },
    parent: {
      listChildren: () => get('/parent/children'),
      linkChild: (dto) => post('/parent/children/link', dto),
      getChild: (id) => get(`/parent/children/${enc(id)}`),
      listTransactions: (id, q) => get(`/parent/children/${enc(id)}/transactions`, { ...q }),
      updateControls: (id, dto) => patch(`/parent/children/${enc(id)}/controls`, dto),
      lockCard: (id) => post(`/parent/children/${enc(id)}/card/lock`),
      createTopUp: (dto) => post('/parent/topups', dto),
      listTopUps: () => get('/parent/topups'),
      getTopUp: (id) => get(`/parent/topups/${enc(id)}`),
      subscribeTopUp,
      cancelTopUp: (id) => post(`/parent/topups/${enc(id)}/cancel`),
      listRequests: (q) => get('/parent/requests', { ...q }),
      approveRequest: (id, amountCredits) =>
        post(`/parent/requests/${enc(id)}/approve`, amountCredits ? { amountCredits } : {}),
      declineRequest: (id, dto) => post(`/parent/requests/${enc(id)}/decline`, dto),
    },
    notifications: {
      list: () => get('/notifications'),
      markRead: (id) => patch(`/notifications/${enc(id)}/read`, {}),
      markAllRead: () => post('/notifications/read-all'),
    },
    pos: {
      getMenu: () => get('/pos/menu'),
      lookup: (dto) => post('/pos/lookup', dto),
      createOrder: (dto) => post('/pos/orders', dto),
      listOrders: () => get('/pos/orders'),
      voidOrder: (id, dto) => post(`/pos/orders/${enc(id)}/void`, dto),
    },
    kiosk: {
      identify: (cardCode) => post('/kiosk/cards/identify', { cardCode }, true),
      signIn: async (dto) => {
        const session = await post<Awaited<ReturnType<SchoolCoinApi['kiosk']['signIn']>>>(
          '/kiosk/sessions',
          dto,
          true,
        );
        tokens.setKiosk(session.sessionToken);
        return session;
      },
      me: () => get('/kiosk/me', undefined, true),
      createRequest: (dto) => post('/kiosk/requests', dto, true),
      signOut: async () => {
        try {
          await del('/kiosk/sessions/current', true);
        } finally {
          tokens.clearKiosk();
        }
      },
    },
    admin: {
      listStudents: (q) => get('/admin/students', { ...q }),
      getStudent: (id) => get(`/admin/students/${enc(id)}`),
      studentTransactions: (id, q) => get(`/admin/students/${enc(id)}/transactions`, { ...q }),
      createStudent: (dto) => post('/admin/students', dto),
      updateStudent: (id, dto) => patch(`/admin/students/${enc(id)}`, dto),
      importStudents: (csv) => post('/admin/students/import', { csv }),
      issueCard: (id) => post(`/admin/students/${enc(id)}/cards`),
      lockCard: (id) => post(`/admin/cards/${enc(id)}/lock`),
      printCards: (ids) => get('/admin/cards/print', { studentIds: ids }),
      setPin: (id, pin) => put(`/admin/students/${enc(id)}/pin`, { pin }),
      createInvite: (id) => post(`/admin/students/${enc(id)}/invites`),
      unlinkParent: (sid, pid) => del(`/admin/students/${enc(sid)}/parents/${enc(pid)}`),
      listUsers: (q) => get('/admin/users', { ...q }),
      createUser: (dto) => post('/admin/users', dto),
      updateUser: (id, dto) => patch(`/admin/users/${enc(id)}`, dto),
      listMenu: () => get('/admin/menu/categories'),
      createCategory: (dto) => post('/admin/menu/categories', dto),
      updateCategory: (id, dto) => patch(`/admin/menu/categories/${enc(id)}`, dto),
      createItem: (dto) => post('/admin/menu/items', dto),
      updateItem: (id, dto) => patch(`/admin/menu/items/${enc(id)}`, dto),
      setSoldOut: (id, soldOut) =>
        soldOut
          ? post(`/admin/menu/items/${enc(id)}/sold-out`)
          : del(`/admin/menu/items/${enc(id)}/sold-out`),
      cashTopUp: (dto) => post('/admin/topups/cash', dto),
      listSepayTransactions: (q) => get('/admin/sepay-transactions', { ...q }),
      assignPayment: (id, dto) => post(`/admin/sepay-transactions/${enc(id)}/assign`, dto),
      ignorePayment: (id, dto) => post(`/admin/sepay-transactions/${enc(id)}/ignore`, dto),
      listTopUpsToReview: () => get('/admin/topups/review'),
      markTopUpReviewed: (id) => post(`/admin/topups/${enc(id)}/reviewed`),
      createRefund: (dto) => post('/admin/refunds', dto),
      listRefunds: () => get('/admin/refunds'),
      createAdjustment: (dto) => post('/admin/adjustments', dto),
      listAdjustments: () => get('/admin/adjustments'),
      dashboard: () => get('/admin/reports/dashboard'),
      salesReport: (q) => get('/admin/reports/sales', { ...q }),
      topUpReport: (q) => get('/admin/reports/topups', { ...q }),
      balancesReport: () => get('/admin/reports/balances'),
      reconciliationReport: (q) => get('/admin/reports/reconciliation', { ...q }),
      exportCsv: (kind, q) =>
        request<string>('GET', `/admin/reports/${kind}`, {
          query: { ...q, format: 'csv' },
          text: true,
        }),
      listAuditLogs: (q) => get('/admin/audit-logs', { ...q }),
      getSettings: () => get('/admin/settings'),
      updateSettings: (dto) => put('/admin/settings', dto),
      listKioskDevices: () => get('/admin/kiosk-devices'),
      createKioskDevice: (dto) => post('/admin/kiosk-devices', dto),
      revokeKioskDevice: (id) => del(`/admin/kiosk-devices/${enc(id)}`),
    },
    dev: {
      simulateTransfer: (input) => post('/dev/simulate-transfer', input),
      demoCards: () => get('/dev/demo-cards'),
      reset: () => post('/dev/reset'),
    },
  };
}
