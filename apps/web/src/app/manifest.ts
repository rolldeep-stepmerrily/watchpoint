import type { MetadataRoute } from 'next';

import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { SITE_NAME } from '@/lib/seo';

/**
 * PWA manifest — 홈 화면 추가/standalone 실행 시 사용
 *
 * @returns {Promise<MetadataRoute.Manifest>} Next.js manifest 정의
 */
const manifest = async (): Promise<MetadataRoute.Manifest> => {
  const t = getLabels(await getLocale());

  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: t.site.description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#fa9c1d',
    icons: [
      { src: '/icons/icon-96.png', sizes: '96x96', type: 'image/png' },
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
};

export default manifest;
