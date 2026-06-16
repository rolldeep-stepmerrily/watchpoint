'use client';

import Link from 'next/link';

import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

export function HeroNotFoundContent() {
  const locale = useLocale();
  const t = getLabels(locale);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">
          {t.heroes.notFound.kicker}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.heroes.notFound.heading}</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">{t.heroes.notFound.body}</p>
      </header>

      <Link
        href={`/${locale}/heroes` as never}
        className="inline-block px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
      >
        {t.heroes.notFound.cta}
      </Link>
    </div>
  );
}
