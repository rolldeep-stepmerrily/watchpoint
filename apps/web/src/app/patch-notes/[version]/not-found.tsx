import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '패치노트를 찾을 수 없음',
  robots: { index: false, follow: false },
};

export default function PatchNoteNotFound() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">404 · Patch</p>
        <h1 className="text-2xl font-semibold tracking-tight">해당 패치노트를 찾을 수 없어요.</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">
          버전이 잘못됐거나 비공개(PENDING_REVIEW/DRAFT) 상태일 수 있어요.
        </p>
      </header>

      <Link
        href="/patch-notes"
        className="inline-block px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
      >
        패치노트 목록
      </Link>
    </div>
  );
}
