export interface ParsedAbilityEn {
  /** 페이지 등장 순서 (0부터) */
  index: number;
  /** Blizzard 페이지의 ability id (예: "fusion-cannons"). ABILITY_ID_TO_SLOT 매칭에 사용 */
  id: string;
  name: string;
  description: string;
}

export interface ParsedPerkEn {
  /** MINOR | MAJOR */
  tier: 'MINOR' | 'MAJOR';
  /** 1 = left, 2 = right */
  slot: 1 | 2;
  name: string;
  description: string;
}

export interface ParsedHeroEn {
  codename: string;
  name: string;
  description: string | null;
  abilities: ParsedAbilityEn[];
  perks: ParsedPerkEn[];
  sourceUrl: string;
}
