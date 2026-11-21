import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';

import { fontVariables } from './fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Phụ huynh · SchoolCoin', template: '%s · SchoolCoin' },
  description: 'Nạp xu, theo dõi chi tiêu và quản lý thẻ của con.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'SchoolCoin', statusBarStyle: 'default' },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#faf9f7' };

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={fontVariables}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
