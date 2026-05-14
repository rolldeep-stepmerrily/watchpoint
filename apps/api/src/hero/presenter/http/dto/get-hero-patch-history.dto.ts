import { ApiProperty } from '@nestjs/swagger';
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  type HeroPatchHistoryDto,
  type HeroPatchHistoryItemDto,
  PATCH_NOTE_STATUSES,
  type PatchNoteEntryDto,
  type PatchNoteStatus,
  type PatchNoteSummaryDto,
} from '@watchpoint/shared';
import { HeroSummaryItemDto } from './get-hero-list.dto';

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

export class PatchNoteEntryItemDto implements PatchNoteEntryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: ENTRY_CATEGORIES })
  category!: EntryCategory;

  @ApiProperty({ nullable: true })
  heroId!: number | null;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  body!: string;

  @ApiProperty()
  order!: number;
}

export class HeroPatchHistoryItemResponseDto implements HeroPatchHistoryItemDto {
  @ApiProperty({ type: PatchNoteSummaryItemDto })
  patchNote!: PatchNoteSummaryItemDto;

  @ApiProperty({ type: [PatchNoteEntryItemDto] })
  entries!: PatchNoteEntryItemDto[];
}

export class GetHeroPatchHistoryResponseDto implements HeroPatchHistoryDto {
  @ApiProperty({ type: HeroSummaryItemDto })
  hero!: HeroSummaryItemDto;

  @ApiProperty({ type: [HeroPatchHistoryItemResponseDto] })
  history!: HeroPatchHistoryItemResponseDto[];
}
