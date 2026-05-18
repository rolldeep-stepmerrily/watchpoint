import { AppException } from '@@exceptions';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { request } from 'undici';

import { SCRAPER_ERRORS } from '../scraper.error';

@Injectable()
export class ScraperHttpClient {
  private readonly logger = new Logger(ScraperHttpClient.name);
  private readonly userAgent: string;
  private readonly delayMs: number;
  private readonly lastRequestAt = new Map<string, number>();
  private readonly inFlight = new Map<string, Promise<void>>();

  constructor(private readonly configService: ConfigService) {
    this.userAgent = this.configService.getOrThrow<string>('SCRAPER_USER_AGENT');
    this.delayMs = this.configService.getOrThrow<number>('SCRAPER_REQUEST_DELAY_MS');
  }

  async fetchHtml(url: string): Promise<string> {
    const host = this.hostOf(url);
    await this.acquireSlot(host);

    try {
      const { statusCode, body } = await request(url, {
        method: 'GET',
        headers: {
          'user-agent': this.userAgent,
          accept: 'text/html,application/xhtml+xml',
          'accept-language': 'ko-KR,ko;q=0.9',
        },
        maxRedirections: 5,
      });

      if (statusCode >= 400) {
        this.logger.warn(`fetch ${url} returned ${statusCode}`);
        throw new AppException(SCRAPER_ERRORS.FETCH_FAILED);
      }

      return await body.text();
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.error(`fetch ${url} failed`, error as Error);
      throw new AppException(SCRAPER_ERRORS.FETCH_FAILED);
    } finally {
      this.lastRequestAt.set(host, Date.now());
    }
  }

  private hostOf(url: string): string {
    return new URL(url).host;
  }

  private async acquireSlot(host: string): Promise<void> {
    const previous = this.inFlight.get(host) ?? Promise.resolve();
    let release!: () => void;
    const slot = new Promise<void>((resolve) => {
      release = resolve;
    });
    this.inFlight.set(
      host,
      previous.then(() => slot),
    );

    await previous;
    const waitMs = this.computeWaitMs(host);
    if (waitMs > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitMs));
    }
    queueMicrotask(release);
  }

  private computeWaitMs(host: string): number {
    const last = this.lastRequestAt.get(host);
    if (!last) return 0;
    const elapsed = Date.now() - last;
    return Math.max(0, this.delayMs - elapsed);
  }
}
