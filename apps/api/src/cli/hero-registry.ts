import type { HeroRole } from '@@prisma';

import { HERO_CATALOG, type HeroCatalogEntry } from '../domain/hero-catalog';

export interface HeroRegistryEntry {
  pageTitle: string;
  koreanName: string;
  role: HeroRole;
  releasedAt: Date;
}

export const HERO_REGISTRY: Record<string, HeroRegistryEntry> = Object.fromEntries(
  HERO_CATALOG.map((entry: HeroCatalogEntry) => [
    entry.codename,
    {
      pageTitle: entry.pageTitle,
      koreanName: entry.name,
      role: entry.role,
      releasedAt: new Date(entry.releasedAt),
    },
  ]),
);

export const HERO_CODENAMES = Object.keys(HERO_REGISTRY);
