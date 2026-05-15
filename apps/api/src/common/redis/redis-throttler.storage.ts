import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';

import { RedisService } from './redis.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 요청 횟수를 증가시키고 throttle 상태를 반환
   *
   * @param {string} key 식별 키
   * @param {number} ttl 윈도우 만료 시간 (ms)
   * @param {number} limit 윈도우 내 최대 허용 횟수
   * @param {number} blockDuration 차단 지속 시간 (ms)
   * @param {string} throttlerName throttler 이름
   * @returns {Promise<ThrottlerStorageRecord>} throttle 상태
   */
  async increment(
    key: string,
    ttl: number,
    limit: number,
    blockDuration: number,
    throttlerName: string,
  ): Promise<ThrottlerStorageRecord> {
    const hitKey = `throttle:${throttlerName}:${key}`;
    const blockKey = `throttle:block:${throttlerName}:${key}`;

    const client = this.redisService.getClient();
    const isBlocked = (await client.exists(blockKey)) === 1;

    if (isBlocked) {
      const blockPttl = await client.pttl(blockKey);

      return {
        totalHits: limit + 1,
        timeToExpire: 0,
        isBlocked: true,
        timeToBlockExpire: Math.max(0, blockPttl),
      };
    }

    const totalHits = await client.incr(hitKey);

    if (totalHits === 1) {
      await client.pexpire(hitKey, ttl);
    }

    const timeToExpire = Math.max(0, await client.pttl(hitKey));

    if (totalHits > limit && blockDuration > 0) {
      await client.set(blockKey, '1', 'PX', blockDuration);
      const blockPttl = Math.max(0, await client.pttl(blockKey));

      return { totalHits, timeToExpire, isBlocked: true, timeToBlockExpire: blockPttl };
    }

    return { totalHits, timeToExpire, isBlocked: false, timeToBlockExpire: 0 };
  }
}
