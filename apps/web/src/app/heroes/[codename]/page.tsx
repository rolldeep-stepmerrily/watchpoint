import type { HeroDetailDto, HeroPatchHistoryDto } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { HeroPortrait } from '@/components/hero-portrait';
import { getHero, getHeroPatchHistory } from '@/lib/api';
import { categoryColorVar, roleColorVar, slotColorVar } from '@/lib/format';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;

interface Props {
  params: Promise<{ codename: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codename } = await params;
  const lang = await getLocale();
  const t = getLabels(lang);
  try {
    const hero = await getHero(codename, lang);
    const title = `${hero.name} · ${t.role(hero.role)}`;
    const description = hero.description ?? t.hero.descriptionFallback(hero.name);
    const url = absoluteUrl(`/heroes/${hero.codename}`);
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        title,
        description,
        url,
        images: hero.portraitUrl ? [{ url: hero.portraitUrl, alt: hero.name }] : undefined,
      },
      twitter: {
        card: hero.portraitUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        images: hero.portraitUrl ? [hero.portraitUrl] : undefined,
      },
    };
  } catch {
    return { title: t.heroes.notFound.title };
  }
}

export default async function HeroDetailPage({ params }: Props) {
  const { codename } = await params;
  const lang = await getLocale();
  const t = getLabels(lang);

  let hero: HeroDetailDto;
  let history: HeroPatchHistoryDto;
  try {
    [hero, history] = await Promise.all([getHero(codename, lang), getHeroPatchHistory(codename, lang)]);
  } catch {
    notFound();
  }

  const roleColor = `var(${roleColorVar(hero.role)})`;
  const roleFaint = `var(${roleColorVar(hero.role)}-faint)`;

  return (
    <article className="grid gap-10 lg:grid-cols-[18rem_1fr] lg:gap-12">
      {/* Left rail — hero meta */}
      <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <div className="relative rounded-2xl border border-(--color-border) bg-(--color-surface-elevated) p-6 overflow-hidden">
          <div
            className="absolute inset-0 opacity-40 pointer-events-none"
            style={{ background: `radial-gradient(circle at 50% 0%, ${roleFaint} 0%, transparent 60%)` }}
            aria-hidden
          />
          <div className="relative flex flex-col items-center text-center gap-4">
            <HeroPortrait
              src={hero.portraitUrl}
              alt={hero.name}
              role={hero.role}
              size="lg"
              loading="eager"
            />
            <div>
              <span
                className="inline-flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold px-2.5 py-1 rounded"
                style={{ color: roleColor, backgroundColor: roleFaint }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: roleColor }}
                  aria-hidden
                />
                {t.role(hero.role)}
              </span>
              {hero.subrole && (
                <span
                  className="inline-flex items-center text-[10px] font-medium px-2 py-1 ml-2 rounded border border-(--color-border) text-(--color-text-muted)"
                  title={t.subrolePassive(hero.subrole)}
                >
                  {t.subrole(hero.subrole)}
                </span>
              )}
              <h1 className="text-2xl font-extrabold tracking-tight mt-3 text-(--color-text-strong)">{hero.name}</h1>
              <p className="text-[11px] text-(--color-text-faint) mt-1 font-mono uppercase tracking-wider">
                {hero.codename}
              </p>
            </div>
          </div>
        </div>

        {hero.subrole && (
          <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4 space-y-2">
            <p className="text-xs text-(--color-text-muted)">
              <span className="font-semibold text-(--color-text)">
                {t.hero.subPassive} · {t.subrole(hero.subrole)}
              </span>
              {' — '}
              {t.subrolePassive(hero.subrole)}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
              {t.subroleStats(hero.subrole).map((stat) => (
                <div
                  key={stat.label}
                  className="contents"
                >
                  <dt className="text-(--color-text-muted)">{stat.label}</dt>
                  <dd className="font-mono">{stat.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {hero.description && <p className="text-sm text-(--color-text-muted) leading-relaxed">{hero.description}</p>}

        {hero.stat && (
          <div className="space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-muted)">
              {t.hero.stats}
            </div>
            <dl className="grid grid-cols-2 gap-2">
              <StatBox
                label={t.hero.statLabels.health}
                value={hero.stat.health}
              />
              <StatBox
                label={t.hero.statLabels.armor}
                value={hero.stat.armor}
              />
              <StatBox
                label={t.hero.statLabels.shield}
                value={hero.stat.shield}
              />
              <StatBox
                label={t.hero.statLabels.moveSpeed}
                value={hero.stat.moveSpeed}
              />
            </dl>
          </div>
        )}

        <div className="space-y-1.5 text-xs text-(--color-text-muted) pt-2 border-t border-(--color-border)">
          <div className="flex justify-between">
            <span>{t.hero.release}</span>
            <span className="font-mono text-(--color-text)">{t.date(hero.releasedAt)}</span>
          </div>
          {hero.sourceUrl && (
            <div className="pt-2">
              <a
                href={hero.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-(--color-accent) hover:text-(--color-accent-hover) underline decoration-dotted underline-offset-2"
              >
                {t.common.source} →
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Right — abilities + patch history */}
      <div className="min-w-0 space-y-12">
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-(--color-text-strong)">{t.hero.abilities}</h2>
            <span className="text-xs text-(--color-text-faint) font-mono">{hero.abilities.length}</span>
          </div>
          <ul className="space-y-3">
            {hero.abilities.map((ability) => {
              const slotColor = `var(${slotColorVar(ability.slot)})`;
              return (
                <li
                  key={ability.id}
                  className="relative p-4 rounded-lg border border-(--color-border) bg-(--color-surface) overflow-hidden"
                >
                  <span
                    className="absolute top-0 left-0 h-full w-1"
                    style={{ background: slotColor }}
                    aria-hidden
                  />
                  <div className="pl-2">
                    <div className="flex items-baseline gap-3">
                      <span
                        className="text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
                        style={{
                          color: slotColor,
                          backgroundColor: `color-mix(in srgb, ${slotColor} 12%, transparent)`,
                        }}
                      >
                        {t.slot(ability.slot)}
                      </span>
                      {ability.key && (
                        <span className="text-[11px] text-(--color-text-faint) font-mono">{ability.key}</span>
                      )}
                    </div>
                    <div className="font-bold text-base mt-1.5 text-(--color-text-strong)">{ability.name}</div>
                    <p className="text-sm text-(--color-text-muted) mt-1.5 whitespace-pre-line leading-relaxed">
                      {ability.description}
                    </p>
                    {ability.stats && Object.keys(ability.stats).length > 0 && (
                      <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                        {Object.entries(ability.stats).map(([key, value]) => (
                          <div
                            key={key}
                            className="flex items-baseline gap-1.5 py-1 border-b border-(--color-border)"
                          >
                            <dt className="text-(--color-text-muted)">{key}:</dt>
                            <dd className="font-mono">{String(value)}</dd>
                          </div>
                        ))}
                      </dl>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {history.history.length > 0 && (
          <section className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-bold text-(--color-text-strong)">{t.hero.patchHistory}</h2>
              <span className="text-xs text-(--color-text-faint) font-mono">{history.history.length}</span>
            </div>
            <ul className="space-y-4">
              {history.history.map(({ patchNote, entries }) => (
                <li
                  key={patchNote.id}
                  className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <Link
                      href={`/patch-notes/${patchNote.version}`}
                      className="font-bold hover:text-(--color-accent-hover) text-(--color-text-strong)"
                    >
                      <span className="text-(--color-accent) font-mono text-sm mr-2">{patchNote.version}</span>
                      {patchNote.title}
                    </Link>
                    <span className="text-[11px] text-(--color-text-faint) font-mono shrink-0">
                      {t.date(patchNote.releasedAt)}
                    </span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {entries.map((entry) => {
                      const catColor = `var(${categoryColorVar(entry.category)})`;
                      return (
                        <li
                          key={entry.id}
                          className="text-sm"
                        >
                          <span
                            className="inline-block text-[10px] uppercase tracking-wider mr-2 px-1.5 py-0.5 rounded font-bold align-middle"
                            style={{
                              color: catColor,
                              backgroundColor: `color-mix(in srgb, ${catColor} 12%, transparent)`,
                            }}
                          >
                            {t.category(entry.category)}
                          </span>
                          <span className="font-semibold align-middle text-(--color-text-strong)">{entry.title}</span>
                          <p className="text-(--color-text-muted) text-sm mt-1 whitespace-pre-line leading-relaxed">
                            {entry.body}
                          </p>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </article>
  );
}

function StatBox({ label, value }: { label: string; value: number }) {
  return (
    <div className="px-3 py-2.5 rounded-lg border border-(--color-border) bg-(--color-surface)">
      <div className="text-[10px] text-(--color-text-muted)">{label}</div>
      <div className="text-base font-bold mt-0.5 font-mono text-(--color-text-strong)">{value}</div>
    </div>
  );
}
