'use client';

import type { HeroRole, HeroSummaryDto, Locale } from '@@shared';
import { useMemo, useState } from 'react';

import { HeroCard } from '@/components/hero-card';
import { ROLE_ORDER, roleColorVar } from '@/lib/format';
import { getLabels } from '@/lib/labels';

type RoleFilter = 'ALL' | HeroRole;
type SortKey = 'name' | 'released';

interface Props {
  items: HeroSummaryDto[];
  locale: Locale;
}

export function HeroGrid({ items, locale }: Props) {
  const t = getLabels(locale);
  const [role, setRole] = useState<RoleFilter>('ALL');
  const [sortKey, setSortKey] = useState<SortKey>('name');

  const collator = useMemo(() => new Intl.Collator(locale === 'en' ? 'en-US' : 'ko-KR'), [locale]);

  const visible = useMemo(() => {
    const filtered = role === 'ALL' ? items : items.filter((h) => h.role === role);
    const compareName = (a: HeroSummaryDto, b: HeroSummaryDto): number => collator.compare(a.name, b.name);
    const compareRoleThenName = (a: HeroSummaryDto, b: HeroSummaryDto): number => {
      const r = ROLE_ORDER.indexOf(a.role) - ROLE_ORDER.indexOf(b.role);
      return r !== 0 ? r : compareName(a, b);
    };

    if (sortKey === 'released') {
      return [...filtered].sort(
        (a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime() || compareName(a, b),
      );
    }

    return [...filtered].sort(role === 'ALL' ? compareRoleThenName : compareName);
  }, [items, role, sortKey, collator]);

  const roleTabs: { key: RoleFilter; label: string; count: number; color: string | null }[] = [
    { key: 'ALL', label: t.heroes.allLabel, count: items.length, color: null },
    ...ROLE_ORDER.map((r) => ({
      key: r,
      label: t.role(r),
      count: items.filter((h) => h.role === r).length,
      color: `var(${roleColorVar(r)})`,
    })),
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div
          className="inline-flex flex-wrap items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-surface) p-1"
          role="tablist"
          aria-label={t.heroes.columns.role}
        >
          {roleTabs.map((tab) => {
            const isActive = tab.key === role;
            return (
              <button
                key={tab.key}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setRole(tab.key)}
                className={`relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-(--color-surface-elevated) text-(--color-text-strong) shadow-sm'
                    : 'text-(--color-text-muted) hover:text-(--color-text)'
                }`}
                style={isActive && tab.color ? { color: tab.color } : undefined}
              >
                {tab.color && (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: tab.color }}
                    aria-hidden
                  />
                )}
                {tab.label}
                <span
                  className={`rounded px-1.5 py-0.5 font-mono text-[10px] ${
                    isActive
                      ? 'bg-(--color-accent-faint) text-(--color-accent)'
                      : 'bg-(--color-bg) text-(--color-text-faint)'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <SortToggle
          sortKey={sortKey}
          onChange={setSortKey}
          labels={{ name: t.heroes.columns.hero, released: t.heroes.columns.released }}
        />
      </div>

      {visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-(--color-text-muted)">{t.heroes.empty}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((hero, idx) => (
            <li key={hero.id}>
              <HeroCard
                hero={hero}
                locale={locale}
                priority={idx < 6}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SortToggle({
  sortKey,
  onChange,
  labels,
}: {
  sortKey: SortKey;
  onChange: (key: SortKey) => void;
  labels: { name: string; released: string };
}) {
  const options: { key: SortKey; label: string }[] = [
    { key: 'name', label: labels.name },
    { key: 'released', label: labels.released },
  ];

  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-(--color-border) bg-(--color-surface) p-1">
      {options.map((opt) => {
        const isActive = opt.key === sortKey;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`rounded-md px-2.5 py-1.5 text-xs font-semibold transition-all ${
              isActive
                ? 'bg-(--color-surface-elevated) text-(--color-text-strong) shadow-sm'
                : 'text-(--color-text-muted) hover:text-(--color-text)'
            }`}
            aria-pressed={isActive}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
