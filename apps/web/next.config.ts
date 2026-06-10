import { withSentryConfig } from '@sentry/nextjs';
import type { NextConfig } from 'next';

const API_BASE = process.env.WEB_API_BASE_URL ?? 'http://localhost:3000';

/**
 * MinIO 공개 URL이 지정된 경우 해당 host를 Image remotePatterns에 자동 추가.
 * 로컬 개발 시 미설정이면 기존 자체 호스팅(`/icons/...` path)만 사용.
 */
const MINIO_PUBLIC_URL = process.env.MINIO_PUBLIC_URL;
const minioRemotePattern = MINIO_PUBLIC_URL
  ? [{ protocol: 'https' as const, hostname: new URL(MINIO_PUBLIC_URL).hostname }]
  : [];

const config: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@watchpoint/shared'],
  typedRoutes: true,
  images: {
    remotePatterns: [...minioRemotePattern],
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

export default withSentryConfig(config, {
  silent: !process.env.CI,
  tunnelRoute: '/monitoring',
  disableLogger: true,
  hideSourceMaps: true,
  widenClientFileUpload: true,
});
