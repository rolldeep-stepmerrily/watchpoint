export interface ParsedAbilityEn {
  /** 페이지 등장 순서 (0부터) */
  index: number;
  name: string;
  description: string;
}

export interface ParsedHeroEn {
  codename: string;
  name: string;
  description: string | null;
  abilities: ParsedAbilityEn[];
  sourceUrl: string;
}
