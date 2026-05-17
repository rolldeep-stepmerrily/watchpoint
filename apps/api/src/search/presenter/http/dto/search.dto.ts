import { ApiProperty } from '@nestjs/swagger';
import {
  HERO_ROLES,
  type HeroRole,
  type HeroSummaryDto,
  PATCH_NOTE_STATUSES,
  type PatchNoteStatus,
  type PatchNoteSummaryDto,
  type SearchResponseDto,
} from '@watchpoint/shared';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchRequestDto {
  @ApiProperty({ description: '검색어 (영웅명/코드네임/패치 version/title/summary)', minLength: 1, maxLength: 50 })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  q!: string;
}

class HeroSummaryItemDto implements HeroSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  codename!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: HERO_ROLES })
  role!: HeroRole;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  releasedAt!: string;

  @ApiProperty({ nullable: true })
  portraitUrl!: string | null;
}

class PatchNoteSummaryItemDto implements PatchNoteSummaryDto {
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

export class GetSearchResponseDto implements SearchResponseDto {
  @ApiProperty({ type: [HeroSummaryItemDto] })
  heroes!: HeroSummaryItemDto[];

  @ApiProperty({ type: [PatchNoteSummaryItemDto] })
  patchNotes!: PatchNoteSummaryItemDto[];
}
