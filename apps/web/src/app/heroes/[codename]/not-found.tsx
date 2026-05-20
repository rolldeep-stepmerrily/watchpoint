import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: '영웅을 찾을 수 없음',
  robots: { index: false, follow: false },
};

export default function HeroNotFound() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">404 · Hero</p>
        <h1 className="text-2xl font-semibold tracking-tight">해당 영웅을 찾을 수 없어요.</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">
          codename이 잘못됐거나 아직 동기화되지 않은 영웅일 수 있어요.
        </p>
      </header>

      <Link
        href="/heroes"
        className="inline-block px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
      >
        전체 영웅 보기
      </Link>
    </div>
  );
}
