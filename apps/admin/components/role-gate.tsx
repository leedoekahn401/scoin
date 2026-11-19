import { can, type Permission, type Role } from '@schoolcoin/types';
import type { ReactNode } from 'react';

/** Hides UI by role. The API still enforces every permission (NFR-SEC-04). */
export function RoleGate({
  role,
  permission,
  children,
}: {
  role: Role;
  permission: Permission;
  children: ReactNode;
}) {
  return can(role, permission) ? <>{children}</> : null;
}
