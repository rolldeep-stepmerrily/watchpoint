import type { Metadata, Viewport } from 'next';

import './globals.css';

import { SITE_NAME, SITE_URL } from '@/lib/seo';

/**
 * 루트 레이아웃 — `<html>`/`<body>`만 잡고 cookies/locale은 만지지 않는다.
 * 과거에는 여기서 `cookies()`를 호출해 모든 라우트가 dynamic이 되며 ISR이 사이트 전체에서 비활성됐다.
 * locale 처리는 `/[lang]/layout.tsx` 가 담당하고, prefix가 없는 URL은 middleware에서 default locale로 308 redirect.
 *
 * `<html lang>`은 default locale을 안전한 값으로 두고, `[lang]/layout` 안의 client effect가 router 변경 시 보정.
 */

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

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  colorScheme: 'light',
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  formatDetection: { email: false, address: false, telephone: false },
  ...(buildVerification() ? { verification: buildVerification() } : {}),
};

export default function RootLayout({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <html lang="ko">
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
