export const ROLES = ['PARENT', 'CASHIER', 'CAFE_MANAGER', 'ACCOUNTANT', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: readonly Role[] = ['CASHIER', 'CAFE_MANAGER', 'ACCOUNTANT', 'ADMIN'];

/** Inactivity timeout per role (FR-AUTH-05). */
export const SESSION_IDLE_MINUTES: Record<Role, number> = {
  ADMIN: 30,
  ACCOUNTANT: 30,
  CAFE_MANAGER: 30,
  CASHIER: 12 * 60,
  PARENT: 30 * 24 * 60,
};
