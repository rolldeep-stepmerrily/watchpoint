'use client';

import type { Locale } from '@@shared';

import { useLocale, useSetLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

// 'ja'는 라벨 번역이 준비되지 않은 상태에서 옵션으로 노출하면 사용자가 선택 시 영문이 떨어져 혼란.
// 본격적인 일본어 번역이 들어올 때 다시 추가.
const OPTIONS: Array<{ value: Locale; label: string; enabled: boolean }> = [
  { value: 'ko', label: '한국어', enabled: true },
  { value: 'en', label: 'English', enabled: true },
];

export function LanguageToggle() {
  const locale = useLocale();
  const setLocale = useSetLocale();
  const t = getLabels(locale);

  return (
    <fieldset className="inline-flex items-center gap-0.5 rounded-md border border-(--color-border) bg-(--color-bg) p-0.5 text-xs">
      <legend className="sr-only">{t.common.language}</legend>
      {OPTIONS.map((opt) => {
        const active = opt.value === locale;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => opt.enabled && setLocale(opt.value)}
            disabled={!opt.enabled}
            aria-pressed={active}
            title={opt.enabled ? opt.label : `${opt.label} (${t.common.languageComingSoon})`}
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
