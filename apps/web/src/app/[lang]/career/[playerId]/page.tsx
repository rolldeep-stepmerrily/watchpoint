import type { CareerPlatformRanksDto, CareerRankDto, CareerSummaryDto, Locale } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ApiError, getCareerSummary } from '@/lib/api';
import { resolveLang } from '@/lib/i18n';
import { getLabels, type Labels } from '@/lib/labels';

// API의 10분 캐시와 동일 — 사용자별 페이지라 dynamicParams=true(기본). 동일 playerId 반복 호출은 ISR로 흡수.
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
    title: `${battleTag} — ${t.career.title}`,
    description: `${battleTag} ${t.career.description}`,
    alternates: { canonical: `/${lang}/career/${playerId}` },
    robots: { index: false, follow: false },
  };
};

export default async function CareerDetailPage({ params }: Props) {
  const { lang: rawLang, playerId } = await params;
  const lang = resolveLang(rawLang);
  const t = getLabels(lang);

  const summary = await fetchSummary(playerId);

  if (summary === 'not-found') {
    notFound();
  }

  if (summary === 'upstream-error') {
    return (
      <ErrorScreen
        kind="upstream"
        lang={lang}
        t={t}
      />
    );
  }

  if (summary.private) {
    return (
      <ErrorScreen
        kind="private"
        lang={lang}
        t={t}
      />
    );
  }

  return (
    <CareerView
      summary={summary}
      lang={lang}
      t={t}
    />
  );
}

async function fetchSummary(playerId: string): Promise<CareerSummaryDto | 'not-found' | 'upstream-error'> {
  try {
    return await getCareerSummary(playerId);
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

function CareerView({ summary, lang, t }: { summary: CareerSummaryDto; lang: Locale; t: Labels }) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-3">
        <Link
          href={`/${lang}/career` as never}
          className="text-xs font-semibold text-(--color-text-muted) hover:text-(--color-accent-hover)"
        >
          {t.career.detail.backToSearch}
        </Link>
        <Link
          href={`/${lang}/career/${summary.playerId}/stats` as never}
          className="text-xs font-semibold text-(--color-accent) hover:text-(--color-accent-hover)"
        >
          {t.career.stats.viewStats}
        </Link>
      </div>

      <ProfileHeader
        summary={summary}
        t={t}
      />
      <CompetitiveSection
        competitive={summary.competitive}
        t={t}
      />
    </div>
  );
}

function ProfileHeader({ summary, t }: { summary: CareerSummaryDto; t: Labels }) {
  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-elevated)"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {summary.namecard ? (
        <NamecardBackground
          src={summary.namecard}
          alt={summary.name}
        />
      ) : null}
      <div className="relative flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:gap-6 sm:p-8">
        <Avatar
          src={summary.avatar}
          alt={summary.name}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h1 className="text-2xl font-extrabold tracking-tight text-(--color-text-strong) sm:text-3xl">
              {summary.name}
            </h1>
            {summary.title ? (
              <span className="text-xs font-semibold text-(--color-text-muted)">{summary.title}</span>
            ) : null}
          </div>
          <p className="mt-1 font-mono text-xs text-(--color-text-muted)">{summary.battleTag}</p>
          {summary.endorsementLevel !== null ? (
            <p className="mt-2 text-[11px] uppercase tracking-widest text-(--color-text-faint)">
              {t.career.detail.endorsement} ·{' '}
              <span className="text-(--color-text-strong)">{summary.endorsementLevel}</span>
            </p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

function CompetitiveSection({ competitive, t }: { competitive: CareerSummaryDto['competitive']; t: Labels }) {
  return (
    <section className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
        {t.career.detail.competitiveHeading}
      </h2>
      {competitive === null ? (
        <p className="text-sm text-(--color-text-muted)">{t.career.platform.noData}</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <PlatformRanks
            label={t.career.platform.pc}
            ranks={competitive.pc}
            t={t}
          />
          <PlatformRanks
            label={t.career.platform.console}
            ranks={competitive.console}
            t={t}
          />
        </div>
      )}
    </section>
  );
}

function PlatformRanks({ label, ranks, t }: { label: string; ranks: CareerPlatformRanksDto | null; t: Labels }) {
  return (
    <div className="rounded-lg border border-(--color-border) bg-(--color-surface) p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest text-(--color-text-muted)">{label}</h3>
      {ranks === null ? (
        <p className="mt-3 text-xs text-(--color-text-faint)">{t.career.platform.noData}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          <RankRow
            roleKey="tank"
            colorVar="--color-role-tank"
            rank={ranks.tank}
            t={t}
          />
          <RankRow
            roleKey="damage"
            colorVar="--color-role-damage"
            rank={ranks.damage}
            t={t}
          />
          <RankRow
            roleKey="support"
            colorVar="--color-role-support"
            rank={ranks.support}
            t={t}
          />
        </ul>
      )}
    </div>
  );
}

function RankRow({
  roleKey,
  colorVar,
  rank,
  t,
}: {
  roleKey: 'tank' | 'damage' | 'support';
  colorVar: string;
  rank: CareerRankDto | null;
  t: Labels;
}) {
  const roleLabel = t.role(roleKey.toUpperCase() as 'TANK' | 'DAMAGE' | 'SUPPORT');
  const cssVar = `var(${colorVar})`;

  return (
    <li className="flex items-center gap-3">
      <span
        className="inline-flex w-14 items-center gap-1.5 text-xs font-bold uppercase tracking-widest"
        style={{ color: cssVar }}
      >
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ backgroundColor: cssVar }}
          aria-hidden
        />
        {roleLabel}
      </span>
      {rank === null ? (
        <span className="text-xs text-(--color-text-faint)">{t.career.unranked}</span>
      ) : (
        <RankBadge
          rank={rank}
          t={t}
        />
      )}
    </li>
  );
}

