export type HeroRole = 'TANK' | 'DAMAGE' | 'SUPPORT';

export const HERO_ROLES = ['TANK', 'DAMAGE', 'SUPPORT'] as const satisfies readonly HeroRole[];
