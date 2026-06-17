import { PrismaService } from '@@db';
import { AppException } from '@@exceptions';
import { RedisService } from '@@redis';
import { Injectable } from '@nestjs/common';

import { MONITORING_ERRORS } from '../../monitoring.error';
import type {
  MonitoringLogStatus,
  RecordMonitoringLogResponseDto,
} from '../../presenter/http/dto/record-monitoring-log.dto';

interface RecordMonitoringLogUseCaseProps {
  kind: string;
  status: MonitoringLogStatus;
  total: number;
  passed: number;
  failed: number;
  durationMs?: number;
  fixPrUrl?: string;
  notes?: string;
}

const RATE_LIMIT_TTL_SECONDS = 600;

@Injectable()
export class RecordMonitoringLogUseCase {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * 외부 monitoring routine 결과를 monitoring_logs에 적재. kind별 10분간 1건만 허용.
   *
   * @param {RecordMonitoringLogUseCaseProps} props 적재할 결과
   * @returns {Promise<RecordMonitoringLogResponseDto>} 적재된 id + runAt
   */
  async execute(props: RecordMonitoringLogUseCaseProps): Promise<RecordMonitoringLogResponseDto> {
    await this.assertRateLimit(props.kind);

    const created = await this.prisma.monitoringLog.create({
      data: {
        kind: props.kind,
        status: props.status,
        total: props.total,
        passed: props.passed,
        failed: props.failed,
        durationMs: props.durationMs ?? null,
        fixPrUrl: props.fixPrUrl ?? null,
        notes: props.notes ?? null,
      },
      select: { id: true, runAt: true },
    });

    return { id: created.id, runAt: created.runAt.toISOString() };
  }

  /**
   * kind별 1 req / 10분. Redis SET NX EX로 atomic 락. 이미 키가 있으면 RATE_LIMITED 던짐.
   */
  private async assertRateLimit(kind: string): Promise<void> {
    const key = `monitoring-log:rate:${kind}`;
    const reply = await this.redis.getClient().set(key, '1', 'EX', RATE_LIMIT_TTL_SECONDS, 'NX');
    if (reply !== 'OK') {
      throw new AppException(MONITORING_ERRORS.RATE_LIMITED);
    }
  }
}
