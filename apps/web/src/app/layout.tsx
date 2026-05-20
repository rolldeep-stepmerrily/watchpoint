import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';

import './globals.css';

export const metadata: Metadata = {
  title: 'Watchpoint',
  description: '오버워치 패치노트와 영웅 능력 수치를 한곳에서 추적합니다.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">{children}</main>

        <footer className="border-t border-(--color-border) py-6 text-center text-xs text-(--color-text-muted)">
          데이터 출처: Blizzard 공식 패치노트 / 나무위키 (CC BY-NC-SA 2.0 KR)
        </footer>
      </body>
    </html>
  );
}
