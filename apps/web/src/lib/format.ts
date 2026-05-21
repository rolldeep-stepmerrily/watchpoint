import type { AbilitySlot, EntryCategory, HeroRole } from '@@shared';

const ROLE_COLOR_VAR: Record<HeroRole, string> = {
  TANK: '--color-role-tank',
  DAMAGE: '--color-role-damage',
  SUPPORT: '--color-role-support',
};

export function roleColorVar(role: HeroRole): string {
  return ROLE_COLOR_VAR[role];
}

export const ROLE_ORDER: readonly HeroRole[] = ['TANK', 'DAMAGE', 'SUPPORT'];

const SLOT_COLOR_VAR: Record<AbilitySlot, string> = {
  PASSIVE: '--color-slot-passive',
  PRIMARY: '--color-slot-primary',
  SECONDARY: '--color-slot-secondary',
  ABILITY_1: '--color-slot-ability1',
  ABILITY_2: '--color-slot-ability2',
  ULTIMATE: '--color-slot-ultimate',
};

export function slotColorVar(slot: AbilitySlot): string {
  return SLOT_COLOR_VAR[slot];
}

export const SLOT_ORDER: readonly AbilitySlot[] = [
  'PASSIVE',
  'PRIMARY',
  'SECONDARY',
  'ABILITY_1',
  'ABILITY_2',
  'ULTIMATE',
];

const CATEGORY_COLOR_VAR: Record<EntryCategory, string> = {
  HERO_BALANCE: '--color-cat-balance',
  BUG_FIX: '--color-cat-bug',
  MAP: '--color-cat-map',
  SYSTEM: '--color-cat-system',
  GENERAL: '--color-cat-general',
};

export function categoryColorVar(category: EntryCategory): string {
  return CATEGORY_COLOR_VAR[category];
}

export const CATEGORY_ORDER: readonly EntryCategory[] = ['HERO_BALANCE', 'BUG_FIX', 'MAP', 'SYSTEM', 'GENERAL'];
