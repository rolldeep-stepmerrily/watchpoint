export const SITE_NAME = 'Watchpoint';

const RAW_URL = process.env.WEB_PUBLIC_URL ?? 'http://localhost:3001';

export const SITE_URL = RAW_URL.replace(/\/$/, '');

export type JsonLdValue = string | number | boolean | null | JsonLdValue[] | { [key: string]: JsonLdValue | undefined };

/**
 * site origin과 경로를 조합한 절대 URL을 반환
 *
 * @param {string} path 슬래시로 시작하는 경로 (없으면 자동 prefix)
 * @returns {string} 절대 URL 문자열
 */
export const absoluteUrl = (path: string): string => {
  const suffix = path.startsWith('/') ? path : `/${path}`;

  return `${SITE_URL}${suffix}`;
};

/**
 * 한국어 별칭. UI/본문에는 노출하지 않고 schema.org alternateName에만 등록 —
 * 검색 엔진이 "감시기지" 키워드를 사이트 식별자로 인식하게 유도.
 */
const SITE_ALTERNATE_NAMES_KO = ['감시기지', '감시기지 Watchpoint', '오버워치 감시기지'];

/**
 * 사이트 루트용 WebSite + SearchAction JSON-LD 빌더 — 구글 사이트링크 검색박스 후보
 *
 * @param {string} description 사이트 짧은 설명 (메타 description과 동일하게 권장)
 * @returns {JsonLdValue} schema.org WebSite JSON-LD 객체
 */
export const buildWebSiteJsonLd = (description: string, lang: 'ko' | 'en' = 'ko'): JsonLdValue => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  alternateName: SITE_ALTERNATE_NAMES_KO,
  url: `${SITE_URL}/${lang}`,
  description,
  inLanguage: lang === 'ko' ? 'ko-KR' : 'en-US',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/${lang}/heroes?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
});

interface ArticleJsonLdProps {
  headline: string;
  description: string;
  url: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
}

/**
 * 콘텐츠 페이지(패치노트)용 Article JSON-LD 빌더
 *
 * @param {ArticleJsonLdProps} props 아티클 메타 정보
 * @returns {JsonLdValue} schema.org Article JSON-LD 객체
 */
export const buildArticleJsonLd = (props: ArticleJsonLdProps): JsonLdValue => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: props.headline,
  description: props.description,
  url: props.url,
  ...(props.image ? { image: props.image } : {}),
  ...(props.datePublished ? { datePublished: props.datePublished } : {}),
  ...(props.dateModified ? { dateModified: props.dateModified } : {}),
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
  },
});

/**
 * 세부 페이지용 BreadcrumbList JSON-LD 빌더 — 검색 결과에 경로 표시
 *
 * @param {Array<{ name: string; url: string }>} items 루트→현재 순서의 경로 노드
 * @returns {JsonLdValue} schema.org BreadcrumbList JSON-LD 객체
 */
export const buildBreadcrumbJsonLd = (items: ReadonlyArray<{ name: string; url: string }>): JsonLdValue => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: item.url,
  })),
});

/**
 * 영웅 상세 페이지용 WebPage + 주제(Thing) JSON-LD 빌더 — 영웅은 article이 아니므로 가벼운 WebPage로 표현
 *
 * @param {{ name: string; description: string; url: string; image?: string }} props 영웅 메타 정보
 * @returns {JsonLdValue} schema.org WebPage JSON-LD 객체
 */
export const buildHeroPageJsonLd = (props: {
  name: string;
  description: string;
  url: string;
  image?: string;
}): JsonLdValue => ({
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: props.name,
  description: props.description,
  url: props.url,
  ...(props.image ? { primaryImageOfPage: { '@type': 'ImageObject', url: props.image } } : {}),
  about: {
    '@type': 'Thing',
    name: props.name,
    description: props.description,
    ...(props.image ? { image: props.image } : {}),
  },
  isPartOf: {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
  },
});

/**
 * 목록 페이지용 ItemList JSON-LD 빌더 — 영웅/패치 목록 등
 *
 * @param {Array<{ name: string; url: string }>} items 항목 배열 (이름 + URL)
 * @returns {JsonLdValue} schema.org ItemList JSON-LD 객체
 */
export const buildItemListJsonLd = (items: ReadonlyArray<{ name: string; url: string }>): JsonLdValue => ({
  '@context': 'https://schema.org',
  '@type': 'ItemList',
  numberOfItems: items.length,
  itemListElement: items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    url: item.url,
  })),
});
