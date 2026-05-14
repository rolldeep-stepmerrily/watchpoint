import type { AbilitySlot, HeroRole } from '../enums';

export interface HeroSummaryDto {
  id: number;
  codename: string;
  name: string;
  role: HeroRole;
  releasedAt: string;
  portraitUrl: string | null;
}

export interface HeroDetailDto extends HeroSummaryDto {
  description: string | null;
  sourceUrl: string | null;
  stat: HeroStatDto | null;
  abilities: HeroAbilityDto[];
}

export interface HeroStatDto {
  health: number;
  armor: number;
  shield: number;
  moveSpeed: number;
  extras: Record<string, unknown> | null;
}

export interface HeroAbilityDto {
  id: number;
  slot: AbilitySlot;
  key: string | null;
  name: string;
  description: string;
  stats: Record<string, unknown> | null;
  order: number;
}
