import type { CareerStatsBlockDto, CareerStatsDto, CareerStatsRolesDto, Locale } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApiError, getCareerStats, getHeroList } from '@/lib/api';
import { resolveLang } from '@/lib/i18n';
import { getLabels, type Labels } from '@/lib/labels';

import { HeroStatsTable } from './hero-stats-table';

async function loadHeroNameMap(lang: Locale): Promise<Map<string, string>> {
  try {
    const { items } = await getHeroList({ pageSize: 100, lang });
    return new Map(items.map((hero) => [hero.codename, hero.name]));
  } catch {
    /** hero list 실패해도 stats 렌더는 계속 — codename prettify로 fallback */
    return new Map();
  }
}

export const revalidate = 600;

interface Props {
  params: Promise<{ lang: string; playerId: string }>;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const { lang: rawLang, playerId } = await params;
  const lang = resolveLang(rawLang);
  const t = getLabels(lang);
  const battleTag = toBattleTag(playerId);

  return {
    title: `${battleTag} — ${t.career.stats.heading}`,
    description: `${battleTag} ${t.career.stats.heading}`,
    alternates: { canonical: `/${lang}/career/${playerId}/stats` },
    robots: { index: false, follow: false },
  };
};

export default async function CareerStatsPage({ params }: Props) {
  const { lang: rawLang, playerId } = await params;
  const lang = resolveLang(rawLang);
  const t = getLabels(lang);

  const [stats, heroNameMap] = await Promise.all([fetchStats(playerId), loadHeroNameMap(lang)]);

  if (stats === 'not-found') {
    notFound();
  }

  if (stats === 'upstream-error') {
    return (
      <UpstreamErrorScreen
        lang={lang}
        playerId={playerId}
        t={t}
      />
    );
  }

  return (
    <StatsView
      stats={stats}
      lang={lang}
      playerId={playerId}
      t={t}
      heroNameMap={heroNameMap}
    />
  );
}

async function fetchStats(playerId: string): Promise<CareerStatsDto | 'not-found' | 'upstream-error'> {
  try {
    return await getCareerStats(playerId);
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.status === 404 || error.status === 400) {
        return 'not-found';
      }

      if (error.status === 429 || error.status === 502 || error.status === 503) {
        return 'upstream-error';
      }
    }

    throw error;
  }
}

function StatsView({
  stats,
  lang,
  playerId,
  t,
  heroNameMap,
}: {
  stats: CareerStatsDto;
  lang: Locale;
  playerId: string;
  t: Labels;
  heroNameMap: Map<string, string>;
}) {
  const heroesWithNames = stats.heroes.map((hero) => ({
    ...hero,
    displayName: heroNameMap.get(hero.codename) ?? null,
  }));
  const battleTag = toBattleTag(playerId);

  return (
    <div className="space-y-8">
      <Link
        href={`/${lang}/career/${playerId}` as never}
        className="text-xs font-semibold text-(--color-text-muted) hover:text-(--color-accent-hover)"
      >
        {t.career.stats.backToSummary}
      </Link>

      <header className="border-b border-(--color-border) pb-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--color-text-muted)">
          {t.career.stats.heading}
        </p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-(--color-text-strong) sm:text-3xl">
          {battleTag}
        </h1>
      </header>

      {stats.general === null && stats.heroes.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{t.career.stats.noData}</p>
      ) : (
        <>
          {stats.general !== null ? (
            <BlockCard
              heading={t.career.stats.generalHeading}
              block={stats.general}
              t={t}
              accent="--color-accent"
            />
          ) : null}

          <RolesGrid
            roles={stats.roles}
            t={t}
          />

          {stats.heroes.length > 0 ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
                {t.career.stats.heroesHeading}
              </h2>
              <HeroStatsTable
                heroes={heroesWithNames}
                t={t}
              />
            </section>
          ) : null}
        </>
      )}
    </div>
  );
}

function RolesGrid({ roles, t }: { roles: CareerStatsRolesDto; t: Labels }) {
  const entries: Array<{ key: 'tank' | 'damage' | 'support'; colorVar: string; block: CareerStatsBlockDto | null }> = [
    { key: 'tank', colorVar: '--color-role-tank', block: roles.tank },
    { key: 'damage', colorVar: '--color-role-damage', block: roles.damage },
    { key: 'support', colorVar: '--color-role-support', block: roles.support },
  ];

  const hasAny = entries.some((e) => e.block !== null);
  if (!hasAny) {
    return null;
  }

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
        {t.career.stats.rolesHeading}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {entries.map((entry) =>
          entry.block === null ? null : (
            <BlockCard
              key={entry.key}
              heading={t.role(entry.key.toUpperCase() as 'TANK' | 'DAMAGE' | 'SUPPORT')}
              block={entry.block}
              t={t}
              accent={entry.colorVar}
            />
          ),
        )}
      </div>
    </section>
  );
}

function BlockCard({
  heading,
  block,
  t,
  accent,
}: {
  heading: string;
  block: CareerStatsBlockDto;
  t: Labels;
  accent: string;
}) {
  const accentVar = `var(${accent})`;
  const hours = block.timePlayed / 3600;

  return (
    <article
      className="relative overflow-hidden rounded-lg border border-(--color-border) bg-(--color-surface) p-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <span
        className="absolute top-0 left-0 h-full w-1"
        style={{ background: accentVar }}
        aria-hidden
      />
      <div className="pl-2">
        <h3
          className="text-xs font-bold uppercase tracking-widest"
          style={{ color: accentVar }}
        >
          {heading}
        </h3>
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-sm">
          <Stat
            label={t.career.stats.gamesPlayed}
            value={block.gamesPlayed.toLocaleString()}
          />
          <Stat
            label={t.career.stats.winrate}
            value={`${block.winrate.toFixed(1)}%`}
          />
          <Stat
            label={t.career.stats.kda}
            value={block.kda.toFixed(2)}
          />
          <Stat
            label={t.career.stats.timePlayed}
            value={t.career.stats.hoursPlayed(hours)}
          />
        </dl>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-1.5">
      <dt className="text-xs text-(--color-text-muted)">{label}</dt>
      <dd className="font-mono text-sm font-semibold text-(--color-text-strong)">{value}</dd>
    </div>
  );
}

function UpstreamErrorScreen({ lang, playerId, t }: { lang: Locale; playerId: string; t: Labels }) {
  return (
    <div className="space-y-6 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-text-muted)">
        {t.career.upstreamError.kicker}
      </p>
      <h1 className="text-xl font-semibold tracking-tight">{t.career.upstreamError.heading}</h1>
      <p className="mx-auto max-w-md text-sm text-(--color-text-muted) leading-relaxed">
        {t.career.upstreamError.body}
      </p>
      <Link
        href={`/${lang}/career/${playerId}` as never}
        className="inline-block rounded-md border border-(--color-accent) px-4 py-2 text-sm font-semibold text-(--color-accent) hover:bg-(--color-surface-hover)"
      >
        {t.career.stats.backToSummary}
      </Link>
    </div>
  );
}

const PLAYER_ID_BATTLETAG_TAIL = /-(\d+)$/;

function toBattleTag(playerId: string): string {
  return playerId.replace(PLAYER_ID_BATTLETAG_TAIL, '#$1');
}
