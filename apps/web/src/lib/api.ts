import type {
  CareerSearchResultDto,
  CareerStatsDto,
  CareerSummaryDto,
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
 * API 응답 ok가 아닐 때 throw. `status`로 404/500 구분이 가능해야 페이지가
 * "정말 없는 hero"와 "transient 5xx"를 다르게 처리할 수 있다 (5xx는 rethrow → error.tsx).
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    // path/query 본문은 message에 넣지 않는다 — search 쿼리가 Sentry 브레드크럼에 PII로 새는 것을 막기 위해.
    super(`API ${status} for ${endpoint}`);
    this.name = 'ApiError';
  }
}

/**
 * RSC fetch wrapper — Next.js ISR revalidate 옵션을 적용해 API 응답을 JSON으로 파싱
 *
 * @param {string} path API_BASE 뒤에 붙는 경로(쿼리스트링 포함)
 * @param {string} endpoint Sentry/로그에 노출할 안정 식별자(쿼리 X) — 예: `/heroes/[codename]`
 * @param {number} revalidate Next.js fetch cache revalidate 초 단위
 * @returns {Promise<T>} 파싱된 응답 객체
 * @throws {ApiError} 응답이 ok가 아닐 경우
 */
// Vercel serverless 기본 timeout(10s) 이내로 자르고, 응답이 느린 API 호출이 RSC 렌더 전체를 막지 못하게 한다.
const FETCH_TIMEOUT_MS = 8000;

const fetchJson = async <T>(path: string, endpoint: string, revalidate: number): Promise<T> => {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    next: { revalidate },
    headers: { accept: 'application/json' },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new ApiError(response.status, endpoint);
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
 * cache()로 감싸지 않은 이유: `params`가 객체라 React.cache는 reference equality로만 dedupe.
 * 같은 query라도 caller마다 새 객체면 캐싱 안 됨. 대신 Next.js fetch가 URL+headers 기준으로
 * 같은 render 내 dedupe해주므로 단일 render에서 동일 URL 중복 호출은 한 번만 나간다.
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

  return fetchJson<PaginatedDto<HeroSummaryDto>>(`/heroes${qs ? `?${qs}` : ''}`, '/heroes', 300);
};

export const getHero = cache((codename: string, lang?: Locale): Promise<HeroDetailDto> => {
  const qs = lang ? `?lang=${lang}` : '';
  return fetchJson<HeroDetailDto>(`/heroes/${encodeURIComponent(codename)}${qs}`, '/heroes/[codename]', 300);
});

export const getHeroPatchHistory = cache((codename: string, lang?: Locale): Promise<HeroPatchHistoryDto> => {
  const qs = lang ? `?lang=${lang}` : '';
  return fetchJson<HeroPatchHistoryDto>(
    `/heroes/${encodeURIComponent(codename)}/patch-history${qs}`,
    '/heroes/[codename]/patch-history',
    300,
  );
});

export interface PatchNoteListParams {
  page?: number;
  pageSize?: number;
  lang?: Locale;
}

/**
 * 패치노트 목록 페이지네이션 조회 — page/pageSize/lang 필터 지원
 *
 * cache()로 감싸지 않은 이유는 getHeroList와 동일 — Next.js fetch dedupe에 의존.
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

  return fetchJson<PaginatedDto<PatchNoteSummaryDto>>(`/patch-notes${qs ? `?${qs}` : ''}`, '/patch-notes', 60);
};

export const getPatchNote = cache((version: string, lang?: Locale): Promise<PatchNoteDetailDto> => {
  const qs = lang ? `?lang=${lang}` : '';
  return fetchJson<PatchNoteDetailDto>(
    `/patch-notes/${encodeURIComponent(version)}${qs}`,
    '/patch-notes/[version]',
    600,
  );
});

/**
 * 전적 검색 (베타). API의 5분 캐시 + RSC 단 자체 캐시(60s)로 같은 검색어 반복 호출 최소화.
 * upstream 장애(502/429)는 ApiError로 throw → 페이지가 error.tsx로 fallback.
 */
export const getCareerSearch = (q: string, page = 1, pageSize = 20): Promise<CareerSearchResultDto> => {
  const search = new URLSearchParams({ q, page: String(page), pageSize: String(pageSize) });

  return fetchJson<CareerSearchResultDto>(`/career?${search.toString()}`, '/career', 60);
};

export const getCareerSummary = cache((playerId: string): Promise<CareerSummaryDto> => {
  return fetchJson<CareerSummaryDto>(`/career/${encodeURIComponent(playerId)}`, '/career/[playerId]', 60);
});

export const getCareerStats = cache((playerId: string): Promise<CareerStatsDto> => {
  return fetchJson<CareerStatsDto>(`/career/${encodeURIComponent(playerId)}/stats`, '/career/[playerId]/stats', 60);
});
