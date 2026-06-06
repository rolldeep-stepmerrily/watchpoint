export type PerkTier = 'MINOR' | 'MAJOR';

export const PERK_TIERS = ['MINOR', 'MAJOR'] as const satisfies readonly PerkTier[];

/**
 * 주어진 값이 유효한 PerkTier 문자열인지 검증
 *
 * @param {unknown} value 검증할 값
 * @returns {boolean} PerkTier로 안전하게 좁힐 수 있으면 true
 */
export const isPerkTier = (value: unknown): value is PerkTier => {
  return typeof value === 'string' && (PERK_TIERS as readonly string[]).includes(value);
};
