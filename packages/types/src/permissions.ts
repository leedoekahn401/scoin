import type { Role } from './roles';

/**
 * Permission matrix (SRS 4.12). The API's @Roles() and the admin sidebar both read from here,
 * so the matrix lives in one place. Ownership checks (own children, own order) happen in services.
 */
export const PERMISSIONS = {
  /** Own children: view, top up, controls, requests, lock card */
  OWN_CHILDREN: ['PARENT'],
  /** POS: charge orders */
  POS_CHARGE: ['CASHIER', 'CAFE_MANAGER'],
  /** Void own order (same day) */
  VOID_OWN_ORDER: ['CASHIER', 'CAFE_MANAGER', 'ADMIN'],
  /** Void any order (same day) */
  VOID_ANY_ORDER: ['CAFE_MANAGER', 'ADMIN'],
  /** Menu and prices; cashier accounts */
  MENU_AND_CASHIERS: ['CAFE_MANAGER', 'ADMIN'],
  /** Sales reports */
  SALES_REPORTS: ['CAFE_MANAGER', 'ACCOUNTANT', 'ADMIN'],
  /** Cash top-ups, unmatched payments, refunds, adjustments */
  FINANCE: ['ACCOUNTANT', 'ADMIN'],
  /** Top-up, outstanding balance and reconciliation reports */
  FINANCE_REPORTS: ['ACCOUNTANT', 'ADMIN'],
  /** Students, cards, PINs, family invites */
  STUDENTS: ['ADMIN'],
  /** Staff users and roles, settings, kiosk devices, audit log */
  SYSTEM: ['ADMIN'],
} as const satisfies Record<string, readonly Role[]>;

export type Permission = keyof typeof PERMISSIONS;

export function can(role: Role, permission: Permission): boolean {
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}
