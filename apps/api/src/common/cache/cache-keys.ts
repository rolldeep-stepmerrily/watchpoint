import type { Locale } from '@watchpoint/shared';

/**
 * 응답 캐시 TTL (초). SPEC.md 기준:
 * - 영웅 5분 / 패치노트 목록 1분 / 패치노트 상세 10분
 * - 전적조회(베타): summary 10분 / search 5분 — OverFast 공개 인스턴스 rate limit 보호
 * 동일 카테고리의 추가 엔드포인트는 가장 가까운 TTL을 따른다.
 */
export const CACHE_TTL = {
  HERO: 300,
  HERO_LIST: 300,
  HERO_ABILITIES: 300,
  HERO_PATCH_HISTORY: 600,
  PATCH_LIST: 60,
  PATCH_LATEST: 60,
  PATCH_DETAIL: 600,
  PATCH_ENTRIES: 600,
  CAREER_SUMMARY: 600,
  CAREER_SEARCH: 300,
} as const;

const safe = (v: string | undefined): string => (v === undefined || v === '' ? '_' : encodeURIComponent(v));

export const CACHE_KEYS = {
  hero: (codename: string, lang: Locale): string => `hero:detail:${codename}:${lang}`,
  heroList: (role: string | undefined, q: string | undefined, page: number, pageSize: number, lang: Locale): string =>
    `hero:list:r:${safe(role)}:q:${safe(q)}:p:${page}:s:${pageSize}:${lang}`,
  heroAbilities: (codename: string, lang: Locale): string => `hero:abilities:${codename}:${lang}`,
  heroPatchHistory: (codename: string, lang: Locale): string => `hero:patch-history:${codename}:${lang}`,
  patchList: (page: number, pageSize: number, lang: Locale): string => `patch:list:p:${page}:s:${pageSize}:${lang}`,
  patchLatest: (lang: Locale): string => `patch:latest:${lang}`,
  patchDetail: (version: string, lang: Locale): string => `patch:detail:${version}:${lang}`,
  patchEntries: (version: string, category: string | undefined, lang: Locale): string =>
    `patch:entries:${version}:${safe(category)}:${lang}`,
  careerSummary: (playerId: string): string => `career:summary:${safe(playerId)}`,
  careerSearch: (q: string, page: number, pageSize: number): string =>
    `career:search:q:${safe(q)}:p:${page}:s:${pageSize}`,
} as const;

/**
 * 무효화 prefix. scraper / CLI에서 도메인 변경 후 호출.
 * hero·patch 양쪽이 교차 의존(영웅명 변경 → patch entry 표시 영향, patch sync → hero patch history 영향)
 * 이라 보수적으로 둘 다 무효화.
 */
export const CACHE_PATTERNS = {
  HERO_ALL: 'hero:*',
  PATCH_ALL: 'patch:*',
} as const;
