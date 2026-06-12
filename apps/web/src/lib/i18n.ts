import { DEFAULT_LOCALE, isLocale, type Locale } from '@@shared';
import { cookies } from 'next/headers';

import { LANG_COOKIE } from './i18n-shared';

/**
 * 라우트 segment에서 받은 lang 값을 검증해 안전한 Locale로 반환. URL prefix(`/[lang]/...`) 기반이라
 * cookies()를 호출하지 않아 ISR을 무효화하지 않는다. invalid 값은 DEFAULT_LOCALE로 fallback.
 *
 * @param raw `[lang]` 라우트 segment에서 받은 값
 */
export const resolveLang = (raw: string | undefined): Locale => {
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
};

/**
 * @deprecated cookies 기반 server-side locale 조회. 사용 시 호출 페이지가 dynamic이 되어 ISR이 비활성된다.
 * 신규 코드는 `/[lang]/...` 라우트의 params를 `resolveLang`으로 처리해 정적 렌더링을 유지하라.
 */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export { LANG_COOKIE };
