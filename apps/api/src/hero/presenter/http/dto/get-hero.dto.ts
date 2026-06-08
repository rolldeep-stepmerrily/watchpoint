import { ApiProperty } from '@nestjs/swagger';
import {
  ABILITY_SLOTS,
  type AbilitySlot,
  HERO_ROLES,
  type HeroAbilityDto,
  type HeroDetailDto,
  type HeroPerkDto,
  type HeroRole,
  type HeroStatDto,
  PERK_TIERS,
  type PerkTier,
  SUBROLES,
  type Subrole,
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

  @ApiProperty({ nullable: true, description: '자체 호스팅된 아이콘 이미지 경로 (/icons/...)' })
  iconUrl!: string | null;

  @ApiProperty()
  order!: number;
}

export class HeroPerkItemDto implements HeroPerkDto {
  @ApiProperty()
  id!: number;

  @ApiProperty({ enum: PERK_TIERS, description: '보조(MINOR) / 주요(MAJOR) 특전 구분' })
  tier!: PerkTier;

  @ApiProperty({ description: '같은 tier 내 선택지 인덱스 (1 또는 2)' })
  slot!: number;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  description!: string;

  @ApiProperty({ nullable: true, description: '특전별 수치 (자유 형식)' })
  stats!: Record<string, unknown> | null;

  @ApiProperty({ nullable: true, description: '특전 아이콘 URL (이미지 자체 호스팅 도입 전까지 미충전)' })
  iconUrl!: string | null;
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

  @ApiProperty({ enum: SUBROLES, description: '서브 역할군 (Reign of Talon 시즌1 도입)' })
  subrole!: Subrole;

  @ApiProperty({ description: 'ISO 8601 datetime' })
  releasedAt!: string;

  @ApiProperty({ nullable: true })
  portraitUrl!: string | null;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ nullable: true, description: 'Blizzard 공식 영웅 페이지 등 1차 출처' })
  sourceUrl!: string | null;

  @ApiProperty({ type: HeroStatItemDto, nullable: true })
  stat!: HeroStatItemDto | null;

  @ApiProperty({ type: [HeroAbilityItemDto] })
  abilities!: HeroAbilityItemDto[];

  @ApiProperty({ type: [HeroPerkItemDto], description: '특전 (영웅당 MINOR 2 + MAJOR 2 = 최대 4개)' })
  perks!: HeroPerkItemDto[];
}
