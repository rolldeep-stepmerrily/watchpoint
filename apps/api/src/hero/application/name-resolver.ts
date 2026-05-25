import { DEFAULT_LOCALE, type Locale } from '@watchpoint/shared';

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

/**
 * 선택적 텍스트(description 등)의 다국어 해석. base가 null이고 번역도 없으면 null 유지.
 */
export function resolveDescription(
  description: string | null,
  descriptionTranslations: unknown,
  locale: Locale = DEFAULT_LOCALE,
): string | null {
  if (locale === DEFAULT_LOCALE) return description;
  if (descriptionTranslations === null || typeof descriptionTranslations !== 'object') return description;
  const translated = (descriptionTranslations as Record<string, unknown>)[locale];
  if (typeof translated === 'string' && translated.length > 0) return translated;
  return description;
}
