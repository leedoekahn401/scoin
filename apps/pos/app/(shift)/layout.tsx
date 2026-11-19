import type { ReactNode } from 'react';

// TODO(FE-1): require cashier/manager session; top bar with cashier name, today orders, sign out.
export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
