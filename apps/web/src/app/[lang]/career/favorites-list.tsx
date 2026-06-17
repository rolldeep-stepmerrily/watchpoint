'use client';

import type { Locale } from '@@shared';
import Link from 'next/link';

import { useFavorites } from '@/lib/use-favorites';

import type { Labels } from '@/lib/labels';

interface Props {
  lang: Locale;
  t: Labels;
  fallbackHint: string;
}

export function FavoritesList({ lang, t, fallbackHint }: Props) {
  const { hydrated, favorites, remove } = useFavorites();

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted)">
        {t.career.favorites.heading}
      </h2>
      {!hydrated || favorites.length === 0 ? (
        <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) p-5 text-center">
          <p className="text-sm text-(--color-text-muted)">{hydrated ? t.career.favorites.empty : fallbackHint}</p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {favorites.map((entry) => (
            <li
              key={entry.playerId}
              className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3"
            >
              <Link
                href={`/${lang}/career/${entry.playerId}` as never}
                className="flex min-w-0 flex-1 items-center gap-3 hover:text-(--color-accent)"
              >
                <Avatar
                  src={entry.avatar}
                  alt={entry.name}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-(--color-text-strong)">{entry.name}</p>
                  <p className="truncate font-mono text-[11px] text-(--color-text-muted)">
                    {toBattleTag(entry.playerId)}
                  </p>
                </div>
              </Link>
              <button
                type="button"
                onClick={() => remove(entry.playerId)}
                aria-label={t.career.favorites.removeEntryAria(entry.name)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-(--color-text-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-accent)"
              >
                <CrossIcon label={t.career.favorites.removeEntryAria(entry.name)} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Avatar({ src, alt }: { src: string | null; alt: string }) {
  if (src === null) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-(--color-border) bg-(--color-bg) text-sm font-semibold text-(--color-text-muted)"
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
      loading="lazy"
      className="h-10 w-10 shrink-0 rounded-full border border-(--color-border) object-cover"
    />
  );
}

function CrossIcon({ label }: { label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  );
}

function toBattleTag(playerId: string): string {
  return playerId.replace(/-(\d+)$/, '#$1');
}
