import type { HeroDetailDto, HeroPatchHistoryDto } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HeroPortrait } from '@/components/hero-portrait';
import { getHero, getHeroPatchHistory } from '@/lib/api';
import { roleColorVar } from '@/lib/format';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { absoluteUrl } from '@/lib/seo';

import { HeroDetailTabs } from './hero-detail-tabs';

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

  return (
    <article className="space-y-8">
      <HeroBanner
        hero={hero}
        t={t}
      />

      <HeroDetailTabs
        hero={hero}
        history={history}
        t={t}
      />
    </article>
  );
}

function HeroBanner({ hero, t }: { hero: HeroDetailDto; t: ReturnType<typeof getLabels> }) {
  const roleColor = `var(${roleColorVar(hero.role)})`;
  const roleFaint = `var(${roleColorVar(hero.role)}-faint)`;

  return (
    <header
      className="relative overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface-elevated)"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `linear-gradient(135deg, ${roleFaint} 0%, transparent 55%)` }}
        aria-hidden
      />
      <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-center md:p-8">
        <HeroPortrait
          src={hero.portraitUrl}
          alt={hero.name}
          role={hero.role}
          size="lg"
          loading="eager"
        />

        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
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
            <span
              className="inline-flex items-center text-[10px] font-medium px-2 py-1 rounded border border-(--color-border) text-(--color-text-muted)"
              title={t.subrolePassive(hero.subrole)}
            >
              {t.subrole(hero.subrole)}
            </span>
            <span className="text-[10px] text-(--color-text-faint) font-mono uppercase tracking-wider ml-auto">
              {t.hero.release} · {t.date(hero.releasedAt)}
            </span>
          </div>

          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-(--color-text-strong)">
              {hero.name}
            </h1>
            <p className="text-[11px] text-(--color-text-faint) mt-1 font-mono uppercase tracking-wider">
              {hero.codename}
            </p>
          </div>

          {hero.description && (
            <p className="text-sm text-(--color-text-muted) leading-relaxed max-w-2xl">{hero.description}</p>
          )}

          {hero.stat && (
            <dl className="flex flex-wrap gap-x-6 gap-y-2 pt-1">
              <StatInline
                label={t.hero.statLabels.health}
                value={hero.stat.health}
              />
              <StatInline
                label={t.hero.statLabels.armor}
                value={hero.stat.armor}
              />
              <StatInline
                label={t.hero.statLabels.shield}
                value={hero.stat.shield}
              />
              <StatInline
                label={t.hero.statLabels.moveSpeed}
                value={hero.stat.moveSpeed}
              />
            </dl>
          )}
        </div>
      </div>

      <div
        className="relative border-t border-(--color-border) bg-(--color-surface) px-6 py-3 md:px-8"
        style={{ borderLeftWidth: 3, borderLeftColor: roleColor }}
      >
        <p className="text-xs text-(--color-text-muted) leading-relaxed">
          <span
            className="font-semibold text-(--color-text)"
            style={{ color: roleColor }}
          >
            {t.hero.subPassive} · {t.subrole(hero.subrole)}
          </span>
          <span className="text-(--color-text-faint)"> — </span>
          {t.subrolePassive(hero.subrole)}
        </p>
        <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-(--color-text-muted)">
          {t.subroleStats(hero.subrole).map((stat) => (
            <div
              key={stat.label}
              className="flex items-baseline gap-1.5"
            >
              <dt>{stat.label}:</dt>
              <dd className="font-mono text-(--color-text)">{stat.value}</dd>
            </div>
          ))}
        </dl>
        {hero.sourceUrl && (
          <a
            href={hero.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-6 text-[11px] text-(--color-accent) hover:text-(--color-accent-hover) font-mono underline decoration-dotted underline-offset-2"
          >
            {t.common.source} →
          </a>
        )}
      </div>
    </header>
  );
}

function StatInline({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-[10px] uppercase tracking-widest text-(--color-text-muted)">{label}</dt>
      <dd className="text-lg font-bold font-mono text-(--color-text-strong)">{value}</dd>
    </div>
  );
}
