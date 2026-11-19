import type { ReactNode } from 'react';

// TODO(FE-1): sign out after 30 s of inactivity.
export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
