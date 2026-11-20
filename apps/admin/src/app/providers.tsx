'use client';

import { SchoolCoinProvider } from '@schoolcoin/api-client/react';
import { STAFF_ADMIN_ROLES } from '@schoolcoin/types';
import { Toaster } from '@schoolcoin/ui';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SchoolCoinProvider allowedRoles={STAFF_ADMIN_ROLES}>
      {children}
      <Toaster />
    </SchoolCoinProvider>
  );
}
