import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'SchoolCoin',
    short_name: 'SchoolCoin',
    description: 'Nạp tiền và theo dõi chi tiêu ở căn tin của con',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#178151',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}
