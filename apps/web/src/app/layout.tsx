import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site-header';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

import './globals.css';

export async function generateMetadata(): Promise<Metadata> {
  const lang = await getLocale();
  const t = getLabels(lang);
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: t.site.description,
    applicationName: SITE_NAME,
    alternates: { canonical: '/' },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: t.site.description,
      url: '/',
      locale: lang === 'en' ? 'en_US' : lang === 'ja' ? 'ja_JP' : 'ko_KR',
    },
    twitter: {
      card: 'summary',
      title: SITE_NAME,
      description: t.site.description,
    },
    robots: { index: true, follow: true },
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLocale();
  const t = getLabels(lang);
  return (
    <html lang={lang}>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />

        <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-10">{children}</main>

        <footer className="border-t border-(--color-border) py-6 text-center text-xs text-(--color-text-muted)">
          {t.common.footerAttribution}
        </footer>
      </body>
    </html>
  );
}
