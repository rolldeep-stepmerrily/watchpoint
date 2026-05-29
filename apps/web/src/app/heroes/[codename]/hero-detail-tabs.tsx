'use client';

import type { HeroDetailDto, HeroPatchHistoryDto, Locale } from '@@shared';
import Link from 'next/link';
import { useState } from 'react';

import { categoryColorVar, PERK_TIER_ORDER, perkTierColorVar, slotColorVar, statKeyLabel } from '@/lib/format';
import { getLabels, type Labels } from '@/lib/labels';

type TabKey = 'abilities' | 'perks' | 'history';

interface Props {
  hero: HeroDetailDto;
  history: HeroPatchHistoryDto;
  locale: Locale;
}

export function HeroDetailTabs({ hero, history, locale }: Props) {
  const t = getLabels(locale);
  const perksCount = hero.perks?.length ?? 0;
  const historyCount = history.history.length;
  const tabs: { key: TabKey; label: string; count: number; disabled?: boolean }[] = [
    { key: 'abilities', label: t.hero.abilities, count: hero.abilities.length },
    { key: 'perks', label: t.hero.perks, count: perksCount, disabled: perksCount === 0 },
    { key: 'history', label: t.hero.patchHistory, count: historyCount, disabled: historyCount === 0 },
  ];

  const initial: TabKey = tabs.find((tab) => !tab.disabled)?.key ?? 'abilities';
  const [active, setActive] = useState<TabKey>(initial);

  return (
    <section className="space-y-4">
      <div
        className="flex items-center gap-1 border-b border-(--color-border)"
        role="tablist"
      >
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={tab.disabled}
              onClick={() => setActive(tab.key)}
              className={`relative px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab.disabled
                  ? 'text-(--color-text-faint) cursor-not-allowed'
                  : isActive
                    ? 'text-(--color-accent)'
                    : 'text-(--color-text-muted) hover:text-(--color-text)'
              }`}
            >
              <span className="inline-flex items-center gap-2">
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
                  className="absolute left-0 right-0 -bottom-px h-0.5 bg-(--color-accent)"
                  aria-hidden
                />
              )}
            </button>
          );
        })}
      </div>

      {active === 'abilities' && (
        <AbilitiesPanel
          hero={hero}
          t={t}
        />
      )}
      {active === 'perks' && (
        <PerksPanel
          hero={hero}
          t={t}
        />
      )}
      {active === 'history' && (
        <HistoryPanel
          history={history}
          t={t}
        />
      )}
    </section>
  );
}

