import type { HeroRole } from '@@shared';

import { roleColorVar } from '@/lib/format';

interface HeroPortraitProps {
  src: string | null;
  alt: string;
  role: HeroRole;
  size: 'sm' | 'md' | 'lg';
  loading?: 'lazy' | 'eager';
}

const SIZE_CLASS = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-20 w-20 text-2xl',
  lg: 'h-32 w-32 text-4xl',
} as const;

export function HeroPortrait({ src, alt, role, size, loading = 'lazy' }: HeroPortraitProps) {
  const sizeClass = SIZE_CLASS[size];
  const colorVar = `var(${roleColorVar(role)})`;

  if (!src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`${sizeClass} shrink-0 rounded-md flex items-center justify-center font-semibold bg-(--color-bg) border`}
        style={{ borderColor: colorVar, color: colorVar }}
      >
        {alt.slice(0, 1)}
      </div>
    );
  }

  return (
    // biome-ignore lint/performance/noImgElement: namuwiki 외부 호스트, next/image remotePatterns 회피
    <img
      src={src}
      alt={alt}
      loading={loading}
      className={`${sizeClass} shrink-0 rounded-md object-cover border bg-(--color-bg)`}
      style={{ borderColor: colorVar }}
    />
  );
}
