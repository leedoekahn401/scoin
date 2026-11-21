import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { fontVariables } from './fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Quản trị · SchoolCoin', template: '%s · SchoolCoin' },
  description: 'Trang quản trị SchoolCoin dành cho hội đồng trường, kế toán và quản lý căng tin.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" className={fontVariables}>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
