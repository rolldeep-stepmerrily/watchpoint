import type { HeroRole, HeroSummaryDto, Locale, PatchNoteDetailDto, PatchNoteSummaryDto } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';

import { HeroCard } from '@/components/hero-card';
import { HeroPortrait } from '@/components/hero-portrait';
import { JsonLd } from '@/components/json-ld';
import { getHeroList, getPatchNote, getPatchNoteList } from '@/lib/api';
import { ROLE_ORDER, roleColorVar } from '@/lib/format';
import { resolveLang } from '@/lib/i18n';
import { getLabels, type Labels } from '@/lib/labels';
import { buildWebSiteJsonLd, SITE_NAME } from '@/lib/seo';

export const revalidate = 3600;

interface Props {
  params: Promise<{ lang: string }>;
}

/**
 * 홈 페이지 메타데이터 — 사이트명을 title로 단독 노출(레이아웃 template 미적용), 설명은 locale별.
 * 한국어 locale에서는 title에만 '감시기지 Watchpoint' 별칭 prefix를 노출.
 */
export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);
  const titleSite = lang === 'ko' ? `감시기지 ${SITE_NAME}` : SITE_NAME;

  return {
    title: { absolute: `${titleSite} — ${t.site.description}` },
    description: t.home.description,
    alternates: {
      canonical: `/${lang}`,
      languages: { ko: '/ko', en: '/en', 'x-default': '/ko' },
    },
    openGraph: { title: SITE_NAME, description: t.home.description, url: `/${lang}` },
  };
};

export default async function HomePage({ params }: Props) {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);

  const [patches, heroes] = await Promise.all([
    getPatchNoteList({ pageSize: 6, lang }),
    getHeroList({ pageSize: 100, lang }),
  ]);

  const [spotlight, ...recent] = patches.items;
  const spotlightDetail = spotlight ? await getPatchNote(spotlight.version, lang).catch(() => null) : null;
  const changedHeroes = spotlightDetail ? selectChangedHeroes(spotlightDetail, heroes.items) : [];
  const heroesByRole = groupHeroesByRole(heroes.items);

  return (
    <div className="space-y-20">
      <JsonLd data={buildWebSiteJsonLd(t.site.description, lang === 'ja' ? 'en' : lang)} />

      <HeroBanner
        t={t}
        lang={lang}
      />

      {spotlight ? (
        <PatchSpotlight
          patch={spotlight}
          changedHeroes={changedHeroes}
          lang={lang}
          t={t}
        />
      ) : null}

      <RoleGrid
        heroesByRole={heroesByRole}
        lang={lang}
        t={t}
      />

      {recent.length > 0 ? (
        <RecentPatches
          patches={recent}
          lang={lang}
          t={t}
        />
      ) : null}

      <StatsStrip
        heroesTotal={heroes.total}
        patchesTotal={patches.total}
        t={t}
      />
    </div>
  );
}

function HeroBanner({ t, lang }: { t: Labels; lang: Locale }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-elevated) px-8 py-12 sm:px-12 sm:py-16"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(circle at 0% 0%, var(--color-accent-faint) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(74, 76, 78, 0.06) 0%, transparent 45%)',
        }}
        aria-hidden
      />
      <div className="relative max-w-2xl space-y-5">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-(--color-accent) sm:text-xs">
          {t.site.tagline}
        </p>
        <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-(--color-text-strong) sm:text-5xl">
          {t.site.name}
        </h1>
        <p className="max-w-xl text-sm leading-relaxed text-(--color-text-muted) sm:text-base">{t.home.description}</p>
        <div className="flex flex-wrap gap-3 pt-1">
          <Link
            href={`/${lang}/heroes` as never}
            className="rounded-md bg-(--color-accent) px-5 py-2.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-(--color-accent-hover) hover:shadow-lg"
            style={{ boxShadow: '0 2px 8px rgba(250, 156, 29, 0.25)' }}
          >
            {t.home.heroesHeading}
          </Link>
          <Link
            href={`/${lang}/patch-notes` as never}
            className="rounded-md border border-(--color-border-strong) px-5 py-2.5 text-sm font-semibold text-(--color-text) transition-all hover:-translate-y-0.5 hover:border-(--color-accent) hover:text-(--color-accent)"
          >
            {t.home.patchNotesHeading}
          </Link>
        </div>
      </div>
    </section>
  );
}

