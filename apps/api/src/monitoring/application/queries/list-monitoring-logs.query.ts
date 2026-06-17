import { PrismaService } from '@@db';
import { IQueryHandler, Query, QueryHandler } from '@nestjs/cqrs';

import type { MonitoringLogStatus } from '../../presenter/http/dto/record-monitoring-log.dto';

interface ListMonitoringLogsQueryProps {
  kind?: string;
  status?: MonitoringLogStatus;
  limit: number;
}

export interface MonitoringLogsResult {
  items: Array<{
    id: number;
    runAt: Date;
    kind: string;
    status: string;
    total: number;
    passed: number;
    failed: number;
    durationMs: number | null;
    fixPrUrl: string | null;
    notes: string | null;
  }>;
  total: number;
}

export class ListMonitoringLogsQuery extends Query<MonitoringLogsResult> {
  constructor(public readonly props: ListMonitoringLogsQueryProps) {
    super();
  }
}

@QueryHandler(ListMonitoringLogsQuery)
export class ListMonitoringLogsQueryHandler implements IQueryHandler<ListMonitoringLogsQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: ListMonitoringLogsQuery): Promise<MonitoringLogsResult> {
    const { kind, status, limit } = query.props;

    const where = {
      ...(kind && { kind }),
      ...(status && { status }),
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.monitoringLog.findMany({
        where,
        orderBy: { runAt: 'desc' },
        take: limit,
      }),
      this.prisma.monitoringLog.count({ where }),
    ]);

    return { items, total };
  }
}
