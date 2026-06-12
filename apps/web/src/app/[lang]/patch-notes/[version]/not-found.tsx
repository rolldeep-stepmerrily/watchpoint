import { DEFAULT_LOCALE } from '@@shared';
import type { Metadata } from 'next';
import Link from 'next/link';
import { getLabels } from '@/lib/labels';

export function generateMetadata(): Metadata {
  const t = getLabels(DEFAULT_LOCALE);
  return {
    title: t.patchNotes.notFound.title,
    robots: { index: false, follow: false },
  };
}

export default function PatchNoteNotFound() {
  const t = getLabels(DEFAULT_LOCALE);
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">
          {t.patchNotes.notFound.kicker}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.patchNotes.notFound.heading}</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">{t.patchNotes.notFound.body}</p>
      </header>

      <Link
        href="/patch-notes"
        className="inline-block px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
      >
        {t.patchNotes.notFound.cta}
      </Link>
    </div>
  );
}
