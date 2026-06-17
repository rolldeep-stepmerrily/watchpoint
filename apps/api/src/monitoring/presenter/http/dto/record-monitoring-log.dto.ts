import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export const MONITORING_LOG_STATUSES = ['pass', 'fail', 'transient'] as const;
export type MonitoringLogStatus = (typeof MONITORING_LOG_STATUSES)[number];

const MAX_NOTES_LENGTH = 2_000;
const MAX_URL_LENGTH = 500;
const MAX_KIND_LENGTH = 64;

export class RecordMonitoringLogRequestDto {
  @ApiProperty({ example: 'prod-smoke', maxLength: MAX_KIND_LENGTH })
  @IsString()
  @MaxLength(MAX_KIND_LENGTH)
  kind!: string;

  @ApiProperty({ enum: MONITORING_LOG_STATUSES })
  @IsIn(MONITORING_LOG_STATUSES)
  status!: MonitoringLogStatus;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  total!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  passed!: number;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  failed!: number;

  @ApiProperty({ required: false, minimum: 0, maximum: 3_600_000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(3_600_000)
  durationMs?: number;

  @ApiProperty({ required: false, maxLength: MAX_URL_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_URL_LENGTH)
  fixPrUrl?: string;

  @ApiProperty({ required: false, maxLength: MAX_NOTES_LENGTH })
  @IsOptional()
  @IsString()
  @MaxLength(MAX_NOTES_LENGTH)
  notes?: string;
}

export class RecordMonitoringLogResponseDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  runAt!: string;
}
