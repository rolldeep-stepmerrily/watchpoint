import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/seo';

import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    url: '/',
    locale: 'ko_KR',
  },
  twitter: {
    card: 'summary',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
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
