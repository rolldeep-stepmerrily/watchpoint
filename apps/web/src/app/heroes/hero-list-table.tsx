'use client';

import type { HeroRole, HeroSummaryDto, Locale, Subrole } from '@@shared';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { HeroPortrait } from '@/components/hero-portrait';
import { ROLE_ORDER, roleColorVar } from '@/lib/format';
import { getLabels } from '@/lib/labels';

type RoleFilter = 'ALL' | HeroRole;

interface Props {
  items: HeroSummaryDto[];
  locale: Locale;
}

export function HeroListTable({ items, locale }: Props) {
  const t = getLabels(locale);
  const [role, setRole] = useState<RoleFilter>('ALL');

  const collator = useMemo(
    () => new Intl.Collator(locale === 'en' ? 'en-US' : locale === 'ja' ? 'ja-JP' : 'ko-KR'),
    [locale],
  );

  const sorted = useMemo(() => {
    return [...items].sort((a, b) => {
      const roleA = ROLE_ORDER.indexOf(a.role);
      const roleB = ROLE_ORDER.indexOf(b.role);
      if (roleA !== roleB) {
        return roleA - roleB;
      }
      return collator.compare(a.name, b.name);
    });
  }, [items, collator]);

  const filtered = role === 'ALL' ? sorted : sorted.filter((h) => h.role === role);

  const roleTabs: { key: RoleFilter; label: string; count: number }[] = [
    { key: 'ALL', label: t.heroes.allLabel, count: sorted.length },
    ...ROLE_ORDER.map((r) => ({
      key: r,
      label: t.role(r),
      count: sorted.filter((h) => h.role === r).length,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1 border-b border-(--color-border)">
        {roleTabs.map((tab) => {
          const isActive = tab.key === role;
          const tabColor = tab.key === 'ALL' ? null : `var(${roleColorVar(tab.key)})`;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRole(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                isActive ? 'text-(--color-text-strong)' : 'text-(--color-text-muted) hover:text-(--color-text)'
              }`}
            >
              <span
                className="inline-flex items-center gap-2"
                style={isActive && tabColor ? { color: tabColor } : undefined}
              >
                {tab.label}
                <span
                  className={`text-[11px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-(--color-accent-faint) text-(--color-accent)' : 'text-(--color-text-faint)'
                  }`}
                >
                  {tab.count}
                </span>
              </span>
              {isActive && (
                <span
                  className="absolute left-0 right-0 -bottom-px h-0.5"
                  style={{ background: tabColor ?? 'var(--color-accent)' }}
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="text-(--color-text-muted) text-sm py-6">{t.heroes.empty}</p>
      ) : (
        <div className="border border-(--color-border) rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-(--color-surface) border-b border-(--color-border)">
              <tr className="text-left text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                <th className="px-3 py-2 w-12">#</th>
                <th className="px-3 py-2">{t.heroes.columns.hero}</th>
                <th className="px-3 py-2 hidden sm:table-cell">{t.heroes.columns.role}</th>
                <th className="px-3 py-2 hidden md:table-cell">{t.heroes.columns.subrole}</th>
                <th className="px-3 py-2 hidden lg:table-cell text-right">{t.heroes.columns.released}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((hero, idx) => (
                <HeroRow
                  key={hero.id}
                  hero={hero}
                  index={idx + 1}
                  t={t}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function HeroRow({ hero, index, t }: { hero: HeroSummaryDto; index: number; t: ReturnType<typeof getLabels> }) {
  const roleColor = `var(${roleColorVar(hero.role)})`;
  return (
    <tr className="group border-b border-(--color-border) last:border-0 hover:bg-(--color-accent-faint) transition-colors">
      <td className="px-3 py-2 text-(--color-text-faint) font-mono text-xs">{index}</td>
      <td className="px-3 py-2">
        <Link
          href={`/heroes/${hero.codename}`}
          className="flex items-center gap-3 -mx-3 -my-2 px-3 py-2"
        >
          <HeroPortrait
            src={hero.portraitUrl}
            alt={hero.name}
            role={hero.role}
            size="sm"
          />
          <div className="min-w-0">
            <div className="font-bold text-(--color-text-strong) group-hover:text-(--color-accent) transition-colors">
              {hero.name}
            </div>
            <div className="text-[10px] text-(--color-text-faint) font-mono uppercase tracking-wider">
              {hero.codename}
            </div>
          </div>
        </Link>
      </td>
      <td className="px-3 py-2 hidden sm:table-cell">
        <RoleBadge
          role={hero.role}
          label={t.role(hero.role)}
          color={roleColor}
        />
      </td>
      <td className="px-3 py-2 hidden md:table-cell text-(--color-text-muted) text-xs">
        {hero.subrole ? t.subrole(hero.subrole as Subrole) : '—'}
      </td>
      <td className="px-3 py-2 hidden lg:table-cell text-right text-(--color-text-faint) font-mono text-xs">
        {t.date(hero.releasedAt)}
      </td>
    </tr>
  );
}

function RoleBadge({ role, label, color }: { role: HeroRole; label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold"
      style={{ color }}
      data-role={role}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
      {label}
    </span>
  );
}
