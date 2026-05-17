import { Module } from '@nestjs/common';

import { GetRecentScrapeJobsQueryHandler } from './application/queries/get-recent-scrape-jobs.query';
import { CheckHealthUseCase } from './application/use-cases/check-health.use-case';
import { GetRecentScrapeJobsUseCase } from './application/use-cases/get-recent-scrape-jobs.use-case';
import { InternalHttpController } from './presenter/http/internal.http.controller';

@Module({
  controllers: [InternalHttpController],
  providers: [
    /** query-handlers */
    GetRecentScrapeJobsQueryHandler,

    /** use-cases */
    CheckHealthUseCase,
    GetRecentScrapeJobsUseCase,
  ],
})
export class InternalModule {}
