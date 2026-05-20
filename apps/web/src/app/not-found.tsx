import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없음',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">404</p>
        <h1 className="text-2xl font-semibold tracking-tight">페이지를 찾을 수 없어요.</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">
          이동하려던 페이지가 존재하지 않거나 삭제됐을 수 있어요.
        </p>
      </header>

      <nav className="flex items-center gap-3 text-sm">
        <Link
          href="/"
          className="px-4 py-2 rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
        >
          홈으로
        </Link>
        <Link
          href="/heroes"
          className="px-4 py-2 rounded-md border border-(--color-border) hover:bg-(--color-surface-hover)"
        >
          영웅
        </Link>
        <Link
          href="/patch-notes"
          className="px-4 py-2 rounded-md border border-(--color-border) hover:bg-(--color-surface-hover)"
        >
          패치노트
        </Link>
      </nav>
    </div>
  );
}
