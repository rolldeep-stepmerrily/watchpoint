export type ScrapeSource =
  | 'BLIZZARD_PATCH_NOTES'
  | 'BLIZZARD_PATCH_NOTES_EN'
  | 'BLIZZARD_HERO_EN'
  | 'BLIZZARD_HERO_KO'
  /** 한국어 명칭/아이콘 보강 + 영웅 국적 등 메타 추출용. CC BY-NC-SA 2.0 KR. */
  | 'NAMUWIKI_HERO';

export const SCRAPE_SOURCES = [
  'BLIZZARD_PATCH_NOTES',
  'BLIZZARD_PATCH_NOTES_EN',
  'BLIZZARD_HERO_EN',
  'BLIZZARD_HERO_KO',
  'NAMUWIKI_HERO',
] as const satisfies readonly ScrapeSource[];
