import type { AbilitySlot, HeroRole } from '@@prisma';

export interface ParsedHeroAbility {
  slot: AbilitySlot;
  key: string | null;
  name: string;
  description: string;
  stats: Record<string, unknown> | null;
  order: number;
}

export interface ParsedHeroStat {
  health: number;
  armor: number;
  shield: number;
  moveSpeed: number;
  extras: Record<string, unknown> | null;
}

export interface ParsedHero {
  codename: string;
  name: string;
  role: HeroRole;
  releasedAt: Date | null;
  portraitUrl: string | null;
  description: string | null;
  sourceUrl: string;
  stat: ParsedHeroStat | null;
  abilities: ParsedHeroAbility[];
}
