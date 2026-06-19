'use client';

import type { Locale } from '@@shared';
import { useCallback, useState } from 'react';

import { getLabels } from '@/lib/labels';
import { useBookmarks } from '@/lib/use-bookmarks';

interface Props {
  codename: string;
  name: string;
  portraitUrl: string | null;
  role: string;
  lang: Locale;
}

export function HeroBookmarkToggle({ codename, name, portraitUrl, role, lang }: Props): React.JSX.Element {
  const t = getLabels(lang);
  const { hydrated, isBookmarked, add, remove, limit } = useBookmarks('HERO');
  const [warning, setWarning] = useState<string | null>(null);

  const bookmarked = isBookmarked(codename);

  const onClick = useCallback(async () => {
    setWarning(null);
    if (bookmarked) {
      await remove(codename);
      return;
    }
    const ok = await add({ targetId: codename, metadata: { name, portraitUrl, role } });
    if (!ok) {
      setWarning(t.profile.bookmarks.limitReached(limit));
    }
  }, [bookmarked, add, remove, codename, name, portraitUrl, role, limit, t]);

  const disabled = !hydrated;
  const label = bookmarked ? t.profile.bookmarks.removeLabel : t.profile.bookmarks.addLabel;

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={bookmarked}
        aria-label={label}
        title={label}
        className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-(--color-border) bg-(--color-surface) text-(--color-text-muted) transition-colors hover:border-(--color-accent) hover:text-(--color-accent) disabled:cursor-not-allowed disabled:opacity-50"
      >
        <StarIcon
          filled={bookmarked}
          label={label}
        />
      </button>
      {warning ? <span className="text-[11px] text-(--color-text-muted)">{warning}</span> : null}
    </div>
  );
}

function StarIcon({ filled, label }: { filled: boolean; label: string }): React.JSX.Element {
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
