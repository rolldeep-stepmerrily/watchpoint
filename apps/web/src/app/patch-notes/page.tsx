import Link from "next/link";

import { getPatchNoteList } from "@/lib/api";
import { formatDate } from "@/lib/format";

export const revalidate = 60;

export default async function PatchNotesPage() {
  const { items, total } = await getPatchNoteList({ pageSize: 50 });

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">패치노트 ({total})</h1>
        <p className="text-sm text-(--color-text-muted) mt-1">최신순으로 표시 — PUBLISHED만 노출</p>
      </header>

      {items.length === 0 ? (
        <p className="text-(--color-text-muted)">등록된 패치노트가 없습니다.</p>
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
                  <span className="text-xs text-(--color-text-muted)">{formatDate(patch.releasedAt)}</span>
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
