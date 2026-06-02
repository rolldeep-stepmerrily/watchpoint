import * as cheerio from 'cheerio';

/**
 * namuwiki 영웅 페이지의 모든 `<img>` 중 alt/src가 있는 것을 추출한다.
 * alt가 `<pageTitle>/<name>` 형태(prefix 매칭)이거나, 그냥 `<name>` 형태(standalone)인 두 패턴을 구분해서 둘 다 반환.
 * 이름→이미지 매칭은 호출자(CLI)에서 DB 기준으로 수행.
 */
export interface ExtractedImage {
  alt: string;
  altWithoutPrefix: string | null;
  url: string;
}

export function extractAllImages(html: string, pageTitle: string): ExtractedImage[] {
  const $ = cheerio.load(html);
  const prefix = `${pageTitle}/`;
  const seen = new Map<string, ExtractedImage>();

  $('img').each((_, el) => {
    const altRaw = $(el).attr('alt');
    const src = $(el).attr('src');

    if (!(altRaw && src)) {
      return;
    }

    const alt = altRaw.trim();
    const url = src.startsWith('//') ? `https:${src}` : src;
    const altWithoutPrefix = alt.startsWith(prefix) ? alt.slice(prefix.length).trim() : null;

    if (!seen.has(url)) {
      seen.set(url, { alt, altWithoutPrefix, url });
    }
  });

  return Array.from(seen.values());
}

/**
 * 이름 비교용 정규화 — 공백/구두점 제거 + 소문자.
 * namuwiki "융합포" vs DB "융합 캐논" 같은 비교를 지원.
 */
export function normalizeName(s: string): string {
  return s.replace(/[\s·\-_·.]+/g, '').toLowerCase();
}
