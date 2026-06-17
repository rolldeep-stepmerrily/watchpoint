'use client';

import type { Locale } from '@@shared';
import { useCallback, useId, useState } from 'react';

import { getLabels } from '@/lib/labels';
import { useFavorites } from '@/lib/use-favorites';

interface Props {
  playerId: string;
  name: string;
  avatar: string | null;
  lang: Locale;
}

export function FavoriteToggle({ playerId, name, avatar, lang }: Props) {
  const t = getLabels(lang);
  const { hydrated, isFavorite, add, remove, limit } = useFavorites();
  const [announce, setAnnounce] = useState('');
  const [warning, setWarning] = useState('');
  const liveId = useId();

  const favorited = isFavorite(playerId);

  const onClick = useCallback(() => {
    if (favorited) {
      remove(playerId);
      setWarning('');
      setAnnounce(t.career.favorites.removedAria(name));
      return;
    }
    const ok = add({ playerId, name, avatar });
    if (!ok) {
      setWarning(t.career.favorites.limitReached(limit));
      setAnnounce('');
      return;
    }
    setWarning('');
    setAnnounce(t.career.favorites.addedAria(name));
  }, [favorited, add, remove, playerId, name, avatar, t, limit]);

  const disabled = !hydrated;
  const label = favorited ? t.career.favorites.removeLabel : t.career.favorites.addLabel;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={favorited}
        aria-label={label}
        title={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50"
      >
        <StarIcon
          filled={favorited}
          label={label}
        />
      </button>
      {warning ? <span className="text-[11px] text-(--color-text-muted)">{warning}</span> : null}
      <span
        id={liveId}
        role="status"
        aria-live="polite"
        className="sr-only"
      >
        {announce}
      </span>
    </div>
  );
}

function StarIcon({ filled, label }: { filled: boolean; label: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      <path d="M12 17.27l5.18 3.16-1.37-5.91L20.5 9.97l-6.04-.51L12 3.92 9.54 9.46l-6.04.51 4.69 4.55-1.37 5.91L12 17.27z" />
    </svg>
  );
}
