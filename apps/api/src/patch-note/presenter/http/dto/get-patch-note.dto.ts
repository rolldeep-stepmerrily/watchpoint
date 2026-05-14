import { ApiProperty } from '@nestjs/swagger';
import {
  ENTRY_CATEGORIES,
  type EntryCategory,
  PATCH_NOTE_STATUSES,
  type PatchNoteDetailDto,
  type PatchNoteEntryDto,
  type PatchNoteStatus,
} from '@watchpoint/shared';

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

export class GetPatchNoteResponseDto implements PatchNoteDetailDto {
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

  @ApiProperty({ type: [PatchNoteEntryItemDto] })
  entries!: PatchNoteEntryItemDto[];
}
