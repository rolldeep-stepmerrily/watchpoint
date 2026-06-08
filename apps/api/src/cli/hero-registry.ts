import type { HeroRole, Subrole } from '@@prisma';

import { HERO_CATALOG, type HeroCatalogEntry } from '../domain/hero-catalog';

export interface HeroRegistryEntry {
  koreanName: string;
  role: HeroRole;
  subrole: Subrole;
  releasedAt: Date;
}

export const HERO_REGISTRY: Record<string, HeroRegistryEntry> = Object.fromEntries(
  HERO_CATALOG.map((entry: HeroCatalogEntry) => [
    entry.codename,
    {
      koreanName: entry.name,
      role: entry.role,
      subrole: entry.subrole,
      releasedAt: new Date(entry.releasedAt),
    },
  ]),
);

export const HERO_CODENAMES = Object.keys(HERO_REGISTRY);
