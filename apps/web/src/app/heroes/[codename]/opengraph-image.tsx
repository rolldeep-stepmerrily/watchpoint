import { ImageResponse } from 'next/og';

import { getHero } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import {
  loadPretendardBold,
  OG_ACCENT,
  OG_BACKGROUND,
  OG_CONTENT_TYPE,
  OG_MUTED,
  OG_SIZE,
  OG_TEXT,
  ROLE_OG_COLOR,
} from '@/lib/og';

export const runtime = 'nodejs';
// note: Next.js requires `alt` to be a static string export; not localized.
export const alt = 'Watchpoint hero';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: Promise<{ codename: string }>;
}

export default async function HeroOgImage({ params }: Props) {
  const { codename } = await params;
  const lang = await getLocale();
  const t = getLabels(lang);
  const fontData = await loadPretendardBold();

  let hero: Awaited<ReturnType<typeof getHero>> | null = null;
  try {
    hero = await getHero(codename, lang);
  } catch {
    hero = null;
  }

  const roleColor = hero ? ROLE_OG_COLOR[hero.role] : OG_ACCENT;
  const heroName = hero?.name ?? t.heroes.notFound.ogFallback;
  const heroCodename = hero?.codename ?? codename;
  const heroRole = hero ? t.role(hero.role) : '—';

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
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
        }}
      >
        WATCHPOINT · HERO
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            fontSize: 28,
            color: roleColor,
            border: `3px solid ${roleColor}`,
            padding: '10px 24px',
            borderRadius: 10,
            marginBottom: 28,
            letterSpacing: 4,
          }}
        >
          {heroRole}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 128,
            fontWeight: 700,
            lineHeight: 1.0,
          }}
        >
          {heroName}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 36,
            color: OG_MUTED,
            marginTop: 20,
            letterSpacing: 2,
          }}
        >
          {heroCodename}
        </div>
      </div>

      <div style={{ display: 'flex', fontSize: 22, color: OG_MUTED }}>watchpoint</div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Pretendard', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}
