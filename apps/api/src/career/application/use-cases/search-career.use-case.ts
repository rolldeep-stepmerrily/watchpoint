import { CACHE_KEYS, CACHE_TTL, ResponseCache } from '@@cache';
import { Injectable } from '@nestjs/common';
import type { CareerSearchEntryDto, CareerSearchResultDto } from '@watchpoint/shared';

import { OverFastClient, type OverFastSearchEntry } from '../../infrastructure/overfast.client';

interface SearchCareerUseCaseProps {
  q: string;
  page: number;
  pageSize: number;
}

@Injectable()
export class SearchCareerUseCase {
  constructor(
    private readonly overfast: OverFastClient,
    private readonly cache: ResponseCache,
  ) {}

  /**
   * OverFast `/players?name=` 검색 결과를 우리 DTO로 변환. 빈 q는 controller에서 거른 뒤 호출.
   */
  async execute(props: SearchCareerUseCaseProps): Promise<CareerSearchResultDto> {
    const offset = (props.page - 1) * props.pageSize;
    const cacheKey = CACHE_KEYS.careerSearch(props.q, props.page, props.pageSize);

    return await this.cache.wrap(cacheKey, CACHE_TTL.CAREER_SEARCH, async () => {
      const raw = await this.overfast.searchPlayers(props.q, props.pageSize, offset);

      return {
        total: raw.total,
        results: raw.results.map(toSearchEntryDto),
      };
    });
  }
}

function toSearchEntryDto(raw: OverFastSearchEntry): CareerSearchEntryDto {
  return {
    playerId: raw.player_id,
    name: raw.name,
    avatar: raw.avatar,
    namecard: raw.namecard,
    lastUpdatedAt: toIsoOrNull(raw.last_updated_at),
    private: raw.private === true || raw.privacy === 'private',
  };
}

/**
 * OverFast는 last_updated_at을 epoch seconds 또는 ISO 문자열로 줄 수 있어 안전하게 정규화.
 */
function toIsoOrNull(value: number | string | null): string | null {
  if (value === null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (Number.isFinite(value)) {
    return new Date(value * 1000).toISOString();
  }

  return null;
}
