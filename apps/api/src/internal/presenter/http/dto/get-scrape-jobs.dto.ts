import { ApiProperty } from '@nestjs/swagger';
import { SCRAPE_SOURCES, SCRAPE_STATUSES, type ScrapeSource, type ScrapeStatus } from '@watchpoint/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetScrapeJobsRequestDto {
  @ApiProperty({ enum: SCRAPE_SOURCES, required: false })
  @IsOptional()
  @IsIn(SCRAPE_SOURCES)
  source?: ScrapeSource;

  @ApiProperty({ enum: SCRAPE_STATUSES, required: false })
  @IsOptional()
  @IsIn(SCRAPE_STATUSES)
  status?: ScrapeStatus;

  @ApiProperty({ required: false, default: 50, minimum: 1, maximum: 200 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  limit: number = 50;
}

export class ScrapeJobItemDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: SCRAPE_SOURCES })
  source!: ScrapeSource;

  @ApiProperty()
  target!: string;

  @ApiProperty({ enum: SCRAPE_STATUSES })
  status!: ScrapeStatus;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  startedAt!: string;

  @ApiProperty({ nullable: true, description: 'ISO 8601 datetime' })
  finishedAt!: string | null;

  @ApiProperty({ nullable: true })
  error!: string | null;

  @ApiProperty({ nullable: true, type: Object })
  diffSummary!: Record<string, unknown> | null;
}

export class GetScrapeJobsResponseDto {
  @ApiProperty({ type: [ScrapeJobItemDto] })
  items!: ScrapeJobItemDto[];

  @ApiProperty()
  total!: number;
}
