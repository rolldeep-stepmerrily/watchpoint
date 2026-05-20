import type { HeroDetailDto, HeroPatchHistoryDto } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HeroPortrait } from '@/components/hero-portrait';
import { getHero, getHeroPatchHistory } from '@/lib/api';
import { categoryColorVar, categoryLabel, formatDate, roleColorVar, roleLabel, slotLabel } from '@/lib/format';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 300;

interface Props {
  params: Promise<{ codename: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { codename } = await params;
  try {
    const hero = await getHero(codename);
    const title = `${hero.name} · ${roleLabel(hero.role)}`;
    const description = hero.description ?? `오버워치 영웅 ${hero.name}의 능력 수치와 패치 이력.`;
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
    return { title: '영웅을 찾을 수 없음' };
  }
}

export default async function HeroDetailPage({ params }: Props) {
  const { codename } = await params;

  let hero: HeroDetailDto;
  let history: HeroPatchHistoryDto;
  try {
    [hero, history] = await Promise.all([getHero(codename), getHeroPatchHistory(codename)]);
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
          <span
            className="inline-flex items-center gap-2 text-xs uppercase tracking-widest font-semibold px-2 py-1 rounded border"
            style={{ color: roleColor, borderColor: roleColor }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: roleColor }}
              aria-hidden
            />
            {roleLabel(hero.role)}
          </span>
          <h1 className="text-3xl font-semibold tracking-tight">{hero.name}</h1>
          {hero.description && (
            <p className="text-(--color-text-muted) max-w-2xl leading-relaxed">{hero.description}</p>
          )}
          <p className="text-xs text-(--color-text-muted)">출시: {formatDate(hero.releasedAt)}</p>
        </div>
      </header>

      {hero.stat && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">기본 스탯</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: '생명력', value: hero.stat.health },
              { label: '방어력', value: hero.stat.armor },
              { label: '보호막', value: hero.stat.shield },
              { label: '이동 속도', value: hero.stat.moveSpeed },
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
        <h2 className="text-lg font-semibold">능력</h2>
        <ul className="space-y-3">
          {hero.abilities.map((ability) => (
            <li
              key={ability.id}
              className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
            >
              <div className="flex items-baseline gap-3">
                <span className="text-xs uppercase tracking-widest text-(--color-accent)">
                  {slotLabel(ability.slot)}
                </span>
                {ability.key && <span className="text-xs text-(--color-text-muted) font-mono">{ability.key}</span>}
              </div>
              <div className="font-semibold mt-1">{ability.name}</div>
              <p className="text-sm text-(--color-text-muted) mt-1 whitespace-pre-line">{ability.description}</p>
              {ability.stats && Object.keys(ability.stats).length > 0 && (
                <dl className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                  {Object.entries(ability.stats).map(([key, value]) => (
                    <div
                      key={key}
                      className="flex justify-between gap-2 py-1 border-b border-(--color-border)"
                    >
                      <dt className="text-(--color-text-muted)">{key}</dt>
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
          <h2 className="text-lg font-semibold">패치 이력</h2>
          <ul className="space-y-4">
            {history.history.map(({ patchNote, entries }) => (
              <li
                key={patchNote.id}
                className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <a
                    href={`/patch-notes/${patchNote.version}`}
                    className="font-semibold hover:text-(--color-accent-hover)"
                  >
                    {patchNote.version} · {patchNote.title}
                  </a>
                  <span className="text-xs text-(--color-text-muted)">{formatDate(patchNote.releasedAt)}</span>
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
                          {categoryLabel(entry.category)}
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
          출처:{' '}
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
