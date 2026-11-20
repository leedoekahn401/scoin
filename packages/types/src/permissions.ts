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

/** Front-end sidebar sections. Every capability maps onto a PERMISSIONS key. */
export const Capability = {
  POS_CHARGE: 'POS_CHARGE',
  VOID_OWN_ORDER: 'VOID_OWN_ORDER',
  VOID_ANY_ORDER: 'VOID_ANY_ORDER',
  MANAGE_MENU: 'MANAGE_MENU',
  MANAGE_CASHIERS: 'MANAGE_CASHIERS',
  VIEW_SALES_REPORTS: 'VIEW_SALES_REPORTS',
  MANAGE_MONEY: 'MANAGE_MONEY',
  VIEW_FINANCE_REPORTS: 'VIEW_FINANCE_REPORTS',
  MANAGE_STUDENTS: 'MANAGE_STUDENTS',
  MANAGE_STAFF: 'MANAGE_STAFF',
  MANAGE_SETTINGS: 'MANAGE_SETTINGS',
  VIEW_AUDIT_LOG: 'VIEW_AUDIT_LOG',
} as const;
export type Capability = (typeof Capability)[keyof typeof Capability];

const CAPABILITY_PERMISSION = {
  POS_CHARGE: 'POS_CHARGE',
  VOID_OWN_ORDER: 'VOID_OWN_ORDER',
  VOID_ANY_ORDER: 'VOID_ANY_ORDER',
  MANAGE_MENU: 'MENU_AND_CASHIERS',
  MANAGE_CASHIERS: 'MENU_AND_CASHIERS',
  VIEW_SALES_REPORTS: 'SALES_REPORTS',
  MANAGE_MONEY: 'FINANCE',
  VIEW_FINANCE_REPORTS: 'FINANCE_REPORTS',
  MANAGE_STUDENTS: 'STUDENTS',
  MANAGE_STAFF: 'SYSTEM',
  MANAGE_SETTINGS: 'SYSTEM',
  VIEW_AUDIT_LOG: 'SYSTEM',
} as const satisfies Record<Capability, Permission>;

/** Accepts an API permission key or a front-end capability. */
export function can(
  role: Role | null | undefined,
  permissionOrCapability: Permission | Capability,
): boolean {
  if (!role) return false;
  const permission = (
    permissionOrCapability in PERMISSIONS
      ? permissionOrCapability
      : CAPABILITY_PERMISSION[permissionOrCapability as Capability]
  ) as Permission;
  return (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export function capabilitiesOf(role: Role | null | undefined): readonly Capability[] {
  if (!role) return [];
  return (Object.keys(CAPABILITY_PERMISSION) as Capability[]).filter((capability) =>
    can(role, capability),
  );
}
