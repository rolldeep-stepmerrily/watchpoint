export type PerkTier = 'MINOR' | 'MAJOR';

export const PERK_TIERS = ['MINOR', 'MAJOR'] as const satisfies readonly PerkTier[];

export function isPerkTier(value: unknown): value is PerkTier {
  return typeof value === 'string' && (PERK_TIERS as readonly string[]).includes(value);
}
