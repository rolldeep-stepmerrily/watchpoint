import { ApiProperty } from '@nestjs/swagger';
import {
  PATCH_NOTE_STATUSES,
  type PaginatedDto,
  type PatchNoteStatus,
  type PatchNoteSummaryDto,
} from '@watchpoint/shared';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export class GetPatchNoteListRequestDto {
  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 20;
}

export class PatchNoteSummaryItemDto implements PatchNoteSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  version!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  releasedAt!: string;

  @ApiProperty()
  sourceUrl!: string;

  @ApiProperty({ nullable: true })
  summary!: string | null;

  @ApiProperty({ enum: PATCH_NOTE_STATUSES })
  status!: PatchNoteStatus;
}

export class GetPatchNoteListResponseDto implements PaginatedDto<PatchNoteSummaryDto> {
  @ApiProperty({ type: [PatchNoteSummaryItemDto] })
  items!: PatchNoteSummaryItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
