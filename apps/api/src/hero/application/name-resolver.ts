import { DEFAULT_LOCALE, type Locale } from '@watchpoint/shared';

/**
 * 다국어 이름 해석: nameTranslations[locale]이 있으면 그것을, 없으면 기본 name(한국어)을 반환.
 *
 * @example
 *   resolveName('파멸의 일격', { en: 'Meteor Strike' }, 'en') // → 'Meteor Strike'
 *   resolveName('파멸의 일격', { en: 'Meteor Strike' }, 'ko') // → '파멸의 일격'
 *   resolveName('파멸의 일격', null,                     'en') // → '파멸의 일격' (fallback)
 */
export const resolveName = (name: string, nameTranslations: unknown, locale: Locale = DEFAULT_LOCALE): string => {
  if (locale === DEFAULT_LOCALE) {
    return name;
  }

  if (nameTranslations === null || typeof nameTranslations !== 'object') {
    return name;
  }

  const translated = (nameTranslations as Record<string, unknown>)[locale];

  return typeof translated === 'string' && translated.length > 0 ? translated : name;
};

/**
 * 자유 텍스트(description, body, summary 등)의 다국어 해석.
 * base 타입을 그대로 보존: base가 string이면 string, string | null이면 string | null 반환.
 */
export const resolveDescription = <T extends string | null>(
  base: T,
  translations: unknown,
  locale: Locale = DEFAULT_LOCALE,
): T => {
  if (locale === DEFAULT_LOCALE) {
    return base;
  }

  if (translations === null || typeof translations !== 'object') {
    return base;
  }

  const translated = (translations as Record<string, unknown>)[locale];

  if (typeof translated === 'string' && translated.length > 0) {
    return translated as T;
  }

  return base;
};
