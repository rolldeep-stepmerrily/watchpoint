import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import Joi from 'joi';
import { AuthModule } from './auth/auth.module';
import { CareerModule } from './career/career.module';
import { ResponseCacheModule } from './common/cache';
import { GlobalCqrsModule } from './common/cqrs';
import { HttpLoggerMiddleware, RequestIdMiddleware } from './common/middlewares';
import { PrismaModule } from './common/prisma';
import { RedisModule, RedisThrottlerStorage } from './common/redis';
import { HeroModule } from './hero/hero.module';
import { InternalModule } from './internal/internal.module';
import { MonitoringModule } from './monitoring/monitoring.module';
import { PatchNoteModule } from './patch-note/patch-note.module';
import { ScraperModule } from './scraper/scraper.module';
import { SearchModule } from './search/search.module';
import { SeederModule } from './seeder';
import { UsersModule } from './users/users.module';

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
        MONITORING_INGEST_KEY: Joi.string().min(16).optional(),
        JWT_ACCESS_SECRET: Joi.string().min(32).required(),
        JWT_ACCESS_EXPIRES_IN: Joi.string().default('15m'),
        JWT_REFRESH_SECRET: Joi.string().min(32).required(),
        JWT_REFRESH_EXPIRES_IN: Joi.string().default('7d'),
        REFRESH_TOKEN_TTL_DAYS: Joi.number().default(7),
        GITHUB_CLIENT_ID: Joi.string().optional(),
        GITHUB_CLIENT_SECRET: Joi.string().optional(),
        GITHUB_CALLBACK_URL: Joi.string().uri().optional(),
        // /auth/github/callback에서 web 주소로 redirect할 때 사용. Joi에선 optional이지만
        // 콜백 핸들러는 getOrThrow → GitHub 로그인 사용 시 반드시 prod env에 설정 필요.
        WEB_PUBLIC_URL: Joi.string().uri().optional(),
        AUTO_SEED_ON_BOOT: Joi.string().valid('true', 'false').default('false'),
        MINIO_ENDPOINT: Joi.string().uri().optional(),
        MINIO_ACCESS_KEY: Joi.string().optional(),
        MINIO_SECRET_KEY: Joi.string().optional(),
        MINIO_BUCKET: Joi.string().default('watchpoint-icons'),
        MINIO_PUBLIC_URL: Joi.string().uri().optional(),
        SENTRY_DSN: Joi.string().uri().optional(),
        WEB_REVALIDATE_URL: Joi.string().uri().optional(),
        WEB_REVALIDATE_SECRET: Joi.string().min(16).optional(),
        OVERFAST_API_BASE_URL: Joi.string().uri().default('https://overfast-api.tekrop.fr'),
      }),
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validationOptions: { abortEarly: true },
    }),
    GlobalCqrsModule,
    PrismaModule,
    ResponseCacheModule,
    AuthModule,
    CareerModule,
    HeroModule,
    InternalModule,
    MonitoringModule,
    PatchNoteModule,
    ScraperModule,
    SearchModule,
    SeederModule,
    UsersModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware, HttpLoggerMiddleware).forRoutes('{*splat}');
  }
}
