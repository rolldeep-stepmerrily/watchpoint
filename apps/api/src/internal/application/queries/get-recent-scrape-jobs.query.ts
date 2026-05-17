import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import { PrismaService } from '@@db';
import type { ScrapeSource, ScrapeStatus } from '@@prisma';

interface GetRecentScrapeJobsQueryProps {
  source?: ScrapeSource;
  status?: ScrapeStatus;
  limit: number;
}

export interface RecentScrapeJobsResult {
  items: Array<{
    id: number;
    source: ScrapeSource;
    target: string;
    status: ScrapeStatus;
    startedAt: Date;
    finishedAt: Date | null;
    error: string | null;
    diffSummary: unknown;
  }>;
  total: number;
}

export class GetRecentScrapeJobsQuery extends Query<RecentScrapeJobsResult> {
  constructor(public readonly props: GetRecentScrapeJobsQueryProps) {
    super();
  }
}

@QueryHandler(GetRecentScrapeJobsQuery)
export class GetRecentScrapeJobsQueryHandler implements IQueryHandler<GetRecentScrapeJobsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetRecentScrapeJobsQuery): Promise<RecentScrapeJobsResult> {
    const { source, status, limit } = query.props;

    const where = {
      ...(source && { source }),
      ...(status && { status }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.scrapeJob.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: limit,
      }),
      this.prisma.scrapeJob.count({ where }),
    ]);

    return { items, total };
  }
}
