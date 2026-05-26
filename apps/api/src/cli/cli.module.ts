import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

import { PrismaModule } from '../common/prisma';
import { ScraperModule } from '../scraper/scraper.module';
import { HeroEditCommand } from './commands/hero-edit.command';
import { HeroSyncCommand } from './commands/hero-sync.command';
import { HeroSyncAllCommand } from './commands/hero-sync-all.command';
import { HeroSyncEnCommand } from './commands/hero-sync-en.command';
import { HeroSyncEnAllCommand } from './commands/hero-sync-en-all.command';
import { PatchBackfillCommand } from './commands/patch-backfill.command';
import { PatchListCommand } from './commands/patch-list.command';
import { PatchReviewCommand } from './commands/patch-review.command';
import { PatchSyncCommand } from './commands/patch-sync.command';
import { PatchSyncEnCommand } from './commands/patch-sync-en.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('local', 'development', 'production').default('local'),
        DATABASE_URL: Joi.string().required(),
        SCRAPER_USER_AGENT: Joi.string().default('WatchpointBot/0.1'),
        SCRAPER_REQUEST_DELAY_MS: Joi.number().default(2000),
      }).unknown(true),
    }),
    PrismaModule,
    ScraperModule,
  ],
  providers: [
    PatchSyncCommand,
    PatchSyncEnCommand,
    PatchBackfillCommand,
    PatchListCommand,
    PatchReviewCommand,
    HeroSyncCommand,
    HeroSyncAllCommand,
    HeroSyncEnCommand,
    HeroSyncEnAllCommand,
    HeroEditCommand,
  ],
})
export class CliModule {}
