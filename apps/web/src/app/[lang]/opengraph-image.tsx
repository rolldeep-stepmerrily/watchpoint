import { ImageResponse } from 'next/og';

import { resolveLang } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { loadPretendardBold, OG_ACCENT, OG_BACKGROUND, OG_CONTENT_TYPE, OG_MUTED, OG_SIZE, OG_TEXT } from '@/lib/og';
import { SITE_NAME } from '@/lib/seo';

export const runtime = 'nodejs';
export const alt = SITE_NAME;
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: Promise<{ lang: string }>;
}

export default async function OgImage({ params }: Props) {
  const lang = resolveLang((await params).lang);
  const t = getLabels(lang);
  const fontData = await loadPretendardBold();

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '80px',
        background: OG_BACKGROUND,
        color: OG_TEXT,
        fontFamily: 'Pretendard',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          color: OG_ACCENT,
          letterSpacing: 8,
          marginBottom: 24,
        }}
      >
        WATCHPOINT
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 112,
          fontWeight: 700,
          lineHeight: 1.05,
        }}
      >
        {SITE_NAME}
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 32,
          color: OG_MUTED,
          marginTop: 28,
          maxWidth: 880,
          lineHeight: 1.4,
        }}
      >
        {t.site.description}
      </div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Pretendard', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}
