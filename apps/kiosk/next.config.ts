import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Workspace packages ship TypeScript source; Next compiles them.
  transpilePackages: [
    '@schoolcoin/ui',
    '@schoolcoin/api-client',
    '@schoolcoin/types',
    '@schoolcoin/mock-data',
  ],
  poweredByHeader: false,
};

export default nextConfig;
