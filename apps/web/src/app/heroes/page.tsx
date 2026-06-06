import type { Metadata } from 'next';

import { JsonLd } from '@/components/json-ld';
import { getHeroList } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { absoluteUrl, buildBreadcrumbJsonLd, buildItemListJsonLd, SITE_NAME } from '@/lib/seo';

import { HeroListTable } from './hero-list-table';

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  const t = getLabels(await getLocale());
  return {
    title: t.heroes.title,
    description: t.heroes.description,
    alternates: { canonical: '/heroes' },
    openGraph: { title: t.heroes.title, url: '/heroes' },
  };
}

export default async function HeroesPage() {
  const lang = await getLocale();
  const t = getLabels(lang);
  const { items, total } = await getHeroList({ pageSize: 100, lang });

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

      <HeroListTable
        items={items}
        locale={lang}
      />
    </div>
  );
}
