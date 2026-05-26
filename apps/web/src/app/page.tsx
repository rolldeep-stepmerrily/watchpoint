import Link from 'next/link';

import { getPatchNoteList } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';

export const revalidate = 3600;

export default async function HomePage() {
  const lang = await getLocale();
  const t = getLabels(lang);
  const { items } = await getPatchNoteList({ pageSize: 3, lang });

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm text-(--color-accent) font-mono uppercase tracking-widest">{t.site.tagline}</p>
        <h1 className="text-4xl font-semibold tracking-tight">{t.site.name}</h1>
        <p className="text-(--color-text-muted) max-w-xl leading-relaxed">{t.home.description}</p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/patch-notes"
          className="group block p-6 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-(--color-accent-hover)">
            {t.home.patchNotesHeading}
          </h2>
          <p className="text-sm text-(--color-text-muted)">{t.home.patchNotesBody}</p>
        </Link>

        <Link
          href="/heroes"
          className="group block p-6 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-(--color-accent-hover)">
            {t.home.heroesHeading}
          </h2>
          <p className="text-sm text-(--color-text-muted)">{t.home.heroesBody}</p>
        </Link>
      </section>

      {items.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">
              {t.home.latestPatches}
            </h2>
            <Link
              href="/patch-notes"
              className="text-xs text-(--color-text-muted) hover:text-(--color-accent-hover)"
            >
              {t.home.viewAll}
            </Link>
          </div>
          <ul className="space-y-2">
            {items.map((patch) => (
              <li key={patch.id}>
                <Link
                  href={`/patch-notes/${patch.version}`}
                  className="flex items-baseline justify-between gap-3 p-3 rounded-md border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
                >
                  <span>
                    <span className="text-(--color-accent) font-mono mr-2 text-sm">{patch.version}</span>
                    <span className="text-sm">{patch.title}</span>
                  </span>
                  <span className="text-xs text-(--color-text-muted) shrink-0">{t.date(patch.releasedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
