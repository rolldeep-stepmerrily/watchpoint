import { Injectable } from '@nestjs/common';
import type { ThrottlerStorage } from '@nestjs/throttler';

import { RedisService } from './redis.service';

interface ThrottlerStorageRecord {
  totalHits: number;
  timeToExpire: number;
  isBlocked: boolean;
  timeToBlockExpire: number;
}

/**
 * Lua로 incr + pexpire(NX 효과)를 원자화. 기존 JS 분기(incr → if 1 then pexpire)는
 * 두 명령 사이 프로세스가 죽으면 TTL이 없는 영구 키가 남고 한 요청이 영영 +1로 카운트된다.
 * 또한 block 키를 항상 PX로 set하면 여러 워커가 동시에 한도 초과시 마지막 set의 TTL이
 * 덮어쓰여 차단 종료 시점이 흔들린다. SET NX PX로 첫 set만 통과시킨다.
 *
 * 결과 배열: [totalHits, timeToExpire(ms), blockSet(0|1), blockPttl(ms)]
 *  - blockSet=1이면 이번 호출이 새로 블록을 걸었음
 *  - block 키가 이미 있으면 incr/pexpire를 모두 스킵하고 [-1, 0, 0, blockPttl] 반환
 */
const THROTTLER_LUA = `
local hitKey = KEYS[1]
local blockKey = KEYS[2]
local ttl = tonumber(ARGV[1])
local limit = tonumber(ARGV[2])
local blockDuration = tonumber(ARGV[3])

local existingBlock = redis.call('PTTL', blockKey)
if existingBlock > 0 then
  return {-1, 0, 0, existingBlock}
end

local totalHits = redis.call('INCR', hitKey)
if totalHits == 1 then
  redis.call('PEXPIRE', hitKey, ttl)
end
local timeToExpire = redis.call('PTTL', hitKey)
if timeToExpire < 0 then
  timeToExpire = 0
end

local blockSet = 0
local blockPttl = 0
if totalHits > limit and blockDuration > 0 then
  local setResult = redis.call('SET', blockKey, '1', 'NX', 'PX', blockDuration)
  if setResult then
    blockSet = 1
  end
  blockPttl = redis.call('PTTL', blockKey)
  if blockPttl < 0 then
    blockPttl = 0
  end
end

return {totalHits, timeToExpire, blockSet, blockPttl}
`;

@Injectable()
export class RedisThrottlerStorage implements ThrottlerStorage {
  constructor(private readonly redisService: RedisService) {}

  /**
   * 요청 횟수를 증가시키고 throttle 상태를 반환. 단일 Lua 스크립트로 incr/pexpire/block-set을 원자 실행.
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
    const raw = (await client.eval(THROTTLER_LUA, 2, hitKey, blockKey, ttl, limit, blockDuration)) as [
      number,
      number,
      number,
      number,
    ];
    const [totalHits, timeToExpire, _blockSet, blockPttl] = raw;

    // existing block hit — incr 안 일어났음. limit+1로 보고해 throttle 트리거.
    if (totalHits === -1) {
      return { totalHits: limit + 1, timeToExpire: 0, isBlocked: true, timeToBlockExpire: blockPttl };
    }

    const isBlocked = blockPttl > 0;
    return { totalHits, timeToExpire, isBlocked, timeToBlockExpire: blockPttl };
  }
}
