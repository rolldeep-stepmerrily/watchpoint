import { RedisService } from '@@redis';
import { Injectable, Logger } from '@nestjs/common';

import { CACHE_PATTERNS } from './cache-keys';

/**
 * Cache-aside 응답 캐시. SPEC 명시 TTL을 use-case 단에서 적용.
 *
 * - `wrap`: hit이면 캐시값, miss이면 loader 실행 후 저장. loader가 throw하면 캐시에 저장하지 않음.
 * - `invalidateAll`: hero / patch 양쪽 prefix를 무효화. scraper / CLI 성공 후 호출.
 */
@Injectable()
export class ResponseCache {
  private readonly logger = new Logger(ResponseCache.name);

  constructor(private readonly redisService: RedisService) {}

  async wrap<T>(key: string, ttlSeconds: number, loader: () => Promise<T>): Promise<T> {
    const cached = await this.redisService.getJson<T>(key);
    if (cached !== null) {
      return cached;
    }

    const fresh = await loader();
    await this.redisService.setJson(key, fresh, ttlSeconds);
    return fresh;
  }

  async invalidateAll(): Promise<void> {
    await Promise.all([
      this.redisService.delByPattern(CACHE_PATTERNS.HERO_ALL),
      this.redisService.delByPattern(CACHE_PATTERNS.PATCH_ALL),
    ]);
    this.logger.log(`response cache invalidated: ${CACHE_PATTERNS.HERO_ALL} + ${CACHE_PATTERNS.PATCH_ALL}`);
  }
}
