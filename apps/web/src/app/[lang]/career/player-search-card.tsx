import type { CareerSearchEntryDto, Locale } from '@@shared';
import Link from 'next/link';

import type { Labels } from '@/lib/labels';

interface Props {
  player: CareerSearchEntryDto;
  lang: Locale;
  t: Labels;
}

export function PlayerSearchCard({ player, lang, t }: Props) {
  const battleTag = toBattleTag(player.playerId);

  return (
    <Link
      href={`/${lang}/career/${player.playerId}` as never}
      className="hover-lift flex items-center gap-3 rounded-lg border border-(--color-border) bg-(--color-surface) p-3 transition-all hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"
    >
      <Avatar
        src={player.avatar}
        alt={player.name}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-(--color-text-strong)">{player.name}</p>
        <p className="truncate font-mono text-[11px] text-(--color-text-muted)">{battleTag}</p>
      </div>
      {player.private ? (
        <span className="rounded border border-(--color-border-strong) px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-(--color-text-muted)">
          {t.career.detail.private.kicker}
        </span>
      ) : null}
    </Link>
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

function toBattleTag(playerId: string): string {
  return playerId.replace(/-(\d+)$/, '#$1');
}
