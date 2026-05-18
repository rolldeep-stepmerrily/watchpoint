import { Injectable } from '@nestjs/common';
import type { ScrapeSource, ScrapeStatus } from '@watchpoint/shared';

import { TypedQueryBus } from '@@cqrs';
import type { ScrapeSource as PrismaScrapeSource, ScrapeStatus as PrismaScrapeStatus } from '@@prisma';

import { GetScrapeJobsResponseDto } from '../../presenter/http/dto/get-scrape-jobs.dto';
import { GetRecentScrapeJobsQuery } from '../queries/get-recent-scrape-jobs.query';

interface GetRecentScrapeJobsUseCaseProps {
  source?: ScrapeSource;
  status?: ScrapeStatus;
  limit: number;
}

@Injectable()
export class GetRecentScrapeJobsUseCase {
  constructor(private readonly queryBus: TypedQueryBus<GetRecentScrapeJobsQuery>) {}

  /**
   * 최근 스크래핑 잡 조회 (source/status 필터, 기본 limit=50).
   *
   * @param {GetRecentScrapeJobsUseCaseProps} props 필터/limit
   * @returns {Promise<GetScrapeJobsResponseDto>} 잡 목록
   */
  async execute(props: GetRecentScrapeJobsUseCaseProps): Promise<GetScrapeJobsResponseDto> {
    const { items, total } = await this.queryBus.execute(
      new GetRecentScrapeJobsQuery({
        source: props.source as PrismaScrapeSource | undefined,
        status: props.status as PrismaScrapeStatus | undefined,
        limit: props.limit,
      }),
    );

    return {
      items: items.map((job) => ({
        id: job.id,
        source: job.source,
        target: job.target,
        status: job.status,
        startedAt: job.startedAt.toISOString(),
        finishedAt: job.finishedAt?.toISOString() ?? null,
        error: job.error,
        diffSummary: job.diffSummary as Record<string, unknown> | null,
      })),
      total,
    };
  }
}
