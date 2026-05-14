export type AbilitySlot = 'PASSIVE' | 'PRIMARY' | 'SECONDARY' | 'ABILITY_1' | 'ABILITY_2' | 'ULTIMATE';

export const ABILITY_SLOTS = [
  'PASSIVE',
  'PRIMARY',
  'SECONDARY',
  'ABILITY_1',
  'ABILITY_2',
  'ULTIMATE',
] as const satisfies readonly AbilitySlot[];