function AbilitiesPanel({ hero, t }: { hero: HeroDetailDto; t: Labels }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {hero.abilities.map((ability) => {
        const slotColor = `var(${slotColorVar(ability.slot)})`;
        return (
          <li
            key={ability.id}
            className="relative p-4 rounded-lg border border-(--color-border) bg-(--color-surface-elevated) overflow-hidden"
            style={{ boxShadow: 'var(--shadow-card)' }}
          >
            <span
              className="absolute top-0 left-0 h-full w-1"
              style={{ background: slotColor }}
              aria-hidden
            />
            <div className="pl-2">
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
                  style={{
                    color: slotColor,
                    backgroundColor: `color-mix(in srgb, ${slotColor} 12%, transparent)`,
                  }}
                >
                  {t.slot(ability.slot)}
                </span>
                {ability.key && <span className="text-[11px] text-(--color-text-faint) font-mono">{ability.key}</span>}
              </div>
              <div className="font-bold text-base mt-1.5 text-(--color-text-strong)">{ability.name}</div>
              <p className="text-sm text-(--color-text-muted) mt-1.5 whitespace-pre-line leading-relaxed">
                {ability.description}
              </p>
              {ability.stats && Object.keys(ability.stats).length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                  {Object.entries(ability.stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex items-baseline gap-1.5 py-0.5"
                    >
                      <dt className="text-(--color-text-muted)">{statKeyLabel(key)}:</dt>
                      <dd className="font-mono text-(--color-text)">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function PerksPanel({ hero, t }: { hero: HeroDetailDto; t: Labels }) {
  return (
    <div className="space-y-6">
      {PERK_TIER_ORDER.map((tier) => {
        const tierPerks = hero.perks.filter((perk) => perk.tier === tier);
        if (tierPerks.length === 0) {
          return null;
        }
        const tierColor = `var(${perkTierColorVar(tier)})`;
        return (
          <div
            key={tier}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: tierColor }}
                aria-hidden
              />
              <span
                className="text-[10px] uppercase tracking-widest font-bold"
                style={{ color: tierColor }}
              >
                {t.perkTier(tier)}
              </span>
            </div>
            <ul className="grid gap-3 md:grid-cols-2">
              {tierPerks.map((perk) => (
                <li
                  key={perk.id}
                  className="relative p-4 rounded-lg border border-(--color-border) bg-(--color-surface-elevated) overflow-hidden"
                  style={{ boxShadow: 'var(--shadow-card)' }}
                >
                  <span
                    className="absolute top-0 left-0 h-full w-1"
                    style={{ background: tierColor }}
                    aria-hidden
                  />
                  <div className="pl-2 space-y-1.5">
                    <div className="font-bold text-base text-(--color-text-strong)">{perk.name}</div>
                    <p className="text-sm text-(--color-text-muted) whitespace-pre-line leading-relaxed">
                      {perk.description}
                    </p>
                    {perk.stats && Object.keys(perk.stats).length > 0 && (
                      <dl className="mt-2 grid grid-cols-1 gap-y-0.5 text-xs">
                        {Object.entries(perk.stats).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-baseline gap-1.5 py-0.5"
                          >
                            <dt className="text-(--color-text-muted)">{statKeyLabel(key)}:</dt>
                            <dd className="font-mono text-(--color-text)">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

function HistoryPanel({ history, t }: { history: HeroPatchHistoryDto; t: Labels }) {
  return (
    <div className="border border-(--color-border) rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-(--color-surface) border-b border-(--color-border)">
          <tr className="text-left text-[10px] uppercase tracking-widest text-(--color-text-muted)">
            <th className="px-3 py-2 w-28">{t.hero.history.columns.version}</th>
            <th className="px-3 py-2 w-32 hidden sm:table-cell">{t.hero.history.columns.date}</th>
            <th className="px-3 py-2">{t.hero.history.columns.changes}</th>
          </tr>
        </thead>
        <tbody>
          {history.history.map(({ patchNote, entries }) => (
            <tr
              key={patchNote.id}
              className="border-b border-(--color-border) last:border-0 hover:bg-(--color-accent-faint)/40 transition-colors align-top"
            >
              <td className="px-3 py-3 whitespace-nowrap">
                <Link
                  href={`/patch-notes/${patchNote.version}`}
                  className="text-(--color-accent) font-mono text-sm font-bold hover:text-(--color-accent-hover)"
                >
                  {patchNote.version}
                </Link>
              </td>
              <td className="px-3 py-3 hidden sm:table-cell text-(--color-text-faint) font-mono text-xs whitespace-nowrap">
                {t.date(patchNote.releasedAt)}
              </td>
              <td className="px-3 py-3 space-y-2">
                {entries.map((entry) => {
                  const catColor = `var(${categoryColorVar(entry.category)})`;
                  return (
                    <div
                      key={entry.id}
                      className="text-sm"
                    >
                      <div className="flex items-baseline gap-2">
                        <span
                          className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-bold shrink-0"
                          style={{
                            color: catColor,
                            backgroundColor: `color-mix(in srgb, ${catColor} 12%, transparent)`,
                          }}
                        >
                          {t.category(entry.category)}
                        </span>
                        <span className="font-semibold text-(--color-text-strong)">{entry.title}</span>
                      </div>
                      <p className="text-(--color-text-muted) text-xs mt-1 whitespace-pre-line leading-relaxed">
                        {entry.body}
                      </p>
                    </div>
                  );
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
