export const ROLES = ['PARENT', 'CASHIER', 'CAFE_MANAGER', 'ACCOUNTANT', 'ADMIN'] as const;

export type Role = (typeof ROLES)[number];

/** Const-object form of the same union, for front-end code (`Role.ADMIN`). */
export const Role = {
  PARENT: 'PARENT',
  CASHIER: 'CASHIER',
  CAFE_MANAGER: 'CAFE_MANAGER',
  ACCOUNTANT: 'ACCOUNTANT',
  ADMIN: 'ADMIN',
} as const satisfies Record<Role, Role>;

/** Roles that sign in to the admin page (SRS §2.2). */
export const STAFF_ADMIN_ROLES = [Role.CAFE_MANAGER, Role.ACCOUNTANT, Role.ADMIN] as const;
/** Roles that may operate the POS (permission matrix §4.12). */
export const POS_ROLES = [Role.CASHIER, Role.CAFE_MANAGER] as const;

export const STAFF_ROLES: readonly Role[] = ['CASHIER', 'CAFE_MANAGER', 'ACCOUNTANT', 'ADMIN'];

/** Inactivity timeout per role (FR-AUTH-05). */
export const SESSION_IDLE_MINUTES: Record<Role, number> = {
  ADMIN: 30,
  ACCOUNTANT: 30,
  CAFE_MANAGER: 30,
  CASHIER: 12 * 60,
  PARENT: 30 * 24 * 60,
};
