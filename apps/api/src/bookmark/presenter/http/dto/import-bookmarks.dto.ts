import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, ValidateNested } from 'class-validator';

import { CreateBookmarkDto } from './create-bookmark.dto';

const MAX_IMPORT_ITEMS = 200;

export class ImportBookmarksDto {
  @ApiProperty({ type: [CreateBookmarkDto], maxItems: MAX_IMPORT_ITEMS })
  @IsArray()
  @ArrayMaxSize(MAX_IMPORT_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => CreateBookmarkDto)
  items!: CreateBookmarkDto[];
}

export class ImportBookmarksResponseDto {
  @ApiProperty({ description: '실제 적재된 건수 (중복/한도 초과 제외)' })
  inserted!: number;

  @ApiProperty({ description: '중복 또는 한도 초과로 스킵된 건수' })
  skipped!: number;
}
