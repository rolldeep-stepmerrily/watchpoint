import type { Metadata } from 'next';
import Link from 'next/link';

import { JsonLd } from '@/components/json-ld';
import { getHeroList, getPatchNoteList } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { buildWebSiteJsonLd, SITE_NAME } from '@/lib/seo';

export const revalidate = 3600;

/**
 * 홈 페이지 메타데이터 — 사이트명을 title로 단독 노출(레이아웃 template 미적용), 설명은 locale별
 *
 * @returns {Promise<Metadata>} 홈 전용 메타데이터
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const t = getLabels(await getLocale());

  return {
    title: { absolute: `${SITE_NAME} — ${t.site.description}` },
    description: t.home.description,
    alternates: { canonical: '/' },
    openGraph: {
      title: SITE_NAME,
      description: t.home.description,
      url: '/',
    },
  };
};

export default async function HomePage() {
  const lang = await getLocale();
  const t = getLabels(lang);
  const [patches, heroes] = await Promise.all([
    getPatchNoteList({ pageSize: 4, lang }),
    getHeroList({ pageSize: 1, lang }),
  ]);

  return (
    <div className="space-y-16">
      <JsonLd data={buildWebSiteJsonLd(t.site.description)} />
      {/* Hero section */}
      <section
        className="relative overflow-hidden rounded-2xl border border-(--color-border) bg-(--color-surface-elevated) px-8 py-14 sm:px-12 sm:py-20"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="absolute inset-0 opacity-100 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle at 0% 0%, var(--color-accent-faint) 0%, transparent 45%), radial-gradient(circle at 100% 100%, rgba(74, 76, 78, 0.06) 0%, transparent 45%)',
          }}
          aria-hidden
        />
        <div className="relative space-y-6 max-w-2xl">
          <p className="text-[11px] sm:text-xs text-(--color-accent) font-mono uppercase tracking-[0.3em]">
            {t.site.tagline}
          </p>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-(--color-text-strong) leading-tight">
            {t.site.name}
          </h1>
          <p className="text-(--color-text-muted) leading-relaxed text-sm sm:text-base max-w-xl">
            {t.home.description}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/heroes"
              className="px-5 py-2.5 rounded-md bg-(--color-accent) text-white font-semibold text-sm hover:bg-(--color-accent-hover) hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{ boxShadow: '0 2px 8px rgba(250, 156, 29, 0.25)' }}
            >
              {t.home.heroesHeading} →
            </Link>
            <Link
              href="/patch-notes"
              className="px-5 py-2.5 rounded-md border border-(--color-border-strong) text-(--color-text) font-semibold text-sm hover:border-(--color-accent) hover:text-(--color-accent) hover:-translate-y-0.5 transition-all"
            >
              {t.home.patchNotesHeading}
            </Link>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="등록된 영웅"
          value={String(heroes.total)}
        />
        <StatCard
          label="공개 패치노트"
          value={String(patches.total)}
        />
        <StatCard
          label="자동 수집"
          value="6h"
          sub="cron 주기"
        />
        <StatCard
          label="데이터"
          value="Blizzard"
          sub="공식 출처"
        />
      </section>

      {/* Latest patches */}
      {patches.items.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
              {t.home.latestPatches}
            </h2>
            <Link
              href="/patch-notes"
              className="text-xs text-(--color-text-muted) hover:text-(--color-accent-hover)"
            >
              {t.home.viewAll}
            </Link>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {patches.items.map((patch) => (
              <li key={patch.id}>
                <Link
                  href={`/patch-notes/${patch.version}`}
                  className="hover-lift block h-full p-4 rounded-lg border border-(--color-border) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-(--color-accent) font-mono text-sm font-semibold">{patch.version}</span>
                    <span className="text-[11px] text-(--color-text-faint) font-mono">{t.date(patch.releasedAt)}</span>
                  </div>
                  <h3 className="font-semibold text-sm mt-2 text-(--color-text-strong)">{patch.title}</h3>
                  {patch.summary && (
                    <p className="text-xs text-(--color-text-muted) mt-2 line-clamp-2 leading-relaxed">
                      {patch.summary}
                    </p>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="px-4 py-3 rounded-lg border border-(--color-border) bg-(--color-surface)">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-(--color-text-muted)">{label}</div>
      <div className="mt-1 flex items-baseline gap-2">
        <span className="text-xl font-bold text-(--color-text-strong)">{value}</span>
        {sub && <span className="text-[10px] text-(--color-text-faint)">{sub}</span>}
      </div>
    </div>
  );
}
