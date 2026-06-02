import type { PatchNoteDetailDto, PatchNoteEntryDto } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPatchNote } from '@/lib/api';
import { CATEGORY_ORDER, categoryColorVar } from '@/lib/format';
import { getLocale } from '@/lib/i18n';
import { getLabels, type Labels } from '@/lib/labels';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 600;

interface Props {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  const lang = await getLocale();
  const t = getLabels(lang);
  try {
    const patch = await getPatchNote(version, lang);
    const title = `${patch.version} · ${patch.title}`;
    const description = patch.summary ?? t.patchNotes.descriptionFallback(patch.version, patch.title);
    const url = absoluteUrl(`/patch-notes/${patch.version}`);
    return {
      title,
      description,
      alternates: { canonical: url },
      openGraph: {
        type: 'article',
        title,
        description,
        url,
        publishedTime: patch.releasedAt,
      },
      twitter: {
        card: 'summary',
        title,
        description,
      },
    };
  } catch {
    return { title: t.patchNotes.notFound.title };
  }
}

export default async function PatchNoteDetailPage({ params }: Props) {
  const { version } = await params;
  const lang = await getLocale();
  const t = getLabels(lang);

  let patch: PatchNoteDetailDto;
  try {
    patch = await getPatchNote(version, lang);
  } catch {
    notFound();
  }

  const grouped = groupByCategory(patch.entries);
  const totalEntries = patch.entries.length;

  return (
    <article className="space-y-8">
      <PatchBanner
        patch={patch}
        grouped={grouped}
        totalEntries={totalEntries}
        t={t}
      />

      {grouped.length === 0 ? (
        <p className="text-(--color-text-muted) text-sm py-6">{t.patchNotes.noChanges}</p>
      ) : (
        <div className="border border-(--color-border) rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-(--color-surface) border-b border-(--color-border)">
              <tr className="text-left text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                <th className="px-3 py-2 w-32">{t.patchNotes.columns.category}</th>
                <th className="px-3 py-2">{t.patchNotes.columns.changes}</th>
              </tr>
            </thead>
            <tbody>
              {grouped.flatMap(([category, entries]) =>
                entries.map((entry, idx) => (
                  <EntryRow
                    key={entry.id}
                    category={category}
                    entry={entry}
                    isFirstInGroup={idx === 0}
                    t={t}
                  />
                )),
              )}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-(--color-text-muted) pt-6 border-t border-(--color-border)">
        {t.common.source}:{' '}
        <a
          href={patch.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-(--color-accent) hover:text-(--color-accent-hover) underline decoration-dotted underline-offset-2"
        >
          {patch.sourceUrl}
        </a>
      </p>
    </article>
  );
}

function PatchBanner({
  patch,
  grouped,
  totalEntries,
  t,
}: {
  patch: PatchNoteDetailDto;
  grouped: Array<[PatchNoteEntryDto['category'], PatchNoteEntryDto[]]>;
  totalEntries: number;
  t: Labels;
}) {
  return (
    <header className="relative overflow-hidden rounded-lg border border-(--color-border) bg-gradient-to-br from-(--color-surface) to-(--color-surface-elevated) p-6">
      <span
        className="absolute top-0 left-0 h-full w-1 bg-(--color-accent)"
        aria-hidden
      />
      <div className="pl-3 space-y-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <span className="text-(--color-accent) font-mono text-base font-bold">{patch.version}</span>
          <span className="text-[11px] text-(--color-text-faint) font-mono">{t.date(patch.releasedAt)}</span>
          <span className="text-[11px] text-(--color-text-faint) font-mono ml-auto">
            {totalEntries} {t.patchNotes.columns.changes.toLowerCase()}
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-(--color-text-strong) leading-tight">
          {patch.title}
        </h1>
        {patch.summary && (
          <p className="text-(--color-text-muted) max-w-3xl leading-relaxed text-sm">{patch.summary}</p>
        )}
        {grouped.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {grouped.map(([category, entries]) => {
              const color = `var(${categoryColorVar(category)})`;
              return (
                <span
                  key={category}
                  className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded"
                  style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
                >
                  {t.category(category)}
                  <span className="font-mono">{entries.length}</span>
                </span>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}

function EntryRow({
  category,
  entry,
  isFirstInGroup,
  t,
}: {
  category: PatchNoteEntryDto['category'];
  entry: PatchNoteEntryDto;
  isFirstInGroup: boolean;
  t: Labels;
}) {
  const color = `var(${categoryColorVar(category)})`;

  return (
    <tr
      className={`hover:bg-(--color-accent-faint)/40 transition-colors align-top ${
        isFirstInGroup ? 'border-t-2 border-(--color-border) first:border-t-0' : 'border-t border-(--color-border)/40'
      }`}
    >
      <td className="px-3 py-3 whitespace-nowrap">
        {isFirstInGroup && (
          <span
            className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded"
            style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ backgroundColor: color }}
              aria-hidden
            />
            {t.category(category)}
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <div className="font-bold text-(--color-text-strong)">{entry.title}</div>
        <p className="text-sm text-(--color-text-muted) mt-1.5 whitespace-pre-line leading-relaxed">{entry.body}</p>
      </td>
    </tr>
  );
}

function groupByCategory(entries: PatchNoteEntryDto[]): Array<[PatchNoteEntryDto['category'], PatchNoteEntryDto[]]> {
  const groups = new Map<PatchNoteEntryDto['category'], PatchNoteEntryDto[]>();
  for (const entry of entries) {
    const list = groups.get(entry.category) ?? [];
    list.push(entry);
    groups.set(entry.category, list);
  }
  return CATEGORY_ORDER.filter((category) => groups.has(category)).map(
    (category) => [category, groups.get(category) ?? []] as const,
  );
}
