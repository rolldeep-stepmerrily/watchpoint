import type { Metadata } from 'next';
import Link from 'next/link';

import './globals.css';

export const metadata: Metadata = {
  title: 'Watchpoint',
  description: '오버워치 패치노트와 영웅 능력 수치를 한곳에서 추적합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <header className="border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur sticky top-0 z-10">
          <nav className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-8">
            <Link
              href="/"
              className="text-lg font-semibold tracking-tight text-(--color-accent)"
            >
              Watchpoint
            </Link>
            <div className="flex items-center gap-6 text-sm">
              <Link
                href="/heroes"
                className="hover:text-(--color-accent-hover)"
              >
                영웅
              </Link>
              <Link
                href="/patch-notes"
                className="hover:text-(--color-accent-hover)"
              >
                패치노트
              </Link>
            </div>
          </nav>
        </header>

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">{children}</main>

        <footer className="border-t border-(--color-border) py-6 text-center text-xs text-(--color-text-muted)">
          데이터 출처: Blizzard 공식 패치노트 / 나무위키 (CC BY-NC-SA 2.0 KR)
        </footer>
      </body>
    </html>
  );
}
