import Link from 'next/link';

export const revalidate = 3600;

export default function HomePage() {
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
    </div>
  );
}
