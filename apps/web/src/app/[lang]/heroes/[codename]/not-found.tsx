import { DEFAULT_LOCALE } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLabels } from '@/lib/labels';

export function generateMetadata(): Metadata {
  const t = getLabels(DEFAULT_LOCALE);
  return {
    title: t.heroes.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default function HeroNotFound() {
  const t = getLabels(DEFAULT_LOCALE);
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
        href="/heroes"
        className="inline-block px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
      >
        {t.heroes.notFound.cta}
      </Link>
    </div>
  );
}
