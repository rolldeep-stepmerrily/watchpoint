export const OG_SIZE = { width: 1200, height: 630 } as const;
export const OG_CONTENT_TYPE = 'image/png';

const FONT_URL =
  'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/public/static/Pretendard-Bold.ttf';

let cachedFont: ArrayBuffer | undefined;

export async function loadPretendardBold(): Promise<ArrayBuffer> {
  if (cachedFont) {
    return cachedFont;
  }
  const response = await fetch(FONT_URL, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error(`Pretendard font fetch failed: ${response.status}`);
  }
  cachedFont = await response.arrayBuffer();
  return cachedFont;
}

export const OG_BACKGROUND = 'linear-gradient(135deg, #0b0d11 0%, #1a1e26 100%)';
export const OG_ACCENT = '#f99e1a';
export const OG_TEXT = '#e6e8eb';
export const OG_MUTED = '#8a8f99';

export const ROLE_OG_COLOR = {
  TANK: '#6db4ff',
  DAMAGE: '#f06464',
  SUPPORT: '#7ed957',
} as const;
