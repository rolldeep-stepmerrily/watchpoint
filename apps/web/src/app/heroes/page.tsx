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
      <header className="border-b border-(--color-border) pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted)">Roster</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--color-text-strong) mt-1">
          {t.heroes.titleWithCount(total)}
        </h1>
        <p className="text-sm text-(--color-text-muted) mt-2">{t.heroes.description}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">{t.heroes.empty}</p>
      ) : (
        <div className="space-y-10">
          {ROLE_ORDER.map((role) => {
            const heroes = grouped.get(role) ?? [];
            if (heroes.length === 0) return null;
            const colorVar = roleColorVar(role);
            return (
              <section
                key={role}
                className="space-y-4"
              >
                <div
                  className="flex items-baseline gap-3 border-l-2 pl-3"
                  style={{ borderColor: `var(${colorVar})` }}
                >
                  <h2
                    className="text-sm font-bold uppercase tracking-widest"
                    style={{ color: `var(${colorVar})` }}
                  >
                    {t.role(role)}
                  </h2>
                  <span className="text-xs text-(--color-text-faint) font-mono">{heroes.length}</span>
                </div>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                  {heroes.map((hero) => (
                    <li key={hero.id}>
                      <Link
                        href={`/heroes/${hero.codename}`}
                        className="hover-lift group block p-3 rounded-lg border border-(--color-border) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover) relative overflow-hidden"
                      >
                        <span
                          className="absolute top-0 left-0 h-full w-0.5"
                          style={{ background: `var(${colorVar})` }}
                          aria-hidden
                        />
                        <div className="flex items-center gap-3">
                          <HeroPortrait
                            src={hero.portraitUrl}
                            alt={hero.name}
                            role={hero.role}
                            size="md"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-(--color-text-strong) truncate group-hover:text-(--color-accent-hover) transition-colors">
                              {hero.name}
                            </div>
                            <div className="text-[10px] text-(--color-text-faint) mt-0.5 font-mono uppercase tracking-wider truncate">
                              {hero.codename}
                            </div>
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
