import { ApiProperty } from '@nestjs/swagger';
import {
  HERO_ROLES,
  type HeroRole,
  type HeroSummaryDto,
  type PaginatedDto,
  SUBROLES,
  type Subrole,
} from '@watchpoint/shared';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

export class GetHeroListRequestDto {
  @ApiProperty({ enum: HERO_ROLES, required: false })
  @IsOptional()
  @IsIn(HERO_ROLES)
  role?: HeroRole;

  @ApiProperty({ required: false, description: '이름/코드네임 부분 검색' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  q?: string;

  @ApiProperty({ required: false, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiProperty({ required: false, default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize: number = 50;
}

export class HeroSummaryItemDto implements HeroSummaryDto {
  @ApiProperty()
  id!: number;

  @ApiProperty()
  codename!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ enum: HERO_ROLES })
  role!: HeroRole;

  @ApiProperty({ enum: SUBROLES, description: '서브 역할군 (Reign of Talon 시즌1 도입)' })
  subrole!: Subrole;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  releasedAt!: string;

  @ApiProperty({ nullable: true })
  portraitUrl!: string | null;
}

export class GetHeroListResponseDto implements PaginatedDto<HeroSummaryDto> {
  @ApiProperty({ type: [HeroSummaryItemDto] })
  items!: HeroSummaryItemDto[];

  @ApiProperty()
  total!: number;

  @ApiProperty()
  page!: number;

  @ApiProperty()
  pageSize!: number;
}
