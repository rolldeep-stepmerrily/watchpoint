import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Joi from 'joi';

import { ResponseCacheModule } from './common/cache';
import { GlobalCqrsModule } from './common/cqrs';
import { HttpLoggerMiddleware } from './common/middlewares';
import { PrismaModule } from './common/prisma';
import { RedisModule, RedisThrottlerStorage } from './common/redis';
import { HeroModule } from './hero/hero.module';
import { InternalModule } from './internal/internal.module';
import { PatchNoteModule } from './patch-note/patch-note.module';
import { ScraperModule } from './scraper/scraper.module';
import { SearchModule } from './search/search.module';
import { SeederModule } from './seeder';

@Module({
  imports: [
    RedisModule,
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      inject: [RedisThrottlerStorage],
      useFactory: (redisThrottlerStorage: RedisThrottlerStorage) => ({
        throttlers: [{ name: 'default', ttl: 60_000, limit: 240 }],
        storage: redisThrottlerStorage,
      }),
    }),
    ConfigModule.forRoot({
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('local', 'development', 'production').default('development'),
        PORT: Joi.number().optional(),
        API_PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        REDIS_HOST: Joi.string().required(),
        REDIS_PORT: Joi.number().default(6379),
        REDIS_PASSWORD: Joi.string().allow('').optional(),
        SCRAPER_USER_AGENT: Joi.string().default('WatchpointBot/0.1'),
        SCRAPER_PATCH_CRON: Joi.string().default('0 */6 * * *'),
        SCRAPER_REQUEST_DELAY_MS: Joi.number().default(2000),
        SCRAPER_CRON_ENABLED: Joi.boolean().default(false),
        INTERNAL_API_KEY: Joi.string().min(16).optional(),
        AUTO_SEED_ON_BOOT: Joi.string().valid('true', 'false').default('false'),
        MINIO_ENDPOINT: Joi.string().uri().optional(),
        MINIO_ACCESS_KEY: Joi.string().optional(),
        MINIO_SECRET_KEY: Joi.string().optional(),
        MINIO_BUCKET: Joi.string().default('watchpoint-icons'),
        MINIO_PUBLIC_URL: Joi.string().uri().optional(),
        SENTRY_DSN: Joi.string().uri().optional(),
        WEB_REVALIDATE_URL: Joi.string().uri().optional(),
        WEB_REVALIDATE_SECRET: Joi.string().min(16).optional(),
      }),
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationOptions: { abortEarly: true },
    }),
    GlobalCqrsModule,
    PrismaModule,
    ResponseCacheModule,
    HeroModule,
    InternalModule,
    PatchNoteModule,
    ScraperModule,
    SearchModule,
    SeederModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(HttpLoggerMiddleware).forRoutes('{*splat}');
  }
}
