import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

import { BOOKMARK_KINDS, BookmarkEntity, type BookmarkKindValue } from '../../../entities/bookmark.entity';

export class ListBookmarksRequestDto {
  @ApiProperty({ enum: BOOKMARK_KINDS, required: false })
  @IsOptional()
  @IsIn(BOOKMARK_KINDS)
  kind?: BookmarkKindValue;
}

export class ListBookmarksResponseDto {
  @ApiProperty({ type: [BookmarkEntity] })
  items!: BookmarkEntity[];
}
