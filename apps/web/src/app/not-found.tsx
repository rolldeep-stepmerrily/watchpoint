import type { Metadata } from 'next';
import Link from 'next/link';

import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

export async function generateMetadata(): Promise<Metadata> {
  const t = getLabels(await getLocale());
  return {
    title: t.common.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default async function NotFound() {
  const t = getLabels(await getLocale());
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">
          {t.common.notFound.kicker}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.common.notFound.heading}</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">{t.common.notFound.body}</p>
      </header>

      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="px-4 py-2 rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
        >
          {t.common.home}
        </Link>
        <Link
          href="/heroes"
          className="px-4 py-2 rounded-md border border-(--color-border) hover:bg-(--color-surface-hover)"
        >
          {t.nav.heroes}
        </Link>
        <Link
          href="/patch-notes"
          className="px-4 py-2 rounded-md border border-(--color-border) hover:bg-(--color-surface-hover)"
        >
          {t.nav.patchNotes}
        </Link>
      </nav>
    </div>
  );
}
