export type ScrapeSource = 'BLIZZARD_PATCH_NOTES' | 'NAMUWIKI_HERO';

export const SCRAPE_SOURCES = ['BLIZZARD_PATCH_NOTES', 'NAMUWIKI_HERO'] as const satisfies readonly ScrapeSource[];
