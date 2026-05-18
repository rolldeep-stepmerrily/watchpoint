import type { NextConfig } from 'next';

const API_BASE = process.env.WEB_API_BASE_URL ?? 'http://localhost:3000';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@watchpoint/shared'],
  experimental: {
    typedRoutes: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${API_BASE}/:path*`,
      },
    ];
  },
};

export default config;
