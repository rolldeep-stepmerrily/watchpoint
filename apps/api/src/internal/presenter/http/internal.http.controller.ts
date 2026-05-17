import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';
import { GetRecentScrapeJobsUseCase } from '../../application/use-cases/get-recent-scrape-jobs.use-case';
import { IsLocalhostGuard } from '../../guards/is-localhost.guard';
import { GetHealthResponseDto } from './dto/get-health.dto';
import { GetScrapeJobsRequestDto, GetScrapeJobsResponseDto } from './dto/get-scrape-jobs.dto';
import { InternalRouter } from './internal.path.presenter';

@ApiTags(InternalRouter.HttpApiTags)
@UseGuards(IsLocalhostGuard)
@Controller(InternalRouter.Root)
export class InternalHttpController {
  constructor(
    private readonly checkHealthUseCase: CheckHealthUseCase,
    private readonly getRecentScrapeJobsUseCase: GetRecentScrapeJobsUseCase,
  ) {}

  @ApiOperation({ summary: 'DB + Redis 헬스체크 (로컬 전용)' })
  @Get(InternalRouter.Http.GetHealth)
  async getHealth(): Promise<GetHealthResponseDto> {
    return await this.checkHealthUseCase.execute();
  }

  @ApiOperation({ summary: '최근 스크래핑 잡 상태 (로컬 전용)' })
  @Get(InternalRouter.Http.GetScrapeJobs)
  async getScrapeJobs(@Query() queryDto: GetScrapeJobsRequestDto): Promise<GetScrapeJobsResponseDto> {
    return await this.getRecentScrapeJobsUseCase.execute(queryDto);
  }
}
