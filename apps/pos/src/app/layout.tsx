import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { fontVariables } from './fonts';
import { Providers } from './providers';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Căng tin · SchoolCoin', template: '%s · SchoolCoin' },
  description: 'Máy bán hàng căng tin SchoolCoin.',
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
