import type { MetadataRoute } from 'next';

import { getHeroList, getPatchNoteList } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

// G-2: locale별 routes를 sitemap에 동시 노출 + alternates(hreflang)로 동등성 명시.
// 검색엔진이 동일 콘텐츠의 다른 언어 변형을 인식해 적절한 locale을 노출.
const SUPPORTED_LOCALES = ['ko', 'en'] as const;

const buildAlternates = (suffix: string): Record<string, string> => {
  return Object.fromEntries(SUPPORTED_LOCALES.map((l) => [l, absoluteUrl(`/${l}${suffix}`)]));
};

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // pageSize는 API DTO의 `@Max(100)` 상한과 일치. patch 누적이 100을 넘어가면 페이지네이션 도입 필요.
  const [heroes, patchNotes] = await Promise.all([
    getHeroList({ pageSize: 100 }).catch(() => ({ items: [] })),
    getPatchNoteList({ pageSize: 100 }).catch(() => ({ items: [] })),
  ]);

  const now = new Date();
  const entries: MetadataRoute.Sitemap = [];

  // 정적 페이지: 루트(/, /heroes, /patch-notes) × locales
  const staticSuffixes: Array<{
    suffix: string;
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'];
    priority: number;
  }> = [
    { suffix: '', changeFrequency: 'daily', priority: 1 },
    { suffix: '/heroes', changeFrequency: 'weekly', priority: 0.8 },
    { suffix: '/patch-notes', changeFrequency: 'daily', priority: 0.9 },
  ];

  for (const { suffix, changeFrequency, priority } of staticSuffixes) {
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: absoluteUrl(`/${lang}${suffix}`),
        lastModified: now,
        changeFrequency,
        priority,
        alternates: { languages: buildAlternates(suffix) },
      });
    }
  }

  // 영웅 상세 × locales
  for (const hero of heroes.items) {
    const suffix = `/heroes/${hero.codename}`;
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: absoluteUrl(`/${lang}${suffix}`),
        lastModified: now,
        changeFrequency: 'weekly',
        priority: 0.7,
        alternates: { languages: buildAlternates(suffix) },
      });
    }
  }

  // 패치노트 상세 × locales
  for (const patch of patchNotes.items) {
    const suffix = `/patch-notes/${patch.version}`;
    const lastModified = new Date(patch.releasedAt);
    for (const lang of SUPPORTED_LOCALES) {
      entries.push({
        url: absoluteUrl(`/${lang}${suffix}`),
        lastModified,
        changeFrequency: 'monthly',
        priority: 0.6,
        alternates: { languages: buildAlternates(suffix) },
      });
    }
  }

  return entries;
}
