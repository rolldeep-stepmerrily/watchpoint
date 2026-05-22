'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { DEFAULT_LOCALE, type Locale } from '@@shared';

const LANG_COOKIE = 'lang';

const OPTIONS: Array<{ value: Locale; label: string; enabled: boolean }> = [
  { value: 'ko', label: '한국어', enabled: true },
  { value: 'en', label: 'English', enabled: false },
  { value: 'ja', label: '日本語', enabled: false },
];

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.split('; ').find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

function writeCookie(name: string, value: string): void {
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function LanguageToggle() {
  const [current, setCurrent] = useState<Locale>(DEFAULT_LOCALE);
  const router = useRouter();

  useEffect(() => {
    const cookieValue = readCookie(LANG_COOKIE);
    if (cookieValue === 'ko' || cookieValue === 'en' || cookieValue === 'ja') {
      setCurrent(cookieValue);
    }
  }, []);

  const select = (locale: Locale): void => {
    if (locale === current) return;
    writeCookie(LANG_COOKIE, locale);
    setCurrent(locale);
    router.refresh();
  };

  return (
    <fieldset className="inline-flex items-center gap-0.5 rounded-md border border-(--color-border) bg-(--color-bg) p-0.5 text-xs">
      <legend className="sr-only">언어 선택</legend>
      {OPTIONS.map((opt) => {
        const active = opt.value === current;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => opt.enabled && select(opt.value)}
            disabled={!opt.enabled}
            aria-pressed={active}
            title={opt.enabled ? opt.label : `${opt.label} (준비 중)`}
            className={`px-2 py-1 rounded font-mono uppercase tracking-wider transition ${
              active
                ? 'bg-(--color-accent) text-(--color-bg)'
                : opt.enabled
                  ? 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-hover)'
                  : 'text-(--color-text-muted) opacity-40 cursor-not-allowed'
            }`}
          >
            {opt.value}
          </button>
        );
      })}
    </fieldset>
  );
}
