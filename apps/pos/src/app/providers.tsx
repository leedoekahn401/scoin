'use client';

import { SchoolCoinProvider } from '@schoolcoin/api-client/react';
import { POS_ROLES } from '@schoolcoin/types';
import { Toaster } from '@schoolcoin/ui';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SchoolCoinProvider allowedRoles={POS_ROLES}>
      {children}
      <Toaster />
    </SchoolCoinProvider>
  );
}
