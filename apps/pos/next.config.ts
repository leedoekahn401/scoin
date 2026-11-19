import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Standalone output is for the Docker image (infra/docker/next.Dockerfile sets NEXT_OUTPUT).
  output: process.env.NEXT_OUTPUT === 'standalone' ? 'standalone' : undefined,
  transpilePackages: ['@schoolcoin/ui', '@schoolcoin/api-client'],
  // Lint runs as its own step (pnpm lint), not inside next build.
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
