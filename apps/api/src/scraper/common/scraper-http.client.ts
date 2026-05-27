import { AppException } from '@@exceptions';
import { RedisService } from '@@redis';
import { randomUUID } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Agent, type Dispatcher, interceptors, request } from 'undici';

import { SCRAPER_ERRORS } from '../scraper.error';

const LOCK_TTL_MS = 30_000;
const LOCK_POLL_MS = 200;
const LAST_REQUEST_TTL_MULTIPLIER = 5;
const MAX_REDIRECTIONS = 5;

/**
 * Redis Lua script — lock token이 일치할 때만 DEL. TTL 만료로 다른 워커가 잡은 lock을 실수로 해제하지 않게.
 */
const RELEASE_LOCK_SCRIPT = `
if redis.call("GET", KEYS[1]) == ARGV[1] then
  return redis.call("DEL", KEYS[1])
else
  return 0
end
`;

@Injectable()
export class ScraperHttpClient {
  private readonly logger = new Logger(ScraperHttpClient.name);
  private readonly userAgent: string;
  private readonly delayMs: number;
  private readonly dispatcher: Dispatcher;

  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.userAgent = configService.getOrThrow<string>('SCRAPER_USER_AGENT');
    this.delayMs = configService.getOrThrow<number>('SCRAPER_REQUEST_DELAY_MS');
    // 자체 dispatcher 사용: global dispatcher가 undici v7로 잡힌 경우 request 옵션의 maxRedirections가
    // "use the redirect interceptor" 에러로 throw됨. compose(interceptors.redirect)는 v6/v7 양쪽 호환.
    this.dispatcher = new Agent({ headersTimeout: 10_000, bodyTimeout: 15_000 }).compose(
      interceptors.redirect({ maxRedirections: MAX_REDIRECTIONS }),
    );
  }

  async fetchHtml(url: string): Promise<string> {
    const html = await this.fetchHtmlInternal(url);
    if (html === null) {
      throw new AppException(SCRAPER_ERRORS.FETCH_FAILED);
    }
    return html;
  }

  /**
   * 4xx (특히 404)에서는 null을 반환하고, 5xx/네트워크 에러는 throw.
   * 호출자(scraper)가 fallback URL을 시도할 때 사용.
   */
  async fetchHtmlOrNullOnClientError(url: string): Promise<string | null> {
    return await this.fetchHtmlInternal(url);
  }

  private async fetchHtmlInternal(url: string): Promise<string | null> {
    const host = this.hostOf(url);
    const release = await this.acquireSlot(host);

    try {
      const { statusCode, body } = await request(url, {
        method: 'GET',
        headers: {
          'user-agent': this.userAgent,
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'ko-KR,ko;q=0.9',
        },
        dispatcher: this.dispatcher,
      });

      if (statusCode >= 400 && statusCode < 500) {
        this.logger.warn(`fetch ${url} returned ${statusCode}`);
        await body.dump();
        return null;
      }

      if (statusCode >= 500) {
        this.logger.warn(`fetch ${url} returned ${statusCode}`);
        throw new AppException(SCRAPER_ERRORS.FETCH_FAILED);
      }

      return await body.text();
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.error(`fetch ${url} failed`, error as Error);
      throw new AppException(SCRAPER_ERRORS.FETCH_FAILED);
    } finally {
      await release();
    }
  }

  private hostOf(url: string): string {
    return new URL(url).host;
  }

  /**
   * Redis 기반 호스트별 직렬화 + delay 보장.
   * - 분산 환경에서 다중 인스턴스가 동일 도메인에 동시 요청하지 않도록 SET NX PX로 lock 획득.
   * - lock 안에서 마지막 요청 시각을 읽어 SCRAPER_REQUEST_DELAY_MS 보장 후 fetch.
   * - 반환된 release()를 finally에서 호출해 last 시각 갱신 + token 매칭 lock 해제.
   */
  private async acquireSlot(host: string): Promise<() => Promise<void>> {
    const client = this.redisService.getClient();
    const lockKey = `scraper:lock:${host}`;
    const lastKey = `scraper:last:${host}`;
    const token = randomUUID();

    while (true) {
      const ok = await client.set(lockKey, token, 'PX', LOCK_TTL_MS, 'NX');
      if (ok === 'OK') break;
      await this.sleep(LOCK_POLL_MS);
    }

    const lastStr = await client.get(lastKey);
    if (lastStr !== null) {
      const elapsed = Date.now() - Number(lastStr);
      const wait = this.delayMs - elapsed;
      if (wait > 0) await this.sleep(wait);
    }

    return async () => {
      try {
        await client.set(lastKey, String(Date.now()), 'PX', this.delayMs * LAST_REQUEST_TTL_MULTIPLIER);
        await client.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, token);
      } catch (error) {
        this.logger.warn(`release scraper lock for ${host} failed: ${(error as Error).message}`);
      }
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
