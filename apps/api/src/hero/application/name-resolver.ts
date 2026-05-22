import { type Locale, DEFAULT_LOCALE } from '@watchpoint/shared';

/**
 * 다국어 이름 해석: nameTranslations[locale]이 있으면 그것을, 없으면 기본 name(한국어)을 반환.
 *
 * @example
 *   resolveName('파멸의 일격', { en: 'Meteor Strike' }, 'en') // → 'Meteor Strike'
 *   resolveName('파멸의 일격', { en: 'Meteor Strike' }, 'ko') // → '파멸의 일격'
 *   resolveName('파멸의 일격', null,                     'en') // → '파멸의 일격' (fallback)
 */
export function resolveName(name: string, nameTranslations: unknown, locale: Locale = DEFAULT_LOCALE): string {
  if (locale === DEFAULT_LOCALE) return name;
  if (nameTranslations === null || typeof nameTranslations !== 'object') return name;
  const translated = (nameTranslations as Record<string, unknown>)[locale];
  return typeof translated === 'string' && translated.length > 0 ? translated : name;
}
