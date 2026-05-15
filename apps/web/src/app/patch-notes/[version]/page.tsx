import { notFound } from "next/navigation";

import type { PatchNoteEntryDto } from "@@shared";

import { getPatchNote } from "@/lib/api";
import { categoryLabel, formatDate } from "@/lib/format";

export const revalidate = 600;

interface Props {
  params: Promise<{ version: string }>;
}

export default async function PatchNoteDetailPage({ params }: Props) {
  const { version } = await params;

  let patch;
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
        {patch.summary && (
          <p className="text-(--color-text-muted) max-w-2xl leading-relaxed">{patch.summary}</p>
        )}
      </header>

      {grouped.length === 0 ? (
        <p className="text-(--color-text-muted)">변경사항이 없습니다.</p>
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, entries]) => (
            <section key={category} className="space-y-3">
              <h2 className="text-lg font-semibold text-(--color-accent)">{categoryLabel(category)}</h2>
              <ul className="space-y-3">
                {entries.map((entry) => (
                  <li
                    key={entry.id}
                    className="p-4 rounded-lg border border-(--color-border) bg-(--color-surface)"
                  >
                    <div className="font-semibold">{entry.title}</div>
                    <p className="text-sm text-(--color-text-muted) mt-2 whitespace-pre-line">
                      {entry.body}
                    </p>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="text-xs text-(--color-text-muted)">
        출처:{" "}
        <a href={patch.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline">
          {patch.sourceUrl}
        </a>
      </p>
    </article>
  );
}

function groupByCategory(entries: PatchNoteEntryDto[]): Array<[PatchNoteEntryDto["category"], PatchNoteEntryDto[]]> {
  const groups = new Map<PatchNoteEntryDto["category"], PatchNoteEntryDto[]>();
  for (const entry of entries) {
    const list = groups.get(entry.category) ?? [];
    list.push(entry);
    groups.set(entry.category, list);
  }
  return Array.from(groups.entries());
}
