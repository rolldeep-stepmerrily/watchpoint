import Link from 'next/link';

import { getPatchNoteList } from '@/lib/api';
import { formatDate } from '@/lib/format';

export const revalidate = 3600;

export default async function HomePage() {
  const { items } = await getPatchNoteList({ pageSize: 3 });

  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <p className="text-sm text-(--color-accent) font-mono uppercase tracking-widest">
          Quis custodiet ipsos custodes?
        </p>
        <h1 className="text-4xl font-semibold tracking-tight">Watchpoint</h1>
        <p className="text-(--color-text-muted) max-w-xl leading-relaxed">
          오버워치 패치노트와 영웅별 능력 상세 수치를 한곳에서 추적·열람합니다. 블리자드 공식 패치노트와 나무위키의 영웅
          정보를 자동으로 모읍니다.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href="/patch-notes"
          className="group block p-6 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-(--color-accent-hover)">패치노트 →</h2>
          <p className="text-sm text-(--color-text-muted)">2026년 1월 이후의 모든 공식 패치 변경사항.</p>
        </Link>

        <Link
          href="/heroes"
          className="group block p-6 rounded-lg border border-(--color-border) bg-(--color-surface) hover:bg-(--color-surface-hover) transition"
        >
          <h2 className="text-lg font-semibold mb-2 group-hover:text-(--color-accent-hover)">영웅 →</h2>
          <p className="text-sm text-(--color-text-muted)">전체 영웅의 스탯, 능력, 패치 이력.</p>
        </Link>
      </section>

      {items.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-(--color-text-muted)">최신 패치</h2>
            <Link
              href="/patch-notes"
              className="text-xs text-(--color-text-muted) hover:text-(--color-accent-hover)"
            >
              전체 보기 →
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
                  <span className="text-xs text-(--color-text-muted) shrink-0">{formatDate(patch.releasedAt)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
