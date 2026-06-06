import type {
  HeroDetailDto,
  HeroPatchHistoryDto,
  HeroRole,
  HeroSummaryDto,
  Locale,
  PaginatedDto,
  PatchNoteDetailDto,
  PatchNoteSummaryDto,
} from '@@shared';
import { cache } from 'react';

const API_BASE = process.env.WEB_API_BASE_URL ?? 'http://localhost:3000';

/**
 * RSC fetch wrapper — Next.js ISR revalidate 옵션을 적용해 API 응답을 JSON으로 파싱
 *
 * @param {string} path API_BASE 뒤에 붙는 경로(쿼리스트링 포함)
 * @param {number} revalidate Next.js fetch cache revalidate 초 단위
 * @returns {Promise<T>} 파싱된 응답 객체
 * @throws {Error} 응답이 ok가 아닐 경우
 */
const fetchJson = async <T>(path: string, revalidate: number): Promise<T> => {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    next: { revalidate },
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
};

export interface HeroListParams {
  role?: HeroRole;
  q?: string;
  page?: number;
  pageSize?: number;
  lang?: Locale;
}

/**
 * 영웅 목록 페이지네이션 조회 — role/q/page/pageSize/lang 필터 지원
 *
 * @param {HeroListParams} [params] 쿼리 파라미터 (모두 optional)
 * @returns {Promise<PaginatedDto<HeroSummaryDto>>} 페이지네이션된 영웅 요약 목록
 */
export const getHeroList = (params: HeroListParams = {}): Promise<PaginatedDto<HeroSummaryDto>> => {
  const search = new URLSearchParams();

  if (params.role) {
    search.set('role', params.role);
  }
  if (params.q) {
    search.set('q', params.q);
  }
  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.pageSize) {
    search.set('pageSize', String(params.pageSize));
  }
  if (params.lang) {
    search.set('lang', params.lang);
  }

  const qs = search.toString();

  return fetchJson<PaginatedDto<HeroSummaryDto>>(`/heroes${qs ? `?${qs}` : ''}`, 300);
};

export const getHero = cache((codename: string, lang?: Locale): Promise<HeroDetailDto> => {
  const qs = lang ? `?lang=${lang}` : '';
  return fetchJson<HeroDetailDto>(`/heroes/${encodeURIComponent(codename)}${qs}`, 300);
});

export const getHeroPatchHistory = cache((codename: string, lang?: Locale): Promise<HeroPatchHistoryDto> => {
  const qs = lang ? `?lang=${lang}` : '';
  return fetchJson<HeroPatchHistoryDto>(`/heroes/${encodeURIComponent(codename)}/patch-history${qs}`, 300);
});

export interface PatchNoteListParams {
  page?: number;
  pageSize?: number;
  lang?: Locale;
}

/**
 * 패치노트 목록 페이지네이션 조회 — page/pageSize/lang 필터 지원
 *
 * @param {PatchNoteListParams} [params] 쿼리 파라미터 (모두 optional)
 * @returns {Promise<PaginatedDto<PatchNoteSummaryDto>>} 페이지네이션된 패치노트 요약 목록
 */
export const getPatchNoteList = (params: PatchNoteListParams = {}): Promise<PaginatedDto<PatchNoteSummaryDto>> => {
  const search = new URLSearchParams();

  if (params.page) {
    search.set('page', String(params.page));
  }
  if (params.pageSize) {
    search.set('pageSize', String(params.pageSize));
  }
  if (params.lang) {
    search.set('lang', params.lang);
  }

  const qs = search.toString();

  return fetchJson<PaginatedDto<PatchNoteSummaryDto>>(`/patch-notes${qs ? `?${qs}` : ''}`, 60);
};

export const getPatchNote = cache((version: string, lang?: Locale): Promise<PatchNoteDetailDto> => {
  const qs = lang ? `?lang=${lang}` : '';
  return fetchJson<PatchNoteDetailDto>(`/patch-notes/${encodeURIComponent(version)}${qs}`, 600);
});
