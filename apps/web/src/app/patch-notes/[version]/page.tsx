import type { PatchNoteDetailDto, PatchNoteEntryDto } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPatchNote } from '@/lib/api';
import { CATEGORY_ORDER, categoryColorVar } from '@/lib/format';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
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

  return (
    <article className="space-y-12">
      <header className="border-b border-(--color-border) pb-6">
        <div className="flex items-baseline gap-3">
          <p className="text-(--color-accent) font-mono text-base font-bold">{patch.version}</p>
          <span className="text-[11px] text-(--color-text-faint) font-mono">{t.date(patch.releasedAt)}</span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-(--color-text-strong) mt-2 leading-tight">
          {patch.title}
        </h1>
        {patch.summary && <p className="text-(--color-text-muted) max-w-3xl leading-relaxed mt-4">{patch.summary}</p>}
        {/* Category distribution mini-bar */}
        {grouped.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-5">
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
      </header>

      {grouped.length === 0 ? (
        <p className="text-(--color-text-muted)">{t.patchNotes.noChanges}</p>
      ) : (
        <div className="space-y-10">
          {grouped.map(([category, entries]) => {
            const colorVar = categoryColorVar(category);
            return (
              <section
                key={category}
                className="space-y-4"
              >
                <div
                  className="flex items-baseline gap-3 border-l-2 pl-3"
                  style={{ borderColor: `var(${colorVar})` }}
                >
                  <h2
                    className="text-base font-bold uppercase tracking-widest"
                    style={{ color: `var(${colorVar})` }}
                  >
                    {t.category(category)}
                  </h2>
                  <span className="text-xs text-(--color-text-faint) font-mono">{entries.length}</span>
                </div>
                <ul className="space-y-3">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="relative p-4 rounded-lg border border-(--color-border) bg-(--color-surface) overflow-hidden"
                    >
                      <span
                        className="absolute top-0 left-0 h-full w-1"
                        style={{ background: `var(${colorVar})` }}
                        aria-hidden
                      />
                      <div className="pl-2">
                        <div className="font-bold text-(--color-text-strong)">{entry.title}</div>
                        <p className="text-sm text-(--color-text-muted) mt-2 whitespace-pre-line leading-relaxed">
                          {entry.body}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
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
