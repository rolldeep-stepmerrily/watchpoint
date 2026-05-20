const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const ROLE_LABELS = {
  TANK: '돌격',
  DAMAGE: '공격',
  SUPPORT: '지원',
} as const;

export type RoleKey = keyof typeof ROLE_LABELS;

export function roleLabel(role: RoleKey): string {
  return ROLE_LABELS[role];
}

const ROLE_COLOR_VAR = {
  TANK: '--color-role-tank',
  DAMAGE: '--color-role-damage',
  SUPPORT: '--color-role-support',
} as const;

export function roleColorVar(role: RoleKey): string {
  return ROLE_COLOR_VAR[role];
}

export const ROLE_ORDER: readonly RoleKey[] = ['TANK', 'DAMAGE', 'SUPPORT'];

const SLOT_LABELS = {
  PASSIVE: '패시브',
  PRIMARY: '기본 공격',
  SECONDARY: '보조 공격',
  ABILITY_1: '기술 1',
  ABILITY_2: '기술 2',
  ULTIMATE: '궁극기',
} as const;

export function slotLabel(slot: keyof typeof SLOT_LABELS): string {
  return SLOT_LABELS[slot];
}

const CATEGORY_LABELS = {
  HERO_BALANCE: '영웅 밸런스',
  BUG_FIX: '버그 수정',
  MAP: '지도',
  SYSTEM: '시스템',
  GENERAL: '일반',
} as const;

export type CategoryKey = keyof typeof CATEGORY_LABELS;

export function categoryLabel(category: CategoryKey): string {
  return CATEGORY_LABELS[category];
}

const CATEGORY_COLOR_VAR = {
  HERO_BALANCE: '--color-cat-balance',
  BUG_FIX: '--color-cat-bug',
  MAP: '--color-cat-map',
  SYSTEM: '--color-cat-system',
  GENERAL: '--color-cat-general',
} as const;

export function categoryColorVar(category: CategoryKey): string {
  return CATEGORY_COLOR_VAR[category];
}

export const CATEGORY_ORDER: readonly CategoryKey[] = ['HERO_BALANCE', 'BUG_FIX', 'MAP', 'SYSTEM', 'GENERAL'];
