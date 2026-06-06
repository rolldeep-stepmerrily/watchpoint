import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import Joi from 'joi';

import { ResponseCacheModule } from '../common/cache';
import { PrismaModule } from '../common/prisma';
import { RedisModule } from '../common/redis';
import { ScraperModule } from '../scraper/scraper.module';
import { SeederModule } from '../seeder';
import { AssetsUploadCommand } from './commands/assets-upload.command';
import { HeroEditCommand } from './commands/hero-edit.command';
import { HeroIconsDownloadCommand } from './commands/hero-icons-download.command';
import { HeroIconsDownloadAllCommand } from './commands/hero-icons-download-all.command';
import { HeroPerksEditCommand } from './commands/hero-perks-edit.command';
import { HeroPortraitDownloadCommand } from './commands/hero-portrait-download.command';
import { HeroPortraitDownloadAllCommand } from './commands/hero-portrait-download-all.command';
import { HeroSyncCommand } from './commands/hero-sync.command';
import { HeroSyncAllCommand } from './commands/hero-sync-all.command';
import { HeroSyncEnCommand } from './commands/hero-sync-en.command';
import { HeroSyncEnAllCommand } from './commands/hero-sync-en-all.command';
import { HeroSyncKoCommand } from './commands/hero-sync-ko.command';
import { HeroSyncKoAllCommand } from './commands/hero-sync-ko-all.command';
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
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        SCRAPER_USER_AGENT: Joi.string().default('WatchpointBot/0.1'),
        SCRAPER_REQUEST_DELAY_MS: Joi.number().default(2000),
        MINIO_ENDPOINT: Joi.string().uri().optional(),
        MINIO_ACCESS_KEY: Joi.string().optional(),
        MINIO_SECRET_KEY: Joi.string().optional(),
        MINIO_BUCKET: Joi.string().default('watchpoint-icons'),
        MINIO_PUBLIC_URL: Joi.string().uri().optional(),
      }).unknown(true),
    }),
    PrismaModule,
    RedisModule,
    ResponseCacheModule,
    ScraperModule,
    SeederModule,
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
    HeroSyncKoCommand,
    HeroSyncKoAllCommand,
    HeroEditCommand,
    HeroPerksEditCommand,
    HeroPortraitDownloadCommand,
    HeroPortraitDownloadAllCommand,
    HeroIconsDownloadCommand,
    HeroIconsDownloadAllCommand,
    AssetsUploadCommand,
  ],
})
export class CliModule {}
