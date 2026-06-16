/**
 * 경쟁전 티어. OverFast API 응답에 등장하는 enum 그대로.
 */
export type CompetitiveTier =
  | 'bronze'
  | 'silver'
  | 'gold'
  | 'platinum'
  | 'diamond'
  | 'master'
  | 'grandmaster'
  | 'champion'
  | 'ultimate';

export type CareerPlatform = 'pc' | 'console';

export interface CareerRankDto {
  tier: CompetitiveTier;
  division: number | null;
  roleIcon: string | null;
  rankIcon: string | null;
}

export interface CareerPlatformRanksDto {
  tank: CareerRankDto | null;
  damage: CareerRankDto | null;
  support: CareerRankDto | null;
}

export interface CareerCompetitiveDto {
  pc: CareerPlatformRanksDto | null;
  console: CareerPlatformRanksDto | null;
}

export interface CareerSummaryDto {
  playerId: string;
  battleTag: string;
  name: string;
  avatar: string | null;
  namecard: string | null;
  title: string | null;
  endorsementLevel: number | null;
  competitive: CareerCompetitiveDto | null;
  private: boolean;
}

export interface CareerSearchEntryDto {
  playerId: string;
  name: string;
  avatar: string | null;
  namecard: string | null;
  lastUpdatedAt: string | null;
  private: boolean;
}

export interface CareerSearchResultDto {
  total: number;
  results: CareerSearchEntryDto[];
}

/**
 * OverFast `/stats/summary` 응답 기반 stats block.
 * general / 역할별 / 영웅별 모두 같은 shape으로 들고 다닌다.
 */
export interface CareerStatsBlockDto {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  /** 초 단위 누적 플레이타임 */
  timePlayed: number;
  /** 0~100 */
  winrate: number;
  kda: number;
  total: CareerStatsTotalsDto;
  average: CareerStatsTotalsDto;
}

export interface CareerStatsTotalsDto {
  eliminations: number;
  assists: number;
  deaths: number;
  damage: number;
  healing: number;
}

export interface CareerStatsHeroEntryDto extends CareerStatsBlockDto {
  /** OverFast hero codename — `wrecking-ball` 등 kebab-case */
  codename: string;
}

export type CareerStatsRole = 'tank' | 'damage' | 'support';

export interface CareerStatsRolesDto {
  tank: CareerStatsBlockDto | null;
  damage: CareerStatsBlockDto | null;
  support: CareerStatsBlockDto | null;
}

export interface CareerStatsDto {
  playerId: string;
  general: CareerStatsBlockDto | null;
  roles: CareerStatsRolesDto;
  heroes: CareerStatsHeroEntryDto[];
}
