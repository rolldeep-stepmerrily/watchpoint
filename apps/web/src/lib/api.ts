import type {
  HeroDetailDto,
  HeroPatchHistoryDto,
  HeroRole,
  HeroSummaryDto,
  PaginatedDto,
  PatchNoteDetailDto,
  PatchNoteSummaryDto,
} from '@@shared';

const API_BASE = process.env.WEB_API_BASE_URL ?? 'http://localhost:3000';

async function fetchJson<T>(path: string, revalidate: number): Promise<T> {
  const url = `${API_BASE}${path}`;
  const response = await fetch(url, {
    next: { revalidate },
    headers: { accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`API ${response.status} for ${path}`);
  }

  return (await response.json()) as T;
}

export interface HeroListParams {
  role?: HeroRole;
  q?: string;
  page?: number;
  pageSize?: number;
}

export function getHeroList(params: HeroListParams = {}): Promise<PaginatedDto<HeroSummaryDto>> {
  const search = new URLSearchParams();
  if (params.role) search.set('role', params.role);
  if (params.q) search.set('q', params.q);
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return fetchJson<PaginatedDto<HeroSummaryDto>>(`/heroes${qs ? `?${qs}` : ''}`, 300);
}

export function getHero(codename: string): Promise<HeroDetailDto> {
  return fetchJson<HeroDetailDto>(`/heroes/${encodeURIComponent(codename)}`, 300);
}

export function getHeroPatchHistory(codename: string): Promise<HeroPatchHistoryDto> {
  return fetchJson<HeroPatchHistoryDto>(`/heroes/${encodeURIComponent(codename)}/patch-history`, 300);
}

export interface PatchNoteListParams {
  page?: number;
  pageSize?: number;
}

export function getPatchNoteList(params: PatchNoteListParams = {}): Promise<PaginatedDto<PatchNoteSummaryDto>> {
  const search = new URLSearchParams();
  if (params.page) search.set('page', String(params.page));
  if (params.pageSize) search.set('pageSize', String(params.pageSize));
  const qs = search.toString();
  return fetchJson<PaginatedDto<PatchNoteSummaryDto>>(`/patch-notes${qs ? `?${qs}` : ''}`, 60);
}

export function getPatchNote(version: string): Promise<PatchNoteDetailDto> {
  return fetchJson<PatchNoteDetailDto>(`/patch-notes/${encodeURIComponent(version)}`, 600);
}
