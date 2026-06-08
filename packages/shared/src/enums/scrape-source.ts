export type ScrapeSource =
  | 'BLIZZARD_PATCH_NOTES'
  | 'BLIZZARD_PATCH_NOTES_EN'
  | 'BLIZZARD_HERO_EN'
  | 'BLIZZARD_HERO_KO'
  /** @deprecated 나무위키 출처 제거됨. 기존 ScrapeJob row 호환을 위해 enum value만 유지. */
  | 'NAMUWIKI_HERO';

export const SCRAPE_SOURCES = [
  'BLIZZARD_PATCH_NOTES',
  'BLIZZARD_PATCH_NOTES_EN',
  'BLIZZARD_HERO_EN',
  'BLIZZARD_HERO_KO',
  'NAMUWIKI_HERO',
] as const satisfies readonly ScrapeSource[];
