/** TanStack Query keys for the parent app. Always use these, never inline arrays. */
export const queryKeys = {
  children: ['parent', 'children'] as const,
  child: (id: string) => ['parent', 'child', id] as const,
  transactions: (id: string, params: object = {}) =>
    ['parent', 'child', id, 'transactions', params] as const,
  topUps: ['parent', 'topups'] as const,
  topUp: (id: string) => ['parent', 'topup', id] as const,
  requestsAll: ['parent', 'requests'] as const,
  requests: (status?: string) => ['parent', 'requests', status ?? 'all'] as const,
  notifications: ['notifications'] as const,
  publicSettings: ['settings', 'public'] as const,
};
