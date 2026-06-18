import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { isDefined } from 'class-validator';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  constructor(private readonly configService: ConfigService) {}

  /**
   * 모듈 초기화 시 Redis 클라이언트를 생성
   */
  onModuleInit(): void {
    const password = this.configService.get<string>('REDIS_PASSWORD');

    this.client = new Redis({
      host: this.configService.getOrThrow<string>('REDIS_HOST'),
      port: this.configService.getOrThrow<number>('REDIS_PORT'),
      ...(isDefined(password) && password.length > 0 && { password }),
      lazyConnect: true,
    });
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }

  /**
   * Redis 클라이언트 반환
   *
   * @returns {Redis} ioredis 클라이언트 (Throttler 등 저수준 접근용)
   */
  getClient(): Redis {
    return this.client;
  }

  /**
   * 키에 저장된 JSON 값을 파싱하여 반환
   *
   * @param {string} key 캐시 키
   * @returns {Promise<T | null>} 파싱된 값 또는 미존재 시 null
   */
  async getJson<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);

    if (!isDefined(raw)) {
      return null;
    }

    return JSON.parse(raw) as T;
  }

  /**
   * 값을 JSON 직렬화하여 TTL과 함께 저장
   *
   * @param {string} key 캐시 키
   * @param {T} value 저장할 값
   * @param {number} ttlSeconds 만료 시간 (초)
   */
  async setJson<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
  }

  /**
   * 키 삭제 (단건)
   *
   * @param {string} key 삭제할 키
   */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /**
   * 패턴 매칭 키 일괄 삭제 (캐시 무효화용 — SCAN 기반, KEYS 미사용)
   *
   * @param {string} pattern Redis glob 패턴 (예: `hero:*`)
   */
  async delByPattern(pattern: string): Promise<void> {
    const stream = this.client.scanStream({ match: pattern, count: 100 });

    for await (const keys of stream) {
      if ((keys as string[]).length === 0) {
        continue;
      }

      await this.client.del(...(keys as string[]));
    }
  }

  /**
   * Access token을 로그아웃 블랙리스트에 추가 (토큰 잔여 TTL 만큼만)
   *
   * @param {string} token Access token
   * @param {number} ttlSeconds 만료까지 남은 초
   */
  async addToBlacklist(token: string, ttlSeconds: number): Promise<void> {
    if (ttlSeconds <= 0) {
      return;
    }

    await this.client.set(`blacklist:${token}`, '1', 'EX', ttlSeconds);
  }

  /**
   * Access token이 블랙리스트에 있는지 확인
   *
   * @param {string} token Access token
   * @returns {Promise<boolean>} 블랙리스트 여부
   */
  async isBlacklisted(token: string): Promise<boolean> {
    const result = await this.client.exists(`blacklist:${token}`);

    return result === 1;
  }
}
