export type Locale = 'ko' | 'en' | 'ja';

export const LOCALES = ['ko', 'en', 'ja'] as const satisfies readonly Locale[];

export const DEFAULT_LOCALE: Locale = 'ko';

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value);
}
