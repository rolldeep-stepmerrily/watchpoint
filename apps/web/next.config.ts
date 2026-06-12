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
    remotePatterns: [
      ...minioRemotePattern,
      /**
       * 나무위키 이미지(portrait/icon 등) 직접 렌더링용. 다운로드 후 MinIO로 옮기기 전 임시 렌더 허용.
       * MinIO에 자산 옮긴 뒤에는 hero/ability/perk row의 URL이 cdn 도메인으로 바뀌므로 자연 제거됨.
       */
      { protocol: 'https', hostname: 'i.namu.wiki' },
    ],
  },
  async rewrites() {
    // 명시적 public API 화이트리스트만 proxy. 와일드카드는 NestJS `/internal/*`를 함께 노출하므로 금지.
    // 새 public endpoint 추가 시 여기 한 줄 추가.
    return [
      { source: '/api/heroes', destination: `${API_BASE}/heroes` },
      { source: '/api/heroes/:path*', destination: `${API_BASE}/heroes/:path*` },
      { source: '/api/patch-notes', destination: `${API_BASE}/patch-notes` },
      { source: '/api/patch-notes/:path*', destination: `${API_BASE}/patch-notes/:path*` },
      { source: '/api/search', destination: `${API_BASE}/search` },
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
