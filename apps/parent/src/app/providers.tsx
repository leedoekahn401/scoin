'use client';

import { SchoolCoinProvider } from '@schoolcoin/api-client/react';
import { Role } from '@schoolcoin/types';
import { Toaster } from '@schoolcoin/ui';
import type { ReactNode } from 'react';

const PARENT_ONLY = [Role.PARENT] as const;

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SchoolCoinProvider allowedRoles={PARENT_ONLY}>
      {children}
      <Toaster />
    </SchoolCoinProvider>
  );
}
