import type { HeroRole, HeroSummaryDto, Locale } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { HeroPortrait } from '@/components/hero-portrait';
import { getHeroList } from '@/lib/api';
import { ROLE_ORDER, roleColorVar } from '@/lib/format';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

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

  const grouped = groupByRole(items, lang);

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">{t.heroes.titleWithCount(total)}</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">{t.heroes.empty}</p>
      ) : (
        <div className="space-y-8">
          {ROLE_ORDER.map((role) => {
            const heroes = grouped.get(role) ?? [];
            if (heroes.length === 0) return null;
            const colorVar = roleColorVar(role);
            return (
              <section
                key={role}
                className="space-y-3"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `var(${colorVar})` }}
                    aria-hidden
                  />
                  <h2
                    className="text-sm font-semibold uppercase tracking-widest"
                    style={{ color: `var(${colorVar})` }}
                  >
                    {t.role(role)}
                  </h2>
                  <span className="text-xs text-(--color-text-muted)">{heroes.length}</span>
                </div>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {heroes.map((hero) => (
                    <li key={hero.id}>
                      <Link
                        href={`/heroes/${hero.codename}`}
                        className="flex items-center gap-3 p-3 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
                        style={{ borderLeft: `3px solid var(${colorVar})` }}
                      >
                        <HeroPortrait
                          src={hero.portraitUrl}
                          alt={hero.name}
                          role={hero.role}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="text-base font-semibold truncate">{hero.name}</div>
                          <div className="text-xs text-(--color-text-muted) mt-1 truncate">
                            {hero.subrole ? t.subrole(hero.subrole) : hero.codename}
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}

function groupByRole(items: HeroSummaryDto[], lang: Locale): Map<HeroRole, HeroSummaryDto[]> {
  const groups = new Map<HeroRole, HeroSummaryDto[]>();
  for (const hero of items) {
    const list = groups.get(hero.role) ?? [];
    list.push(hero);
    groups.set(hero.role, list);
  }
  const collator = lang === 'en' ? 'en-US' : lang === 'ja' ? 'ja-JP' : 'ko-KR';
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, collator));
  }
  return groups;
}
