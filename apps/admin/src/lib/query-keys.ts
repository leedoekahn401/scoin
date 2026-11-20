/**
 * TanStack Query keys for the admin app, in one place so a mutation can
 * invalidate exactly what it changed. Always use these, never inline arrays.
 */
export const queryKeys = {
  dashboard: ['admin', 'dashboard'] as const,
  students: (params: object = {}) => ['admin', 'students', params] as const,
  studentsAll: ['admin', 'students'] as const,
  student: (id: string) => ['admin', 'student', id] as const,
  studentTransactions: (id: string, page: number) =>
    ['admin', 'student', id, 'transactions', page] as const,
  users: (params: object = {}) => ['admin', 'users', params] as const,
  usersAll: ['admin', 'users'] as const,
  menu: ['admin', 'menu'] as const,
  orders: ['admin', 'orders'] as const,
  sepay: (params: object = {}) => ['admin', 'sepay', params] as const,
  sepayAll: ['admin', 'sepay'] as const,
  review: ['admin', 'topups-review'] as const,
  refunds: ['admin', 'refunds'] as const,
  adjustments: ['admin', 'adjustments'] as const,
  sales: (from: string, to: string) => ['admin', 'reports', 'sales', from, to] as const,
  topups: (from: string, to: string) => ['admin', 'reports', 'topups', from, to] as const,
  balances: ['admin', 'reports', 'balances'] as const,
  reconciliation: (from: string, to: string) =>
    ['admin', 'reports', 'reconciliation', from, to] as const,
  audit: (params: object = {}) => ['admin', 'audit', params] as const,
  settings: ['admin', 'settings'] as const,
  kiosks: ['admin', 'kiosks'] as const,
};
