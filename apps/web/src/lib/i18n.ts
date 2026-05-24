import { DEFAULT_LOCALE, isLocale, type Locale } from '@@shared';
import { cookies } from 'next/headers';

import { LANG_COOKIE } from './i18n-shared';

/**
 * 서버 컴포넌트에서 현재 사용자의 언어 설정 조회. 쿠키가 없거나 잘못된 값이면 DEFAULT_LOCALE.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export { LANG_COOKIE };