function RankBadge({ rank, t }: { rank: CareerRankDto; t: Labels }) {
  const tierLabel = t.career.tierLabels[rank.tier] ?? rank.tier;

  return (
    <span className="flex items-center gap-2">
      {rank.rankIcon ? (
        // biome-ignore lint/performance/noImgElement: 외부 CDN, next/image remotePatterns 회피
        <img
          src={rank.rankIcon}
          alt={tierLabel}
          className="h-6 w-6"
          loading="lazy"
        />
      ) : null}
      <span className="text-sm font-semibold text-(--color-text-strong)">{tierLabel}</span>
      {rank.division !== null ? (
        <span className="text-xs text-(--color-text-muted)">{t.career.division(rank.division)}</span>
      ) : null}
    </span>
  );
}

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  if (src === null) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg) text-2xl font-bold text-(--color-text-muted)"
      >
        {alt.slice(0, 1)}
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: 외부 CDN, next/image remotePatterns 회피
    <img
      src={src}
      alt={alt}
      className="h-20 w-20 shrink-0 rounded-full border border-(--color-border) object-cover"
    />
  );
}

function NamecardBackground({ src, alt }: { src: string; alt: string }) {
  return (
    // biome-ignore lint/performance/noImgElement: 외부 CDN, next/image remotePatterns 회피
    <img
      src={src}
      alt={alt}
      aria-hidden
      className="absolute inset-0 h-full w-full object-cover opacity-25"
    />
  );
}

function ErrorScreen({ kind, lang, t }: { kind: 'private' | 'upstream'; lang: Locale; t: Labels }) {
  const copy = kind === 'private' ? t.career.detail.private : t.career.upstreamError;

  return (
    <div className="space-y-6 py-12 text-center">
      <p className="font-mono text-xs uppercase tracking-[0.3em] text-(--color-text-muted)">{copy.kicker}</p>
      <h1 className="text-2xl font-extrabold text-(--color-text-strong)">{copy.heading}</h1>
      <p className="mx-auto max-w-md text-sm text-(--color-text-muted)">{copy.body}</p>
      <Link
        href={`/${lang}/career` as never}
        className="inline-block rounded-md border border-(--color-border-strong) px-4 py-2 text-sm font-semibold text-(--color-text) hover:border-(--color-accent) hover:text-(--color-accent)"
      >
        {copy.cta}
      </Link>
    </div>
  );
}

function toBattleTag(playerId: string): string {
  return playerId.replace(/-(\d+)$/, '#$1');
}
