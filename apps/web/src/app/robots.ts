import type { MetadataRoute } from 'next';

import { absoluteUrl, SITE_URL } from '@/lib/seo';

/**
 * 검색엔진 크롤링 정책 — /api와 Next.js 내부 경로는 차단, 나머지는 허용
 *
 * @returns {MetadataRoute.Robots} robots.txt 정의
 */
const robots = (): MetadataRoute.Robots => {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/_next/'],
      },
    ],
    sitemap: absoluteUrl('/sitemap.xml'),
    host: SITE_URL,
  };
};

export default robots;
