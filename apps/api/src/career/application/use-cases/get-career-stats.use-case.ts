import { CACHE_KEYS, CACHE_TTL, ResponseCache } from '@@cache';
import { Injectable } from '@nestjs/common';
import type {
  CareerStatsBlockDto,
  CareerStatsDto,
  CareerStatsHeroEntryDto,
  CareerStatsRolesDto,
  CareerStatsTotalsDto,
} from '@watchpoint/shared';

import {
  OverFastClient,
  type OverFastStatsBlock,
  type OverFastStatsRoles,
  type OverFastStatsSummary,
  type OverFastStatsTotals,
} from '../../infrastructure/overfast.client';

interface GetCareerStatsUseCaseProps {
  playerId: string;
}

@Injectable()
export class GetCareerStatsUseCase {
  constructor(
    private readonly overfast: OverFastClient,
    private readonly cache: ResponseCache,
  ) {}

  /**
   * OverFast `/players/{id}/stats/summary` 응답을 우리 CareerStatsDto로 변환.
   * heroes는 codename → block의 dict였으나 sort/filter 편의를 위해 array로 평탄화.
   *
   * @param {GetCareerStatsUseCaseProps} props playerId (battletag `#` → `-` 치환 형태)
   */
  async execute(props: GetCareerStatsUseCaseProps): Promise<CareerStatsDto> {
    return await this.cache.wrap(CACHE_KEYS.careerStats(props.playerId), CACHE_TTL.CAREER_STATS, async () => {
      const raw = await this.overfast.getPlayerStats(props.playerId);

      return toCareerStatsDto(raw, props.playerId);
    });
  }
}

function toCareerStatsDto(raw: OverFastStatsSummary, playerId: string): CareerStatsDto {
  return {
    playerId,
    general: raw.general === null ? null : toBlock(raw.general),
    roles: toRoles(raw.roles),
    heroes: toHeroes(raw.heroes),
  };
}

function toRoles(raw: OverFastStatsRoles | null): CareerStatsRolesDto {
  if (raw === null) {
    return { tank: null, damage: null, support: null };
  }

  return {
    tank: raw.tank === null ? null : toBlock(raw.tank),
    damage: raw.damage === null ? null : toBlock(raw.damage),
    support: raw.support === null ? null : toBlock(raw.support),
  };
}

function toHeroes(raw: Record<string, OverFastStatsBlock> | null): CareerStatsHeroEntryDto[] {
  if (raw === null) {
    return [];
  }

  return Object.entries(raw)
    .map(([codename, block]) => ({ codename, ...toBlock(block) }))
    .sort((a, b) => b.gamesPlayed - a.gamesPlayed);
}

function toBlock(raw: OverFastStatsBlock): CareerStatsBlockDto {
  return {
    gamesPlayed: raw.games_played ?? 0,
    gamesWon: raw.games_won ?? 0,
    gamesLost: raw.games_lost ?? 0,
    timePlayed: raw.time_played ?? 0,
    winrate: raw.winrate ?? 0,
    kda: raw.kda ?? 0,
    total: toTotals(raw.total),
    average: toTotals(raw.average),
  };
}

function toTotals(raw: OverFastStatsTotals | undefined): CareerStatsTotalsDto {
  return {
    eliminations: raw?.eliminations ?? 0,
    assists: raw?.assists ?? 0,
    deaths: raw?.deaths ?? 0,
    damage: raw?.damage ?? 0,
    healing: raw?.healing ?? 0,
  };
}
