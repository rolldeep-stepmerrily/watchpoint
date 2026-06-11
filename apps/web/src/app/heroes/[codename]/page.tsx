import type { HeroDetailDto, HeroPatchHistoryDto } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { HeroPortrait } from '@/components/hero-portrait';
import { JsonLd } from '@/components/json-ld';
import { getHero, getHeroPatchHistory } from '@/lib/api';
import { roleColorVar } from '@/lib/format';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { absoluteUrl, buildBreadcrumbJsonLd, buildHeroPageJsonLd, SITE_NAME } from '@/lib/seo';

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

  const heroUrl = absoluteUrl(`/heroes/${hero.codename}`);
  const heroDescription = hero.description ?? t.hero.descriptionFallback(hero.name);
  const heroPageJsonLd = buildHeroPageJsonLd({
    name: hero.name,
    description: heroDescription,
    url: heroUrl,
    image: hero.portraitUrl ?? undefined,
  });
  const breadcrumb = buildBreadcrumbJsonLd([
    { name: SITE_NAME, url: absoluteUrl('/') },
    { name: t.heroes.title, url: absoluteUrl('/heroes') },
    { name: hero.name, url: heroUrl },
  ]);

  return (
    <article className="space-y-8">
      <JsonLd data={[heroPageJsonLd, breadcrumb]} />
      <HeroBanner
        hero={hero}
        t={t}
      />

      <HeroDetailTabs
        hero={hero}
        history={history}
        locale={lang}
      />
    </article>
  );
}

function HeroBanner({ hero, t }: { hero: HeroDetailDto; t: ReturnType<typeof getLabels> }) {
  const roleColor = `var(${roleColorVar(hero.role)})`;
  const roleFaint = `var(${roleColorVar(hero.role)}-faint)`;

  return (
    <header
      className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-elevated)"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: roleColor }}
        aria-hidden
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(circle at top right, ${roleFaint} 0%, transparent 60%), linear-gradient(135deg, ${roleFaint} 0%, transparent 50%)`,
        }}
        aria-hidden
      />

      <div className="relative grid gap-6 p-6 md:grid-cols-[auto_1fr] md:items-end md:gap-8 md:p-10">
        <div
          className="relative shrink-0 self-start overflow-hidden rounded-xl border-2"
          style={{ borderColor: roleColor, boxShadow: `0 8px 24px ${roleFaint}` }}
        >
          <HeroPortrait
            src={hero.portraitUrl}
            alt={hero.name}
            role={hero.role}
            size="xl"
            loading="eager"
          />
        </div>

        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest"
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
              className="inline-flex items-center rounded-md border border-(--color-border) bg-(--color-surface) px-2 py-1 text-[10px] font-medium text-(--color-text-muted)"
              title={t.subrolePassive(hero.subrole)}
            >
              {t.subrole(hero.subrole)}
            </span>
            <span className="ml-auto font-mono text-[10px] uppercase tracking-wider text-(--color-text-faint)">
              {t.hero.release} · {t.date(hero.releasedAt)}
            </span>
          </div>

          <div>
            <h1 className="text-4xl font-black leading-none tracking-tight text-(--color-text-strong) md:text-6xl">
              {hero.name}
            </h1>
            <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-(--color-text-faint)">
              {hero.codename}
            </p>
          </div>

          {hero.description && (
            <p className="max-w-2xl text-sm leading-relaxed text-(--color-text-muted) md:text-base">
              {hero.description}
            </p>
          )}

          {hero.stat && (
            <dl className="flex flex-wrap gap-x-3 gap-y-2 pt-2">
              <StatChip
                label={t.hero.statLabels.health}
                value={hero.stat.health}
              />
              <StatChip
                label={t.hero.statLabels.armor}
                value={hero.stat.armor}
              />
              <StatChip
                label={t.hero.statLabels.shield}
                value={hero.stat.shield}
              />
              <StatChip
                label={t.hero.statLabels.moveSpeed}
                value={hero.stat.moveSpeed}
              />
            </dl>
          )}
        </div>
      </div>

      <div
        className="relative border-t border-(--color-border) bg-(--color-surface) px-6 py-3 md:px-10"
        style={{ borderLeftWidth: 3, borderLeftColor: roleColor }}
      >
        <p className="text-xs leading-relaxed text-(--color-text-muted)">
          <span
            className="font-semibold"
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
            className="absolute top-3 right-6 font-mono text-[11px] text-(--color-accent) underline decoration-dotted underline-offset-2 hover:text-(--color-accent-hover)"
          >
            {t.common.source} →
          </a>
        )}
      </div>
    </header>
  );
}

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div className="inline-flex items-baseline gap-2 rounded-md border border-(--color-border) bg-(--color-surface) px-3 py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-muted)">{label}</dt>
      <dd className="font-mono text-lg font-bold text-(--color-text-strong)">{value}</dd>
    </div>
  );
}
