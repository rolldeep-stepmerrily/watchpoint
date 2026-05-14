export type EntryCategory = 'HERO_BALANCE' | 'BUG_FIX' | 'MAP' | 'SYSTEM' | 'GENERAL';

export const ENTRY_CATEGORIES = [
  'HERO_BALANCE',
  'BUG_FIX',
  'MAP',
  'SYSTEM',
  'GENERAL',
] as const satisfies readonly EntryCategory[];
