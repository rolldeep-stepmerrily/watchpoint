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
  const lang = await getLocale();
  const t = getLabels(lang);
  const { items, total } = await getPatchNoteList({ pageSize: 50, lang });

  return (
    <div className="space-y-8">
      <header className="border-b border-(--color-border) pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-(--color-text-muted)">Patch Notes</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--color-text-strong) mt-1">
          {t.patchNotes.titleWithCount(total)}
        </h1>
        <p className="text-sm text-(--color-text-muted) mt-2">{t.patchNotes.subtitle}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">{t.patchNotes.empty}</p>
      ) : (
        <ul className="space-y-2">
          {items.map((patch) => (
            <li key={patch.id}>
              <Link
                href={`/patch-notes/${patch.version}`}
                className="hover-lift group block p-4 rounded-lg border border-(--color-border) bg-(--color-surface) hover:border-(--color-border-strong) hover:bg-(--color-surface-hover)"
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0 min-w-[5rem]">
                    <div className="text-base font-mono font-bold text-(--color-accent)">{patch.version}</div>
                    <div className="text-[11px] text-(--color-text-faint) mt-1 font-mono">
                      {t.date(patch.releasedAt)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="font-bold text-(--color-text-strong) group-hover:text-(--color-accent-hover) transition-colors">
                      {patch.title}
                    </h2>
                    {patch.summary && (
                      <p className="text-sm text-(--color-text-muted) mt-1.5 line-clamp-2 leading-relaxed">
                        {patch.summary}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
