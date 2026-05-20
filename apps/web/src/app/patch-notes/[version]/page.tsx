import type { PatchNoteDetailDto, PatchNoteEntryDto } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { getPatchNote } from '@/lib/api';
import { CATEGORY_ORDER, categoryColorVar, categoryLabel, formatDate } from '@/lib/format';
import { absoluteUrl } from '@/lib/seo';

export const revalidate = 600;

interface Props {
  params: Promise<{ version: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { version } = await params;
  try {
    const patch = await getPatchNote(version);
    const title = `${patch.version} · ${patch.title}`;
    const description = patch.summary ?? `오버워치 ${patch.version} 패치노트 — ${patch.title}`;
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
    return { title: '패치노트를 찾을 수 없음' };
  }
}

export default async function PatchNoteDetailPage({ params }: Props) {
  const { version } = await params;

  let patch: PatchNoteDetailDto;
  try {
    patch = await getPatchNote(version);
  } catch {
    notFound();
  }

  const grouped = groupByCategory(patch.entries);

  return (
    <article className="space-y-10">
      <header className="space-y-3">
        <p className="text-(--color-accent) font-mono text-sm">{patch.version}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{patch.title}</h1>
        <p className="text-xs text-(--color-text-muted)">발표: {formatDate(patch.releasedAt)}</p>
        {patch.summary && <p className="text-(--color-text-muted) max-w-2xl leading-relaxed">{patch.summary}</p>}
      </header>

      {grouped.length === 0 ? (
        <p className="text-(--color-text-muted)">변경사항이 없습니다.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, entries]) => {
            const colorVar = categoryColorVar(category);
            return (
              <section
                key={category}
                className="space-y-3"
              >
                <div className="flex items-baseline gap-3">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: `var(${colorVar})` }}
                    aria-hidden
                  />
                  <h2
                    className="text-lg font-semibold"
                    style={{ color: `var(${colorVar})` }}
                  >
                    {categoryLabel(category)}
                  </h2>
                  <span className="text-xs text-(--color-text-muted)">{entries.length}</span>
                </div>
                <ul className="space-y-3">
                  {entries.map((entry) => (
                    <li
                      key={entry.id}
                      className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
                      style={{ borderLeft: `3px solid var(${colorVar})` }}
                    >
                      <div className="font-semibold">{entry.title}</div>
                      <p className="text-sm text-(--color-text-muted) mt-2 whitespace-pre-line">{entry.body}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      <p className="text-xs text-(--color-text-muted)">
        출처:{' '}
        <a
          href={patch.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
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
