import { CACHE_KEYS, CACHE_TTL, ResponseCache } from '@@cache';
import { Injectable } from '@nestjs/common';
import type { CareerCompetitiveDto, CareerPlatformRanksDto, CareerRankDto, CareerSummaryDto } from '@watchpoint/shared';

import {
  OverFastClient,
  type OverFastPlatformRanks,
  type OverFastPlayerSummary,
  type OverFastRank,
} from '../../infrastructure/overfast.client';

interface GetCareerSummaryUseCaseProps {
  playerId: string;
}

const PLAYER_ID_BATTLETAG_TAIL = /-(\d+)$/;

@Injectable()
export class GetCareerSummaryUseCase {
  constructor(
    private readonly overfast: OverFastClient,
    private readonly cache: ResponseCache,
  ) {}

  /**
   * OverFast `/players/{id}/summary` 응답을 우리 CareerSummaryDto로 변환.
   * upstream throw(AppException)는 cache에 저장되지 않아 일시 장애가 캐싱되지 않는다.
   *
   * @param {GetCareerSummaryUseCaseProps} props playerId (battletag `#` → `-` 치환 형태)
   */
  async execute(props: GetCareerSummaryUseCaseProps): Promise<CareerSummaryDto> {
    return await this.cache.wrap(CACHE_KEYS.careerSummary(props.playerId), CACHE_TTL.CAREER_SUMMARY, async () => {
      const raw = await this.overfast.getPlayerSummary(props.playerId);

      return toCareerSummaryDto(raw, props.playerId);
    });
  }
}

function toCareerSummaryDto(raw: OverFastPlayerSummary, requestedPlayerId: string): CareerSummaryDto {
  const playerId = raw.player_id ?? requestedPlayerId;

  return {
    playerId,
    battleTag: raw.battleTag ?? toBattleTag(playerId),
    name: raw.name ?? raw.username ?? playerId,
    avatar: raw.avatar,
    namecard: raw.namecard,
    title: raw.title,
    endorsementLevel: raw.endorsement_level,
    competitive: toCompetitive(raw.competitive),
    private: raw.private === true || raw.privacy === 'private',
  };
}

function toCompetitive(raw: OverFastPlayerSummary['competitive']): CareerCompetitiveDto | null {
  if (raw === null) {
    return null;
  }

  return {
    pc: toPlatformRanks(raw.pc),
    console: toPlatformRanks(raw.console),
  };
}

function toPlatformRanks(raw: OverFastPlatformRanks | null): CareerPlatformRanksDto | null {
  if (raw === null) {
    return null;
  }

  return {
    tank: toRank(raw.tank),
    damage: toRank(raw.damage),
    support: toRank(raw.support),
  };
}

function toRank(raw: OverFastRank | null): CareerRankDto | null {
  if (raw === null) {
    return null;
  }

  return {
    tier: raw.tier as CareerRankDto['tier'],
    division: raw.division,
    roleIcon: raw.role_icon,
    rankIcon: raw.rank_icon,
  };
}

/**
 * "TeKrop-2217" → "TeKrop#2217". username only면 그대로 유지.
 */
function toBattleTag(playerId: string): string {
  return playerId.replace(PLAYER_ID_BATTLETAG_TAIL, '#$1');
}
