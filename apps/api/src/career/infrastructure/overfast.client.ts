// biome-ignore-all lint/style/useNamingConvention: OverFast 응답 JSON shape를 그대로 받는 raw type — 변환은 use-case에서 수행
import { AppException } from '@@exceptions';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent, type Dispatcher, request } from 'undici';

import { CAREER_ERRORS } from '../career.error';

const HEADERS_TIMEOUT_MS = 8_000;
const BODY_TIMEOUT_MS = 12_000;

/**
 * OverFast API 응답 — `player_id`는 battletag의 `#`를 `-`로 치환한 형태.
 * 우리 layer로 들어오기 전 raw shape이므로 use-case에서 camelCase DTO로 변환한다.
 */
export interface OverFastRank {
  tier: string;
  division: number | null;
  role_icon: string | null;
  rank_icon: string | null;
}

export interface OverFastPlatformRanks {
  tank: OverFastRank | null;
  damage: OverFastRank | null;
  support: OverFastRank | null;
}

export interface OverFastPlayerSummary {
  player_id: string;
  battleTag?: string;
  username?: string;
  name?: string;
  avatar: string | null;
  namecard: string | null;
  title: string | null;
  endorsement_level: number | null;
  competitive: {
    pc: OverFastPlatformRanks | null;
    console: OverFastPlatformRanks | null;
  } | null;
  privacy?: 'public' | 'private';
  private?: boolean;
}

export interface OverFastSearchEntry {
  player_id: string;
  name: string;
  avatar: string | null;
  namecard: string | null;
  last_updated_at: number | string | null;
  privacy?: 'public' | 'private';
  private?: boolean;
}

export interface OverFastSearchResult {
  total: number;
  results: OverFastSearchEntry[];
}

/**
 * OverFast API 호출 wrapper. public 인스턴스(https://overfast-api.tekrop.fr) 또는 self-host URL을
 * env로 받아 baseUrl로 사용한다. JSON 전용이므로 cheerio 기반 ScraperHttpClient와 분리.
 *
 * 4xx는 NOT_FOUND/INVALID_PLAYER_ID/UPSTREAM_RATE_LIMITED로 매핑, 5xx/네트워크 에러는 UPSTREAM_UNAVAILABLE.
 */
@Injectable()
export class OverFastClient {
  private readonly logger = new Logger(OverFastClient.name);
  private readonly baseUrl: string;
  private readonly dispatcher: Dispatcher;

  constructor(configService: ConfigService) {
    this.baseUrl = configService.getOrThrow<string>('OVERFAST_API_BASE_URL').replace(/\/$/, '');
    this.dispatcher = new Agent({ headersTimeout: HEADERS_TIMEOUT_MS, bodyTimeout: BODY_TIMEOUT_MS });
  }

  async getPlayerSummary(playerId: string): Promise<OverFastPlayerSummary> {
    return await this.fetchJson<OverFastPlayerSummary>(`/players/${encodeURIComponent(playerId)}/summary`);
  }

  async searchPlayers(name: string, limit: number, offset: number): Promise<OverFastSearchResult> {
    const qs = new URLSearchParams({ name, limit: String(limit), offset: String(offset) });

    return await this.fetchJson<OverFastSearchResult>(`/players?${qs.toString()}`);
  }

  private async fetchJson<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;

    try {
      const { statusCode, body } = await request(url, {
        method: 'GET',
        headers: { accept: 'application/json' },
        dispatcher: this.dispatcher,
      });

      if (statusCode === 404) {
        await body.dump();
        throw new AppException(CAREER_ERRORS.NOT_FOUND);
      }

      if (statusCode === 422) {
        await body.dump();
        throw new AppException(CAREER_ERRORS.INVALID_PLAYER_ID);
      }

      if (statusCode === 429) {
        await body.dump();
        this.logger.warn(`overfast 429: ${url}`);
        throw new AppException(CAREER_ERRORS.UPSTREAM_RATE_LIMITED);
      }

      if (statusCode >= 400) {
        await body.dump();
        this.logger.warn(`overfast ${statusCode}: ${url}`);
        throw new AppException(CAREER_ERRORS.UPSTREAM_UNAVAILABLE);
      }

      return (await body.json()) as T;
    } catch (error) {
      if (error instanceof AppException) {
        throw error;
      }

      this.logger.error(`overfast call failed: ${url}`, error as Error);
      throw new AppException(CAREER_ERRORS.UPSTREAM_UNAVAILABLE);
    }
  }
}
