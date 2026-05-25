import { ImageResponse } from 'next/og';

import { getPatchNote } from '@/lib/api';
import { getLocale } from '@/lib/i18n';
import { getLabels } from '@/lib/labels';
import { loadPretendardBold, OG_ACCENT, OG_BACKGROUND, OG_CONTENT_TYPE, OG_MUTED, OG_SIZE, OG_TEXT } from '@/lib/og';

export const runtime = 'nodejs';
// note: Next.js requires `alt` to be a static string export; not localized.
export const alt = 'Watchpoint patch notes';
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

interface Props {
  params: Promise<{ version: string }>;
}

export default async function PatchNoteOgImage({ params }: Props) {
  const { version } = await params;
  const t = getLabels(await getLocale());
  const fontData = await loadPretendardBold();

  let patch: Awaited<ReturnType<typeof getPatchNote>> | null = null;
  try {
    patch = await getPatchNote(version);
  } catch {
    patch = null;
  }

  const title = patch?.title ?? t.patchNotes.notFound.ogFallback;
  const versionText = patch?.version ?? version;
  const dateText = patch ? t.date(patch.releasedAt) : '';

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
        WATCHPOINT · PATCH NOTES
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            display: 'flex',
            alignSelf: 'flex-start',
            fontSize: 56,
            color: OG_ACCENT,
            fontFamily: 'Pretendard',
            marginBottom: 24,
            letterSpacing: 2,
          }}
        >
          {versionText}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 80,
            fontWeight: 700,
            lineHeight: 1.1,
            maxWidth: 1040,
          }}
        >
          {title}
        </div>
        {dateText && (
          <div
            style={{
              display: 'flex',
              fontSize: 32,
              color: OG_MUTED,
              marginTop: 24,
            }}
          >
            {dateText}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', fontSize: 22, color: OG_MUTED }}>watchpoint</div>
    </div>,
    {
      ...size,
      fonts: [{ name: 'Pretendard', data: fontData, style: 'normal', weight: 700 }],
    },
  );
}
