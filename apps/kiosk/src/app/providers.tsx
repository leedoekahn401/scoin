'use client';

import { SchoolCoinProvider } from '@schoolcoin/api-client/react';
import { Toaster } from '@schoolcoin/ui';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SchoolCoinProvider allowedRoles={null}>
      {children}
      <Toaster />
    </SchoolCoinProvider>
  );
}
