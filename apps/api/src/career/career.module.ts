import { Module } from '@nestjs/common';

import { GetCareerStatsUseCase } from './application/use-cases/get-career-stats.use-case';
import { GetCareerSummaryUseCase } from './application/use-cases/get-career-summary.use-case';
import { SearchCareerUseCase } from './application/use-cases/search-career.use-case';
import { CareerLookupLogInterceptor } from './infrastructure/career-lookup-log.interceptor';
import { OverFastClient } from './infrastructure/overfast.client';
import { CareerHttpController } from './presenter/http/career.http.controller';

@Module({
  controllers: [CareerHttpController],
  providers: [
    /** infrastructure */
    OverFastClient,
    CareerLookupLogInterceptor,

    /** use-cases */
    GetCareerStatsUseCase,
    GetCareerSummaryUseCase,
    SearchCareerUseCase,
  ],
})
export class CareerModule {}
