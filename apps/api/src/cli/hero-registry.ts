import { HERO_CATALOG, type HeroCatalogEntry } from '../domain/hero-catalog';

export interface HeroRegistryEntry {
  pageTitle: string;
  koreanName: string;
}

export const HERO_REGISTRY: Record<string, HeroRegistryEntry> = Object.fromEntries(
  HERO_CATALOG.map((entry: HeroCatalogEntry) => [
    entry.codename,
    { pageTitle: entry.pageTitle, koreanName: entry.name },
  ]),
);

export const HERO_CODENAMES = Object.keys(HERO_REGISTRY);
