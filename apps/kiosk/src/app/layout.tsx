import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { fontVariables } from './fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Kiosk · SchoolCoin', template: '%s · SchoolCoin' },
  description: 'Kiểm tra số dư và xin thêm xu.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={fontVariables}>
      <body className="select-none overflow-hidden">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
