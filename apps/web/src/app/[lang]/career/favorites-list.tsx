'use client';

import type { Locale } from '@@shared';
import Link from 'next/link';

import { getLabels } from '@/lib/labels';
import { type BookmarkEntry, useBookmarks } from '@/lib/use-bookmarks';

interface Props {
  lang: Locale;
  fallbackHint: string;
}

export function FavoritesList({ lang, fallbackHint }: Props): React.JSX.Element {
  const t = getLabels(lang);
  const { hydrated, bookmarks, remove } = useBookmarks('PLAYER');

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-(--color-text-muted)">
        {t.career.favorites.heading}
      </h2>
      {!hydrated || bookmarks.length === 0 ? (
        <div className="rounded-lg border border-dashed border-(--color-border) bg-(--color-surface) p-5 text-center">
          <p className="text-sm text-(--color-text-muted)">{hydrated ? t.career.favorites.empty : fallbackHint}</p>
        </div>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {bookmarks.map((entry) => {
            const { name, avatar } = readPlayerMetadata(entry);
            return (
              <li
                key={entry.targetId}
                className="flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3"
              >
                <Link
                  href={`/${lang}/career/${entry.targetId}` as never}
                  className="flex min-w-0 flex-1 items-center gap-3 hover:text-(--color-accent)"
                >
                  <Avatar
                    src={avatar}
                    alt={name}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-(--color-text-strong)">{name}</p>
                    <p className="truncate font-mono text-[11px] text-(--color-text-muted)">
                      {toBattleTag(entry.targetId)}
                    </p>
                  </div>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(entry.targetId)}
                  aria-label={t.career.favorites.removeEntryAria(name)}
                  className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-(--color-text-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-accent)"
                >
                  <CrossIcon label={t.career.favorites.removeEntryAria(name)} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function readPlayerMetadata(entry: BookmarkEntry): { name: string; avatar: string | null } {
  const meta = entry.metadata ?? {};
  const name = typeof meta.name === 'string' ? meta.name : entry.targetId;
  const avatar = typeof meta.avatar === 'string' ? meta.avatar : null;
  return { name, avatar };
}

function Avatar({ src, alt }: { src: string | null; alt: string }): React.JSX.Element {
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

function CrossIcon({ label }: { label: string }): React.JSX.Element {
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
