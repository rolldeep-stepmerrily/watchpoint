'use client';

import type { Locale } from '@@shared';
import Link from 'next/link';

import { getLabels } from '@/lib/labels';
import { type BookmarkEntry, useBookmarks } from '@/lib/use-bookmarks';

interface Props {
  lang: Locale;
}

export function BookmarksSection({ lang }: Props): React.JSX.Element {
  return (
    <div className="space-y-6">
      <HeroBookmarks lang={lang} />
      <PlayerBookmarks lang={lang} />
    </div>
  );
}

function HeroBookmarks({ lang }: { lang: Locale }): React.JSX.Element {
  const t = getLabels(lang);
  const { hydrated, bookmarks, remove } = useBookmarks('HERO');

  return (
    <section className="space-y-3 rounded-md border border-(--color-border) bg-(--color-surface) p-4">
      <h2 className="text-base font-semibold text-(--color-text-strong)">{t.profile.bookmarks.heroSection}</h2>
      {!hydrated || bookmarks.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{t.profile.bookmarks.emptyHero}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {bookmarks.map((entry) => (
            <HeroBookmarkRow
              key={entry.targetId}
              entry={entry}
              lang={lang}
              onRemove={() => remove(entry.targetId)}
              removeAriaLabel={t.profile.bookmarks.removeEntryAria(displayHeroName(entry))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function HeroBookmarkRow({
  entry,
  lang,
  onRemove,
  removeAriaLabel,
}: {
  entry: BookmarkEntry;
  lang: Locale;
  onRemove: () => void | Promise<void>;
  removeAriaLabel: string;
}): React.JSX.Element {
  const name = displayHeroName(entry);
  const portraitUrl = typeof entry.metadata?.portraitUrl === 'string' ? entry.metadata.portraitUrl : null;

  return (
    <li className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3">
      <Link
        href={`/${lang}/heroes/${entry.targetId}` as never}
        className="flex min-w-0 flex-1 items-center gap-3 hover:text-(--color-accent)"
      >
        <Portrait
          src={portraitUrl}
          alt={name}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-(--color-text-strong)">{name}</p>
          <p className="truncate font-mono text-[11px] text-(--color-text-muted)">{entry.targetId}</p>
        </div>
      </Link>
      <RemoveButton
        onClick={onRemove}
        ariaLabel={removeAriaLabel}
      />
    </li>
  );
}

function PlayerBookmarks({ lang }: { lang: Locale }): React.JSX.Element {
  const t = getLabels(lang);
  const { hydrated, bookmarks, remove } = useBookmarks('PLAYER');

  return (
    <section className="space-y-3 rounded-md border border-(--color-border) bg-(--color-surface) p-4">
      <h2 className="text-base font-semibold text-(--color-text-strong)">{t.profile.bookmarks.playerSection}</h2>
      {!hydrated || bookmarks.length === 0 ? (
        <p className="text-sm text-(--color-text-muted)">{t.profile.bookmarks.emptyPlayer}</p>
      ) : (
        <ul className="grid gap-2 sm:grid-cols-2">
          {bookmarks.map((entry) => (
            <PlayerBookmarkRow
              key={entry.targetId}
              entry={entry}
              lang={lang}
              onRemove={() => remove(entry.targetId)}
              removeAriaLabel={t.profile.bookmarks.removeEntryAria(displayPlayerName(entry))}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function PlayerBookmarkRow({
  entry,
  lang,
  onRemove,
  removeAriaLabel,
}: {
  entry: BookmarkEntry;
  lang: Locale;
  onRemove: () => void | Promise<void>;
  removeAriaLabel: string;
}): React.JSX.Element {
  const name = displayPlayerName(entry);
  const avatar = typeof entry.metadata?.avatar === 'string' ? entry.metadata.avatar : null;

  return (
    <li className="flex items-center gap-3 rounded-md border border-(--color-border) bg-(--color-bg) p-3">
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
          <p className="truncate font-mono text-[11px] text-(--color-text-muted)">{toBattleTag(entry.targetId)}</p>
        </div>
      </Link>
      <RemoveButton
        onClick={onRemove}
        ariaLabel={removeAriaLabel}
      />
    </li>
  );
}

function displayHeroName(entry: BookmarkEntry): string {
  return typeof entry.metadata?.name === 'string' ? entry.metadata.name : entry.targetId;
}

function displayPlayerName(entry: BookmarkEntry): string {
  return typeof entry.metadata?.name === 'string' ? entry.metadata.name : entry.targetId;
}

function toBattleTag(playerId: string): string {
  return playerId.replace(/-(\d+)$/, '#$1');
}

function Portrait({ src, alt }: { src: string | null; alt: string }): React.JSX.Element {
  if (src === null) {
    return (
      <div
        role="img"
        aria-label={alt}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-(--color-border) bg-(--color-bg) text-sm font-semibold text-(--color-text-muted)"
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
      className="h-10 w-10 shrink-0 rounded-md border border-(--color-border) object-cover"
    />
  );
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

function RemoveButton({
  onClick,
  ariaLabel,
}: {
  onClick: () => void | Promise<void>;
  ariaLabel: string;
}): React.JSX.Element {
  return (
    <button
      type="button"
      onClick={() => {
        const result = onClick();
        if (result instanceof Promise) {
          result.catch(() => undefined);
        }
      }}
      aria-label={ariaLabel}
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded text-(--color-text-muted) transition-colors hover:bg-(--color-surface-hover) hover:text-(--color-accent)"
    >
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
        aria-label={ariaLabel}
      >
        <title>{ariaLabel}</title>
        <path d="M18 6L6 18M6 6l12 12" />
      </svg>
    </button>
  );
}
