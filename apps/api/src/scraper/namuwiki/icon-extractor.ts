import * as cheerio from 'cheerio';

/**
 * namuwiki 영웅 페이지에서 능력/특전 아이콘 이미지를 추출한다.
 *
 * 아이콘은 `<img alt="<pageTitle>/<itemName>" src="//i.namu.wiki/i/...">` 패턴으로 등장하며,
 * 한 페이지에 정확히 1번 등장한다(같은 이미지 중복 X).
 */
export interface ExtractedIcon {
  name: string;
  url: string;
}

export function extractHeroIcons(html: string, pageTitle: string): ExtractedIcon[] {
  const $ = cheerio.load(html);
  const prefix = `${pageTitle}/`;
  const seen = new Map<string, ExtractedIcon>();

  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    const src = $(el).attr('src');

    if (!alt || !src || !alt.startsWith(prefix)) {
      return;
    }

    const name = alt.slice(prefix.length).trim();
    const url = src.startsWith('//') ? `https:${src}` : src;

    if (!seen.has(name)) {
      seen.set(name, { name, url });
    }
  });

  return Array.from(seen.values());
}

/**
 * 이름 비교용 정규화 — 공백/구두점 제거 + 소문자.
 * namuwiki "융합포" vs DB "융합 캐논" 같은 비교를 지원.
 */
export function normalizeName(s: string): string {
  return s.replace(/[\s·\-_·\.]+/g, '').toLowerCase();
}
