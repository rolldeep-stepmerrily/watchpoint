import { Module } from '@nestjs/common';

import { ListMonitoringLogsQueryHandler } from './application/queries/list-monitoring-logs.query';
import { ListMonitoringLogsUseCase } from './application/use-cases/list-monitoring-logs.use-case';
import { RecordMonitoringLogUseCase } from './application/use-cases/record-monitoring-log.use-case';
import { MonitoringTokenGuard } from './guards/monitoring-token.guard';
import { MonitoringHttpController } from './presenter/http/monitoring.http.controller';

@Module({
  controllers: [MonitoringHttpController],
  providers: [
    /** guards */
    MonitoringTokenGuard,

    /** query-handlers */
    ListMonitoringLogsQueryHandler,

    /** use-cases */
    RecordMonitoringLogUseCase,
    ListMonitoringLogsUseCase,
  ],
})
export class MonitoringModule {}
