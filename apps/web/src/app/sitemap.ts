import type { MetadataRoute } from 'next';

import { getHeroList, getPatchNoteList } from '@/lib/api';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // pageSize는 API DTO의 `@Max(100)` 상한과 일치시킨다. 100을 초과하면 400 응답이 나면서
  // .catch가 빈 array를 반환 → sitemap에서 patch URL 전부 누락. patch 누적이 100을 넘어가면
  // 그때 페이지네이션 도입 필요.
  const [heroes, patchNotes] = await Promise.all([
    getHeroList({ pageSize: 100 }).catch(() => ({ items: [] })),
    getPatchNoteList({ pageSize: 100 }).catch(() => ({ items: [] })),
  ]);

  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = [
    { url: absoluteUrl('/'), lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: absoluteUrl('/heroes'), lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: absoluteUrl('/patch-notes'), lastModified: now, changeFrequency: 'daily', priority: 0.9 },
  ];

  const heroEntries: MetadataRoute.Sitemap = heroes.items.map((hero) => ({
    url: absoluteUrl(`/heroes/${hero.codename}`),
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.7,
  }));

  const patchEntries: MetadataRoute.Sitemap = patchNotes.items.map((patch) => ({
    url: absoluteUrl(`/patch-notes/${patch.version}`),
    lastModified: new Date(patch.releasedAt),
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  return [...staticEntries, ...heroEntries, ...patchEntries];
}
