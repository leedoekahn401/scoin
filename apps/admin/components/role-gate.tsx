import type { Role } from '@schoolcoin/types';
import type { ReactNode } from 'react';

/** Hides UI by role. The API still enforces every permission. */
export function RoleGate({
  role,
  allow,
  children,
}: {
  role: Role;
  allow: Role[];
  children: ReactNode;
}) {
  return allow.includes(role) ? <>{children}</> : null;
}
