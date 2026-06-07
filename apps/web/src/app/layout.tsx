import type { Metadata, Viewport } from 'next';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { LocaleProvider } from '@/hooks/use-locale';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

import './globals.css';

const KEYWORDS_BY_LOCALE: Record<'ko' | 'en' | 'ja', string[]> = {
  ko: [
    '오버워치',
    '오버워치2',
    '오버워치 패치노트',
    '오버워치 영웅',
    '오버워치 능력',
    '오버워치 특전',
    '영웅 스탯',
    '패치 이력',
    'Watchpoint',
  ],
  en: [
    'Overwatch',
    'Overwatch 2',
    'Overwatch patch notes',
    'Overwatch heroes',
    'hero abilities',
    'hero stats',
    'patch history',
    'perks',
    'Watchpoint',
  ],
  ja: ['オーバーウォッチ', 'パッチノート', 'ヒーロー', 'アビリティ', 'Watchpoint'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

const googleVerification = process.env.WEB_GOOGLE_SITE_VERIFICATION;
const naverVerification = process.env.WEB_NAVER_SITE_VERIFICATION;

const buildVerification = (): Metadata['verification'] | undefined => {
  if (!(googleVerification || naverVerification)) {
    return undefined;
  }

  return {
    ...(googleVerification ? { google: googleVerification } : {}),
    ...(naverVerification ? { other: { 'naver-site-verification': naverVerification } } : {}),
  };
};

/**
 * 루트 레이아웃 메타데이터 생성 — 사이트 전역 기본값 + locale별 키워드/OG locale 설정
 *
 * @returns {Promise<Metadata>} Next.js Metadata 객체
 */
export const generateMetadata = async (): Promise<Metadata> => {
  const lang = await getLocale();
  const t = getLabels(lang);
  const verification = buildVerification();

  return {
    metadataBase: new URL(SITE_URL),
    title: { default: SITE_NAME, template: `%s · ${SITE_NAME}` },
    description: t.site.description,
    applicationName: SITE_NAME,
    keywords: KEYWORDS_BY_LOCALE[lang],
    authors: [{ name: SITE_NAME, url: SITE_URL }],
    creator: SITE_NAME,
    publisher: SITE_NAME,
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
    robots: {
      index: true,
      follow: true,
      googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
    },
    formatDetection: { email: false, address: false, telephone: false },
    ...(verification ? { verification } : {}),
  };
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = await getLocale();
  return (
    <html lang={lang}>
      <body className="min-h-screen flex flex-col">
        <LocaleProvider initialLocale={lang}>
          <SiteHeader />
          <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">{children}</main>
          <SiteFooter />
        </LocaleProvider>
      </body>
    </html>
  );
}
