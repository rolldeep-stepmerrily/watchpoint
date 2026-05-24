'use client';

import { DEFAULT_LOCALE, isLocale, type Locale } from '@@shared';
import { useEffect, useState } from 'react';

import { LANG_COOKIE } from '@/lib/i18n-shared';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

/**
 * 클라이언트 컴포넌트에서 현재 로케일을 구독한다. SSR/초기 렌더 시 DEFAULT_LOCALE,
 * 마운트 후 쿠키를 읽어서 갱신한다.
 */
export function useLocale(): Locale {
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    const value = readCookie(LANG_COOKIE);
    if (isLocale(value)) {
      setLocale(value);
    }
  }, []);

  return locale;
}
