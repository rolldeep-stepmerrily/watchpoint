import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

import { MONITORING_LOG_STATUSES, type MonitoringLogStatus } from './record-monitoring-log.dto';

export class ListMonitoringLogsRequestDto {
  @ApiProperty({ required: false, maxLength: 64 })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  kind?: string;

  @ApiProperty({ enum: MONITORING_LOG_STATUSES, required: false })
  @IsOptional()
  @IsIn(MONITORING_LOG_STATUSES)
  status?: MonitoringLogStatus;

  @ApiProperty({ required: false, default: 30, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 30;
}

export class MonitoringLogItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  runAt!: string;

  @ApiProperty()
  kind!: string;

  @ApiProperty({ enum: MONITORING_LOG_STATUSES })
  status!: MonitoringLogStatus;

  @ApiProperty()
  total!: number;

  @ApiProperty()
  passed!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ nullable: true })
  durationMs!: number | null;

  @ApiProperty({ nullable: true })
  fixPrUrl!: string | null;

  @ApiProperty({ nullable: true })
  notes!: string | null;
}

export class ListMonitoringLogsResponseDto {
  @ApiProperty({ type: [MonitoringLogItemDto] })
  items!: MonitoringLogItemDto[];

  @ApiProperty()
  total!: number;
}
