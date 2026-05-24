import type { HeroDetailDto, HeroPatchHistoryDto } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { HeroPortrait } from '@/components/hero-portrait';
import { getHero, getHeroPatchHistory } from '@/lib/api';
import { categoryColorVar, roleColorVar } from '@/lib/format';
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

  return (
    <article className="space-y-12">
      <header className="flex items-start gap-6">
        <HeroPortrait
          src={hero.portraitUrl}
          alt={hero.name}
          role={hero.role}
          size="lg"
          loading="eager"
        />
        <div className="space-y-3 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold px-2 py-1 rounded border"
              style={{ color: roleColor, borderColor: roleColor }}
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
                className="inline-flex items-center text-xs font-medium px-2 py-1 rounded border border-(--color-border) text-(--color-text-muted)"
                title={t.subrolePassive(hero.subrole)}
              >
                {t.subrole(hero.subrole)}
              </span>
            )}
          </div>
          <h1 className="text-3xl font-semibold tracking-tight">{hero.name}</h1>
          {hero.subrole && (
            <div className="space-y-2 max-w-2xl">
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
          {hero.description && (
            <p className="text-(--color-text-muted) max-w-2xl leading-relaxed">{hero.description}</p>
          )}
          <p className="text-xs text-(--color-text-muted)">
            {t.hero.release}: {t.date(hero.releasedAt)}
          </p>
        </div>
      </header>

      {hero.stat && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t.hero.stats}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: t.hero.statLabels.health, value: hero.stat.health },
              { label: t.hero.statLabels.armor, value: hero.stat.armor },
              { label: t.hero.statLabels.shield, value: hero.stat.shield },
              { label: t.hero.statLabels.moveSpeed, value: hero.stat.moveSpeed },
            ].map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
              >
                <div className="text-xs text-(--color-text-muted)">{stat.label}</div>
                <div className="text-xl font-semibold mt-1">{stat.value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">{t.hero.abilities}</h2>
        <ul className="space-y-3">
          {hero.abilities.map((ability) => (
            <li
              key={ability.id}
              className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xs uppercase tracking-widest text-(--color-accent)">{t.slot(ability.slot)}</span>
                {ability.key && <span className="text-xs text-(--color-text-muted) font-mono">{ability.key}</span>}
              </div>
              <div className="font-semibold mt-1">{ability.name}</div>
              <p className="text-sm text-(--color-text-muted) mt-1 whitespace-pre-line">{ability.description}</p>
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
            </li>
          ))}
        </ul>
      </section>

      {history.history.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">{t.hero.patchHistory}</h2>
          <ul className="space-y-4">
            {history.history.map(({ patchNote, entries }) => (
              <li
                key={patchNote.id}
                className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <Link
                    href={`/patch-notes/${patchNote.version}`}
                    className="font-semibold hover:text-(--color-accent-hover)"
                  >
                    {patchNote.version} · {patchNote.title}
                  </Link>
                  <span className="text-xs text-(--color-text-muted)">{t.date(patchNote.releasedAt)}</span>
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
                          className="inline-block text-[10px] uppercase tracking-wider mr-2 px-1.5 py-0.5 rounded border align-middle"
                          style={{ color: catColor, borderColor: catColor }}
                        >
                          {t.category(entry.category)}
                        </span>
                        <span className="font-medium align-middle">{entry.title}</span>
                        <p className="text-(--color-text-muted) text-sm mt-1 whitespace-pre-line">{entry.body}</p>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </section>
      )}

      {hero.sourceUrl && (
        <p className="text-xs text-(--color-text-muted)">
          {t.common.source}:{' '}
          <a
            href={hero.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            {hero.sourceUrl}
          </a>
        </p>
      )}
    </article>
  );
}
