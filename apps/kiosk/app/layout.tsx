import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'SchoolCoin — Kiosk',
  description: 'Kiosk tự phục vụ cho học sinh',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen text-lg">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
