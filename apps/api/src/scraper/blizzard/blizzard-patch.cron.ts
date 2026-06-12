import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import * as Sentry from '@sentry/nestjs';
import { BlizzardPatchScraper } from './blizzard-patch.scraper';
import { BlizzardPatchEnScraper } from './blizzard-patch-en.scraper';

@Injectable()
export class BlizzardPatchCron {
  private readonly logger = new Logger(BlizzardPatchCron.name);
  private readonly enabled: boolean;
  // 1 인스턴스 내 동시 실행 가드. cron tick은 6h마다지만 affectedHeroes 백그라운드 sync가
  // 25분 이상 걸릴 수 있어 다음 tick과 겹칠 수 있다(특히 backfill/수동 트리거 병행 시). 겹치면
  // Blizzard 요청 풀에 부담 + Redis lock 경합으로 throttle/차단 위험.
  // 다중 인스턴스 가드는 ScraperHttpClient의 Redis lock이 담당하므로 여기선 in-process만 차단.
  private running = false;

  constructor(
    configService: ConfigService,
    private readonly scraper: BlizzardPatchScraper,
    private readonly enScraper: BlizzardPatchEnScraper,
  ) {
    this.enabled = configService.get<boolean>('SCRAPER_CRON_ENABLED') ?? false;
  }

  @Cron(process.env.SCRAPER_PATCH_CRON ?? '0 */6 * * *', { name: 'blizzard-patch-sync' })
  async run(): Promise<void> {
    if (!this.enabled) {
      return;
    }
    if (this.running) {
      this.logger.warn('blizzard patch cron skipped — previous tick still running');
      return;
    }

    this.running = true;
    this.logger.log('blizzard patch cron tick');
    try {
      try {
        const summary = await this.scraper.sync();
        this.logger.log(`sync ok: ${JSON.stringify(summary)}`);
      } catch (error) {
        this.logger.error('sync failed', error as Error);
        Sentry.captureException(error, { tags: { cron: 'blizzard-patch-sync', phase: 'ko' } });
      }

      try {
        const enSummary = await this.enScraper.sync();
        this.logger.log(`sync:en ok: ${JSON.stringify(enSummary)}`);
      } catch (error) {
        this.logger.error('sync:en failed', error as Error);
        Sentry.captureException(error, { tags: { cron: 'blizzard-patch-sync', phase: 'en' } });
      }
    } finally {
      this.running = false;
    }
  }
}
