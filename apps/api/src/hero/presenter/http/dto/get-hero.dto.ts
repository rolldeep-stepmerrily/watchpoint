import { ApiProperty } from '@nestjs/swagger';
import {
  ABILITY_SLOTS,
  type AbilitySlot,
  HERO_ROLES,
  type HeroAbilityDto,
  type HeroDetailDto,
  type HeroRole,
  type HeroStatDto,
} from '@watchpoint/shared';

export class HeroStatItemDto implements HeroStatDto {
  @ApiProperty()
  health!: number;

  @ApiProperty()
  armor!: number;

  @ApiProperty()
  shield!: number;

  @ApiProperty({ description: 'm/s' })
  moveSpeed!: number;

  @ApiProperty({ nullable: true, description: '영웅별 추가 수치 (자유 형식)' })
  extras!: Record<string, unknown> | null;
}

export class HeroAbilityItemDto implements HeroAbilityDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: ABILITY_SLOTS })
  slot!: AbilitySlot;

  @ApiProperty({ nullable: true, description: '키 바인드 표기 (LMB, Shift, E 등)' })
  key!: string | null;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true, description: '데미지/쿨다운/사거리 등 정형 수치' })
  stats!: Record<string, unknown> | null;

  @ApiProperty()
  order!: number;
}

export class GetHeroResponseDto implements HeroDetailDto {
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

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true, description: '나무위키 등 1차 출처' })
  sourceUrl!: string | null;

  @ApiProperty({ type: HeroStatItemDto, nullable: true })
  stat!: HeroStatItemDto | null;

  @ApiProperty({ type: [HeroAbilityItemDto] })
  abilities!: HeroAbilityItemDto[];
}
