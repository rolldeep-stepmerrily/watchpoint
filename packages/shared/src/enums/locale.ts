export type Locale = 'ko' | 'en' | 'ja';

export const LOCALES = ['ko', 'en', 'ja'] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = 'ko';

/**
 * 주어진 값이 지원 Locale('ko'|'en'|'ja')인지 검증
 *
 * @param {unknown} value 검증할 값
 * @returns {boolean} Locale로 안전하게 좁힐 수 있으면 true
 */
export const isLocale = (value: unknown): value is Locale => {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
};
