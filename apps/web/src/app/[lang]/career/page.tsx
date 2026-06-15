import type { Metadata } from 'next';
import Link from 'next/link';

import { ApiError, getCareerSearch } from '@/lib/api';
import { resolveLang } from '@/lib/i18n';
import { getLabels, type Labels } from '@/lib/labels';

import { CareerSearchForm } from './career-search-form';
import { PlayerSearchCard } from './player-search-card';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ q?: string }>;
}

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);

  return {
    title: `${t.career.title} (${t.career.betaLabel})`,
    description: t.career.description,
    alternates: {
      canonical: `/${lang}/career`,
      languages: { ko: '/ko/career', en: '/en/career', 'x-default': '/ko/career' },
    },
    robots: { index: false, follow: true },
  };
};

export default async function CareerSearchPage({ params, searchParams }: Props) {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);
  const { q: rawQ } = await searchParams;
  const q = rawQ?.trim() ?? '';

  return (
    <div className="space-y-8">
      <header className="border-b border-(--color-border) pb-5">
        <div className="flex items-center gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-(--color-text-muted)">Career</p>
          <BetaBadge t={t} />
        </div>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-(--color-text-strong)">{t.career.title}</h1>
        <p className="mt-1.5 text-xs text-(--color-text-muted)">{t.career.description}</p>
      </header>

      <CareerSearchForm
        initialQ={q}
        placeholder={t.career.searchPlaceholder}
        help={t.career.searchHelp}
        submitLabel={t.career.searchSubmit}
      />

      {q.length > 0 ? (
        <SearchResults
          q={q}
          lang={lang}
          t={t}
        />
      ) : (
        <EmptyState t={t} />
      )}

      <PrivacyGuide t={t} />
      <Disclaimer t={t} />
    </div>
  );
}

function BetaBadge({ t }: { t: Labels }) {
  return (
    <span
      className="rounded-md border border-(--color-accent) px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-(--color-accent)"
      title={t.career.betaTooltip}
    >
      {t.career.betaLabel}
    </span>
  );
}

async function SearchResults({ q, lang, t }: { q: string; lang: import('@@shared').Locale; t: Labels }) {
  try {
    const result = await getCareerSearch(q);

    if (result.results.length === 0) {
      return (
        <section className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) p-6 text-center">
          <p className="text-sm text-(--color-text-muted)">{t.career.noResults(q)}</p>
        </section>
      );
    }

    return (
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted)">
          {t.career.resultsHeading(result.total)}
        </h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {result.results.map((player) => (
            <li key={player.playerId}>
              <PlayerSearchCard
                player={player}
                lang={lang}
                t={t}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  } catch (error) {
    if (error instanceof ApiError && (error.status === 502 || error.status === 429)) {
      return <UpstreamError t={t} />;
    }

    throw error;
  }
}

function EmptyState({ t }: { t: Labels }) {
  return (
    <section className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) p-6 text-center">
      <p className="text-sm text-(--color-text-muted)">{t.career.searchEmpty}</p>
    </section>
  );
}

function UpstreamError({ t }: { t: Labels }) {
  return (
    <section
      className="rounded-lg border border-(--color-border-strong) bg-(--color-surface-elevated) p-6"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-muted)">
        {t.career.upstreamError.kicker}
      </p>
      <h2 className="mt-1 text-base font-bold text-(--color-text-strong)">{t.career.upstreamError.heading}</h2>
      <p className="mt-2 text-sm text-(--color-text-muted)">{t.career.upstreamError.body}</p>
    </section>
  );
}

function PrivacyGuide({ t }: { t: Labels }) {
  return (
    <section className="rounded-lg border border-(--color-border) bg-(--color-surface) p-5">
      <h2 className="text-sm font-bold text-(--color-text-strong)">{t.career.privacyGuide.heading}</h2>
      <p className="mt-2 text-xs leading-relaxed text-(--color-text-muted)">{t.career.privacyGuide.body}</p>
      <ol className="mt-3 list-decimal space-y-1 pl-5 text-xs text-(--color-text-muted)">
        {t.career.privacyGuide.steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
      <Link
        href={t.career.privacyGuide.blizzardLinkHref as never}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 inline-block text-xs font-semibold text-(--color-accent) hover:text-(--color-accent-hover)"
      >
        {t.career.privacyGuide.blizzardLinkLabel}
      </Link>
    </section>
  );
}

function Disclaimer({ t }: { t: Labels }) {
  return (
    <p className="border-t border-(--color-border) pt-4 text-[11px] leading-relaxed text-(--color-text-faint)">
      {t.career.disclaimer}
    </p>
  );
}
