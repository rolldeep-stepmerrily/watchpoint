'use client';

import type { CareerStatsHeroEntryDto } from '@@shared';
import { useMemo, useState } from 'react';

import type { Labels } from '@/lib/labels';

type SortKey = 'gamesPlayed' | 'winrate' | 'kda' | 'timePlayed';

interface Props {
  heroes: CareerStatsHeroEntryDto[];
  t: Labels;
}

interface Column {
  key: SortKey;
  label: string;
  format: (h: CareerStatsHeroEntryDto, t: Labels) => string;
}

const COLUMNS = (t: Labels): Column[] => [
  { key: 'gamesPlayed', label: t.career.stats.gamesPlayed, format: (h) => h.gamesPlayed.toLocaleString() },
  { key: 'winrate', label: t.career.stats.winrate, format: (h) => `${h.winrate.toFixed(1)}%` },
  { key: 'kda', label: t.career.stats.kda, format: (h) => h.kda.toFixed(2) },
  {
    key: 'timePlayed',
    label: t.career.stats.timePlayed,
    format: (h, tl) => tl.career.stats.hoursPlayed(h.timePlayed / 3600),
  },
];

/**
 * 영웅 codename(`wrecking-ball`)을 사람이 읽기 좋게 변환 — 하이픈 → 공백 + Title Case.
 * 실제 localized 영웅 이름이 필요하면 후속 PR에서 hero API 통합.
 */
function prettifyCodename(codename: string): string {
  return codename
    .split('-')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');
}

export function HeroStatsTable({ heroes, t }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('gamesPlayed');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const sorted = useMemo(() => {
    const copy = [...heroes];
    copy.sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return copy;
  }, [heroes, sortKey, sortDir]);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const columns = COLUMNS(t);

  return (
    <div className="overflow-hidden rounded-lg border border-(--color-border)">
      <table className="w-full text-sm">
        <thead className="border-b border-(--color-border) bg-(--color-surface)">
          <tr className="text-left text-[10px] uppercase tracking-widest text-(--color-text-muted)">
            <th className="px-3 py-2">{t.career.stats.hero}</th>
            {columns.map((col) => {
              const isActive = col.key === sortKey;
              const nextDirLabel =
                isActive && sortDir === 'desc'
                  ? t.career.stats.sortAscAria(col.label)
                  : t.career.stats.sortDescAria(col.label);
              return (
                <th
                  key={col.key}
                  className="px-3 py-2 text-right"
                  aria-sort={isActive ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(col.key)}
                    aria-label={nextDirLabel}
                    className={`inline-flex items-center gap-1 font-bold uppercase tracking-widest transition-colors ${
                      isActive ? 'text-(--color-accent)' : 'text-(--color-text-muted) hover:text-(--color-text)'
                    }`}
                  >
                    {col.label}
                    <SortIndicator
                      active={isActive}
                      dir={sortDir}
                    />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {sorted.map((hero) => (
            <tr
              key={hero.codename}
              className="border-b border-(--color-border) last:border-0 hover:bg-(--color-accent-faint)/40 transition-colors"
            >
              <td className="px-3 py-2 font-semibold text-(--color-text-strong)">{prettifyCodename(hero.codename)}</td>
              {columns.map((col) => (
                <td
                  key={col.key}
                  className="px-3 py-2 text-right font-mono text-(--color-text)"
                >
                  {col.format(hero, t)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SortIndicator({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  if (!active) {
    return (
      <span
        aria-hidden
        className="text-(--color-text-faint)"
      >
        ↕
      </span>
    );
  }
  return <span aria-hidden>{dir === 'asc' ? '↑' : '↓'}</span>;
}
