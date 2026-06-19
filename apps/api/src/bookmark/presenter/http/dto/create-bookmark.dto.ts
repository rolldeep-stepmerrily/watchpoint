import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

import { BOOKMARK_KINDS, type BookmarkKindValue } from '../../../entities/bookmark.entity';

const MAX_TARGET_ID_LENGTH = 128;

export class CreateBookmarkDto {
  @ApiProperty({ enum: BOOKMARK_KINDS })
  @IsIn(BOOKMARK_KINDS)
  kind!: BookmarkKindValue;

  @ApiProperty({ maxLength: MAX_TARGET_ID_LENGTH })
  @IsString()
  @MaxLength(MAX_TARGET_ID_LENGTH)
  targetId!: string;

  @ApiProperty({ required: false, type: Object })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
