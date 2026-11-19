export const ROLES = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'CASHIER', 'PARENT'] as const;

export type Role = (typeof ROLES)[number];

export const STAFF_ROLES: readonly Role[] = ['ADMIN', 'ACCOUNTANT', 'MANAGER', 'CASHIER'];
