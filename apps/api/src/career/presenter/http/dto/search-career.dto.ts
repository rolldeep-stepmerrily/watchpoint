import { ApiProperty } from '@nestjs/swagger';
import type { CareerSearchResultDto } from '@watchpoint/shared';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class SearchCareerRequestDto {
  @ApiProperty({ description: '플레이어 이름 또는 BattleTag (예: TeKrop)' })
  @IsString()
  @MaxLength(40)
  q!: string;

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
  @Max(50)
  pageSize: number = 20;
}

export type SearchCareerResponseDto = CareerSearchResultDto;
