import type { Metadata } from 'next';
import Link from 'next/link';

import { getPatchNoteList } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const t = getLabels(await getLocale());
  return {
    title: t.patchNotes.title,
    description: t.patchNotes.description,
    alternates: { canonical: '/patch-notes' },
    openGraph: { title: t.patchNotes.title, url: '/patch-notes' },
  };
}

export default async function PatchNotesPage() {
  const t = getLabels(await getLocale());
  const { items, total } = await getPatchNoteList({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t.patchNotes.titleWithCount(total)}</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">{t.patchNotes.subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">{t.patchNotes.empty}</p>
      ) : (
        <ul className="space-y-3">
          {items.map((patch) => (
            <li key={patch.id}>
              <Link
                href={`/patch-notes/${patch.version}`}
                className="block p-4 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="font-semibold">
                    <span className="text-(--color-accent) font-mono mr-2">{patch.version}</span>
                    {patch.title}
                  </div>
                  <span className="text-xs text-(--color-text-muted)">{t.date(patch.releasedAt)}</span>
                </div>
                {patch.summary && (
                  <p className="text-sm text-(--color-text-muted) mt-2 line-clamp-2">{patch.summary}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
