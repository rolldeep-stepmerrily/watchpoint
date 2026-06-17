import { TypedQueryBus } from '@@cqrs';
import { Injectable } from '@nestjs/common';

import type { ListMonitoringLogsResponseDto } from '../../presenter/http/dto/list-monitoring-logs.dto';
import type { MonitoringLogStatus } from '../../presenter/http/dto/record-monitoring-log.dto';
import { ListMonitoringLogsQuery } from '../queries/list-monitoring-logs.query';

interface ListMonitoringLogsUseCaseProps {
  kind?: string;
  status?: MonitoringLogStatus;
  limit: number;
}

@Injectable()
export class ListMonitoringLogsUseCase {
  constructor(private readonly queryBus: TypedQueryBus<ListMonitoringLogsQuery>) {}

  /**
   * monitoring 로그 목록 조회 (kind/status 필터, 기본 limit=30, runAt desc).
   *
   * @param {ListMonitoringLogsUseCaseProps} props 필터/limit
   * @returns {Promise<ListMonitoringLogsResponseDto>} 로그 + 총 건수
   */
  async execute(props: ListMonitoringLogsUseCaseProps): Promise<ListMonitoringLogsResponseDto> {
    const { items, total } = await this.queryBus.execute(
      new ListMonitoringLogsQuery({
        kind: props.kind,
        status: props.status,
        limit: props.limit,
      }),
    );

    return {
      items: items.map((log) => ({
        id: log.id,
        runAt: log.runAt.toISOString(),
        kind: log.kind,
        status: log.status as MonitoringLogStatus,
        total: log.total,
        passed: log.passed,
        failed: log.failed,
        durationMs: log.durationMs,
        fixPrUrl: log.fixPrUrl,
        notes: log.notes,
      })),
      total,
    };
  }
}
