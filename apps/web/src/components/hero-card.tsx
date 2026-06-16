import type { HeroRole, HeroSummaryDto, Locale, Subrole } from '@@shared';
import Link from 'next/link';

import { roleColorVar } from '@/lib/format';
import { getLabels } from '@/lib/labels';

interface HeroCardProps {
  hero: HeroSummaryDto;
  locale: Locale;
  priority?: boolean;
}

export function HeroCard({ hero, locale, priority = false }: HeroCardProps) {
  const t = getLabels(locale);
  const roleColor = `var(${roleColorVar(hero.role)})`;
  const roleFaint = `var(${roleColorVar(hero.role)}-faint)`;
  const subrole = hero.subrole ? t.subrole(hero.subrole as Subrole) : null;

  return (
    <Link
      href={`/${locale}/heroes/${hero.codename}` as never}
      className="group relative block aspect-[4/5] overflow-hidden rounded-xl border border-(--color-border) bg-(--color-surface) transition-all duration-200 hover:-translate-y-1 hover:border-(--color-text-strong)"
      style={
        {
          '--hero-role': roleColor,
          '--hero-role-faint': roleFaint,
          boxShadow: 'var(--shadow-card)',
        } as React.CSSProperties
      }
      aria-label={`${hero.name} · ${t.role(hero.role)}`}
    >
      <div
        className="absolute inset-x-0 top-0 h-1 z-10"
        style={{ background: roleColor }}
        aria-hidden
      />

      <PortraitLayer
        src={hero.portraitUrl}
        alt={hero.name}
        role={hero.role}
        priority={priority}
      />

      <div
        className="absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/40 to-transparent"
        aria-hidden
      />
      <div
        className="absolute inset-0 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${roleFaint} 0%, transparent 60%)` }}
        aria-hidden
      />

      <div className="absolute top-3 right-3 z-10">
        <span
          className="inline-flex items-center gap-1.5 rounded-md bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur-sm"
          style={{ borderLeft: `2px solid ${roleColor}` }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: roleColor }}
            aria-hidden
          />
          {t.role(hero.role)}
        </span>
      </div>

      <div
        className="absolute inset-x-0 bottom-0 z-10 p-3.5"
        style={{ textShadow: '0 1px 4px rgba(0, 0, 0, 0.85), 0 1px 2px rgba(0, 0, 0, 0.7)' }}
      >
        <h3 className="text-base font-extrabold leading-tight tracking-tight text-white transition-colors duration-200 group-hover:text-(--color-accent) md:text-lg">
          {hero.name}
        </h3>
        {subrole ? (
          <p className="mt-1 text-xs font-semibold tracking-tight text-white/90">{subrole}</p>
        ) : (
          <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-white/75">{hero.codename}</p>
        )}
      </div>

      <span
        className="pointer-events-none absolute inset-0 rounded-xl ring-0 ring-inset transition-all duration-200 group-hover:ring-2"
        style={{ '--tw-ring-color': roleColor } as React.CSSProperties}
        aria-hidden
      />
    </Link>
  );
}

function PortraitLayer({
  src,
  alt,
  role,
  priority,
}: {
  src: string | null;
  alt: string;
  role: HeroRole;
  priority: boolean;
}) {
  const colorVar = `var(${roleColorVar(role)})`;

  if (!src) {
    return (
      <div
        className="absolute inset-0 flex items-center justify-center text-6xl font-extrabold"
        style={{ background: `linear-gradient(135deg, ${colorVar}22 0%, transparent 100%)`, color: colorVar }}
        aria-hidden
      >
        {alt.slice(0, 1)}
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: 외부 cdn 호스트 가능성, next/image remotePatterns 회피
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-300 ease-out group-hover:scale-110"
    />
  );
}
