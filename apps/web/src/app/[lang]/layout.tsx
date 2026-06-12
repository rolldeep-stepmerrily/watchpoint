import { DEFAULT_LOCALE, isLocale, type Locale } from '@@shared';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { SiteFooter } from '@/components/site-footer';
import { SiteHeader } from '@/components/site-header';
import { LocaleProvider } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';
import { SITE_NAME, SITE_URL } from '@/lib/seo';

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
    '감시기지',
    '감시기지 Watchpoint',
    '오버워치 감시기지',
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

interface LangParams {
  params: Promise<{ lang: string }>;
}

/**
 * 정적 생성 대상 locale 명시. 'ja'는 번역 미완이라 옵션에서 빼두고 미들웨어가 default로 redirect.
 */
export const generateStaticParams = (): Array<{ lang: Locale }> => {
  return [{ lang: 'ko' }, { lang: 'en' }];
};

const resolveLang = (raw: string): Locale => {
  if (!isLocale(raw)) {
    notFound();
  }
  return raw;
};

/**
 * Locale별 메타데이터 — title default, keywords, OG locale 설정. cookies 사용 X → ISR 보존.
 */
export const generateMetadata = async ({ params }: LangParams): Promise<Metadata> => {
  const { lang: raw } = await params;
  const lang = resolveLang(raw);
  const t = getLabels(lang);
  const defaultTitle = lang === 'ko' ? `감시기지 ${SITE_NAME}` : SITE_NAME;
  return {
    title: { default: defaultTitle, template: `%s · ${SITE_NAME}` },
    description: t.site.description,
    keywords: KEYWORDS_BY_LOCALE[lang],
    alternates: { canonical: `${SITE_URL}/${lang}` },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: t.site.description,
      url: `/${lang}`,
      locale: lang === 'en' ? 'en_US' : lang === 'ja' ? 'ja_JP' : 'ko_KR',
    },
    twitter: {
      card: 'summary',
      title: SITE_NAME,
      description: t.site.description,
    },
  };
};

const LangLayout = async ({
  children,
  params,
}: { children: React.ReactNode } & LangParams): Promise<React.JSX.Element> => {
  const { lang: raw } = await params;
  const lang = isLocale(raw) ? raw : DEFAULT_LOCALE;
  // ja는 번역이 ja → en으로 fallback되므로 본문이 영문. <html lang>은 RootLayout이 'ko' 고정이지만
  // LocaleProvider는 정확한 active locale을 client에 알려주고, 필요한 곳(use-locale 훅)에서 effect로 보정.
  return (
    <LocaleProvider initialLocale={lang}>
      <SiteHeader />
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-10">{children}</main>
      <SiteFooter lang={lang} />
    </LocaleProvider>
  );
};

export default LangLayout;
