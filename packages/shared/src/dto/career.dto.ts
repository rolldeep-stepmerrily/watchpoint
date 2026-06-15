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
