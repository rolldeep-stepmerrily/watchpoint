export type ScrapeSource =
  | 'BLIZZARD_PATCH_NOTES'
  | 'BLIZZARD_PATCH_NOTES_EN'
  | 'BLIZZARD_HERO_EN'
  | 'BLIZZARD_HERO_KO'
  | 'NAMUWIKI_HERO';

export const SCRAPE_SOURCES = [
  'BLIZZARD_PATCH_NOTES',
  'BLIZZARD_PATCH_NOTES_EN',
  'BLIZZARD_HERO_EN',
  'BLIZZARD_HERO_KO',
  'NAMUWIKI_HERO',
] as const satisfies readonly ScrapeSource[];
