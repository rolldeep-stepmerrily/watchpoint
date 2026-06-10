import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron } from '@nestjs/schedule';
import { BlizzardPatchScraper } from './blizzard-patch.scraper';
import { BlizzardPatchEnScraper } from './blizzard-patch-en.scraper';

@Injectable()
export class BlizzardPatchCron {
  private readonly logger = new Logger(BlizzardPatchCron.name);
  private readonly enabled: boolean;

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

    this.logger.log('blizzard patch cron tick');
    try {
      const summary = await this.scraper.sync();
      this.logger.log(`sync ok: ${JSON.stringify(summary)}`);
    } catch (error) {
      this.logger.error('sync failed', error as Error);
    }

    try {
      const enSummary = await this.enScraper.sync();
      this.logger.log(`sync:en ok: ${JSON.stringify(enSummary)}`);
    } catch (error) {
      this.logger.error('sync:en failed', error as Error);
    }
  }
}