function PatchSpotlight({
  patch,
  changedHeroes,
  lang,
  t,
}: {
  patch: PatchNoteSummaryDto;
  changedHeroes: HeroSummaryDto[];
  lang: Locale;
  t: Labels;
}) {
  return (
    <section className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
          {t.home.spotlight.kicker}
        </h2>
        <Link
          href={`/${lang}/patch-notes` as never}
          className="text-xs text-(--color-text-muted) hover:text-(--color-accent-hover)"
        >
          {t.home.viewAll}
        </Link>
      </div>

      <article
        className="overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-elevated)"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <Link
          href={`/${lang}/patch-notes/${patch.version}` as never}
          className="hover-lift group relative block overflow-hidden px-6 py-8 sm:px-10 sm:py-10"
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-80"
            style={{
              backgroundImage:
                'linear-gradient(135deg, var(--color-accent-faint) 0%, transparent 55%), radial-gradient(circle at 100% 0%, rgba(74, 76, 78, 0.05) 0%, transparent 50%)',
            }}
            aria-hidden
          />
          <div className="relative space-y-4">
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-2xl font-bold text-(--color-accent) sm:text-3xl">{patch.version}</span>
              <span className="font-mono text-xs text-(--color-text-faint)">{t.date(patch.releasedAt)}</span>
            </div>
            <h3 className="text-2xl font-extrabold leading-snug tracking-tight text-(--color-text-strong) sm:text-3xl group-hover:text-(--color-accent-hover)">
              {patch.title}
            </h3>
            {patch.summary ? (
              <p className="max-w-3xl text-sm leading-relaxed text-(--color-text-muted) sm:text-base line-clamp-3">
                {patch.summary}
              </p>
            ) : null}
            <p className="pt-1 text-xs font-semibold text-(--color-text-muted) group-hover:text-(--color-accent-hover)">
              {t.home.spotlight.viewPatch}
            </p>
          </div>
        </Link>

        <div className="border-t border-(--color-border) bg-(--color-surface) px-6 py-5 sm:px-10">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted)">
            {changedHeroes.length > 0 ? t.home.spotlight.changedHeroes : t.home.spotlight.noChangedHeroes}
          </p>
          {changedHeroes.length > 0 ? (
            <ul className="mt-4 flex flex-wrap gap-3">
              {changedHeroes.slice(0, 10).map((hero) => (
                <li key={hero.id}>
                  <HeroAvatar
                    hero={hero}
                    lang={lang}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </article>
    </section>
  );
}

function HeroAvatar({ hero, lang }: { hero: HeroSummaryDto; lang: Locale }) {
  return (
    <Link
      href={`/${lang}/heroes/${hero.codename}` as never}
      className="group flex flex-col items-center gap-1.5"
    >
      <HeroPortrait
        src={hero.portraitUrl}
        alt={hero.name}
        role={hero.role}
        size="md"
      />
      <span className="text-[11px] font-semibold text-(--color-text-muted) group-hover:text-(--color-accent-hover)">
        {hero.name}
      </span>
    </Link>
  );
}

function RoleGrid({
  heroesByRole,
  lang,
  t,
}: {
  heroesByRole: Record<HeroRole, HeroSummaryDto[]>;
  lang: Locale;
  t: Labels;
}) {
  return (
    <section className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
          {t.home.rolesHeading}
        </h2>
        <p className="text-xs text-(--color-text-faint)">{t.home.rolesSubtitle}</p>
      </div>

      <div className="space-y-8">
        {ROLE_ORDER.map((role) => {
          const list = heroesByRole[role];

          if (list.length === 0) {
            return null;
          }

          return (
            <RoleRow
              key={role}
              role={role}
              heroes={list}
              lang={lang}
              t={t}
            />
          );
        })}
      </div>
    </section>
  );
}

function RoleRow({ role, heroes, lang, t }: { role: HeroRole; heroes: HeroSummaryDto[]; lang: Locale; t: Labels }) {
  const colorVar = `var(${roleColorVar(role)})`;

  return (
    <div>
      <div className="mb-3 flex items-baseline gap-3">
        <span
          className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-widest"
          style={{ color: colorVar }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: colorVar }}
            aria-hidden
          />
          {t.role(role)}
        </span>
        <span className="text-xs text-(--color-text-faint)">({heroes.length})</span>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {heroes.map((hero, i) => (
          <HeroCard
            key={hero.id}
            hero={hero}
            locale={lang}
            priority={i < 3}
          />
        ))}
      </div>
    </div>
  );
}

function RecentPatches({ patches, lang, t }: { patches: PatchNoteSummaryDto[]; lang: Locale; t: Labels }) {
  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
          {t.home.latestPatches}
        </h2>
        <Link
          href={`/${lang}/patch-notes` as never}
          className="text-xs text-(--color-text-muted) hover:text-(--color-accent-hover)"
        >
          {t.home.viewAll}
        </Link>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {patches.map((patch) => (
          <li key={patch.id}>
            <Link
              href={`/${lang}/patch-notes/${patch.version}` as never}
              className="hover-lift block h-full rounded-lg border border-(--color-border) bg-(--color-surface) p-4 hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"
            >
              <div className="flex items-baseline justify-between gap-3">
                <span className="font-mono text-sm font-semibold text-(--color-accent)">{patch.version}</span>
                <span className="font-mono text-[11px] text-(--color-text-faint)">{t.date(patch.releasedAt)}</span>
              </div>
              <h3 className="mt-2 text-sm font-semibold text-(--color-text-strong)">{patch.title}</h3>
              {patch.summary ? (
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-(--color-text-muted)">{patch.summary}</p>
              ) : null}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function StatsStrip({ heroesTotal, patchesTotal, t }: { heroesTotal: number; patchesTotal: number; t: Labels }) {
  return (
    <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <StatCard
        label={t.home.stats.heroesLabel}
        value={String(heroesTotal)}
      />
      <StatCard
        label={t.home.stats.patchesLabel}
        value={String(patchesTotal)}
      />
      <StatCard
        label={t.home.stats.cronLabel}
        value="6h"
        sub={t.home.stats.cronSub}
      />
      <StatCard
        label={t.home.stats.sourceLabel}
        value="Blizzard"
        sub={t.home.stats.sourceSub}
      />
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface) px-4 py-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-muted)">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold text-(--color-text-strong)">{value}</span>
        {sub ? <span className="text-[10px] text-(--color-text-faint)">{sub}</span> : null}
      </div>
    </div>
  );
}

/**
 * 패치 detail의 HERO_BALANCE entries에서 heroId 집합을 추출해 영웅 요약 객체 배열로 변환.
 * order: entry.order(asc) → role 기본 순서 → 영웅명. 중복 제거.
 */
function selectChangedHeroes(detail: PatchNoteDetailDto, heroes: HeroSummaryDto[]): HeroSummaryDto[] {
  const heroById = new Map(heroes.map((h) => [h.id, h]));
  const seen = new Set<number>();
  const ordered: HeroSummaryDto[] = [];

  for (const entry of detail.entries) {
    if (entry.heroId === null || seen.has(entry.heroId)) {
      continue;
    }

    const hero = heroById.get(entry.heroId);

    if (hero) {
      seen.add(entry.heroId);
      ordered.push(hero);
    }
  }

  return ordered;
}

function groupHeroesByRole(heroes: HeroSummaryDto[]): Record<HeroRole, HeroSummaryDto[]> {
  const groups: Record<HeroRole, HeroSummaryDto[]> = { TANK: [], DAMAGE: [], SUPPORT: [] };

  for (const hero of heroes) {
    groups[hero.role].push(hero);
  }

  for (const role of ROLE_ORDER) {
    groups[role].sort((a, b) => a.name.localeCompare(b.name));
  }

  return groups;
}
