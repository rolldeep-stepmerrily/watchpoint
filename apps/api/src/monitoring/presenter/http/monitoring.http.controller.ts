import { Body, Controller, Get, HttpCode, HttpStatus, Post, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

import { ListMonitoringLogsUseCase } from '../../application/use-cases/list-monitoring-logs.use-case';
import { RecordMonitoringLogUseCase } from '../../application/use-cases/record-monitoring-log.use-case';
import { MonitoringTokenGuard } from '../../guards/monitoring-token.guard';
import { ListMonitoringLogsRequestDto, ListMonitoringLogsResponseDto } from './dto/list-monitoring-logs.dto';
import { RecordMonitoringLogRequestDto, RecordMonitoringLogResponseDto } from './dto/record-monitoring-log.dto';
import { MonitoringRouter } from './monitoring.path.presenter';

@ApiTags(MonitoringRouter.HttpApiTags)
@UseGuards(MonitoringTokenGuard)
@Controller(MonitoringRouter.Root)
export class MonitoringHttpController {
  constructor(
    private readonly recordMonitoringLogUseCase: RecordMonitoringLogUseCase,
    private readonly listMonitoringLogsUseCase: ListMonitoringLogsUseCase,
  ) {}

  @ApiOperation({ summary: '모니터링 routine 결과 적재 (scoped token 인증)' })
  @HttpCode(HttpStatus.CREATED)
  @Post(MonitoringRouter.Http.Record)
  async record(@Body() bodyDto: RecordMonitoringLogRequestDto): Promise<RecordMonitoringLogResponseDto> {
    return await this.recordMonitoringLogUseCase.execute(bodyDto);
  }

  @ApiOperation({ summary: '모니터링 로그 조회 (kind/status 필터)' })
  @Get(MonitoringRouter.Http.List)
  async list(@Query() queryDto: ListMonitoringLogsRequestDto): Promise<ListMonitoringLogsResponseDto> {
    return await this.listMonitoringLogsUseCase.execute(queryDto);
  }
}
