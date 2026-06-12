import type { Metadata } from 'next';

import { JsonLd } from '@/components/json-ld';
import { getHeroList } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { absoluteUrl, buildBreadcrumbJsonLd, buildItemListJsonLd, SITE_NAME } from '@/lib/seo';

import { HeroGrid } from './hero-grid';

export const revalidate = 300;

interface Props {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata(): Promise<Metadata> {
  const t = getLabels(await getLocale());
  return {
    title: t.heroes.title,
    description: t.heroes.description,
    alternates: { canonical: '/heroes' },
    openGraph: { title: t.heroes.title, url: '/heroes' },
  };
}

export default async function HeroesPage({ searchParams }: Props) {
  const lang = await getLocale();
  const t = getLabels(lang);
  // sitelinks searchbox(JSON-LD)에서 `/heroes?q={검색어}`로 진입한 사용자를 위한 q 필터.
  // 트림 + 1자 이상만 API에 전달. 빈 q는 전체 목록.
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim();
  const { items, total } = await getHeroList({ pageSize: 100, lang, ...(q && q.length > 0 ? { q } : {}) });

  const itemList = buildItemListJsonLd(
    items.map((hero) => ({ name: hero.name, url: absoluteUrl(`/heroes/${hero.codename}`) })),
  );
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: absoluteUrl('/') },
    { name: t.heroes.title, url: absoluteUrl('/heroes') },
  ]);

  return (
    <div className="space-y-6">
      <JsonLd data={[itemList, breadcrumb]} />
      <header className="pb-4 border-b border-(--color-border)">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--color-text-muted)">Roster</p>
        <div className="mt-1 flex items-baseline gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-(--color-text-strong)">{t.heroes.title}</h1>
          <span className="text-sm text-(--color-text-faint) font-mono">{total}</span>
        </div>
        <p className="text-xs text-(--color-text-muted) mt-1.5">{t.heroes.description}</p>
      </header>

      <HeroGrid
        items={items}
        locale={lang}
      />
    </div>
  );
}
