import { ApiProperty } from '@nestjs/swagger';
import { ENTRY_CATEGORIES, type EntryCategory } from '@watchpoint/shared';
import { IsIn, IsOptional } from 'class-validator';
import { PatchNoteEntryItemDto } from './get-patch-note.dto';

export class GetPatchNoteEntriesRequestDto {
  @ApiProperty({ enum: ENTRY_CATEGORIES, required: false })
  @IsOptional()
  @IsIn(ENTRY_CATEGORIES)
  category?: EntryCategory;
}

export class GetPatchNoteEntriesResponseDto {
  @ApiProperty({ type: [PatchNoteEntryItemDto] })
  entries!: PatchNoteEntryItemDto[];
}
