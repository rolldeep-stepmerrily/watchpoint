'use client';

import { DEFAULT_LOCALE, type Locale } from '@@shared';
import { useRouter } from 'next/navigation';
import { createContext, type ReactNode, useCallback, useContext, useEffect, useState } from 'react';

import { LANG_COOKIE } from '@/lib/i18n-shared';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

/**
 * 서버에서 결정한 initialLocale을 client에 주입한다. 첫 렌더부터 정확한 로케일이
 * 보장돼 useLocale을 쓰는 클라이언트 컴포넌트가 hydration mismatch를 일으키지 않는다.
 *
 * setLocale은 쿠키 갱신 + `<html lang>` 동기화 + RSC 재렌더(router.refresh)를 함께 수행한다.
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return;
      writeCookie(LANG_COOKIE, next);
      setLocaleState(next);
      router.refresh();
    },
    [locale, router],
  );

  return <LocaleContext.Provider value={{ locale, setLocale }}>{children}</LocaleContext.Provider>;
}

/**
 * 현재 로케일을 구독한다. Provider 밖에서 호출되면 DEFAULT_LOCALE 반환.
 */
export function useLocale(): Locale {
  return useContext(LocaleContext)?.locale ?? DEFAULT_LOCALE;
}

/**
 * 로케일 setter를 반환한다. Provider 밖이면 no-op.
 */
export function useSetLocale(): (next: Locale) => void {
  const ctx = useContext(LocaleContext);
  return ctx?.setLocale ?? (() => undefined);
}
