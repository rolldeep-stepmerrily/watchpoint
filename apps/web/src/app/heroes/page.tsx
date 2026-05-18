import type { HeroSummaryDto } from '@@shared';
import Link from 'next/link';

import { getHeroList } from '@/lib/api';
import { ROLE_ORDER, type RoleKey, roleColorVar, roleLabel } from '@/lib/format';

export const revalidate = 300;

export default async function HeroesPage() {
  const { items, total } = await getHeroList({ pageSize: 100 });

  const grouped = groupByRole(items);

  return (
    <div className="space-y-10">
      <header className="flex items-end justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">영웅 ({total})</h1>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">아직 등록된 영웅이 없습니다.</p>
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
                    {roleLabel(role)}
                  </h2>
                  <span className="text-xs text-(--color-text-muted)">{heroes.length}</span>
                </div>
                <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {heroes.map((hero) => (
                    <li key={hero.id}>
                      <Link
                        href={`/heroes/${hero.codename}`}
                        className="block p-4 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
                        style={{ borderLeft: `3px solid var(${colorVar})` }}
                      >
                        <div className="text-base font-semibold">{hero.name}</div>
                        <div className="text-xs text-(--color-text-muted) mt-1 font-mono">{hero.codename}</div>
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

function groupByRole(items: HeroSummaryDto[]): Map<RoleKey, HeroSummaryDto[]> {
  const groups = new Map<RoleKey, HeroSummaryDto[]>();
  for (const hero of items) {
    const list = groups.get(hero.role) ?? [];
    list.push(hero);
    groups.set(hero.role, list);
  }
  for (const list of groups.values()) {
    list.sort((a, b) => a.name.localeCompare(b.name, 'ko-KR'));
  }
  return groups;
}
