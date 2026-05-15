import type { NextConfig } from 'next';

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@watchpoint/shared'],
  experimental: {
    typedRoutes: true,
  },
};

export default config;
