'use client';

import type { Locale } from '@@shared';

import { useLocale, useSetLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

const OPTIONS: Array<{ value: Locale; label: string; enabled: boolean }> = [
  { value: 'ko', label: '한국어', enabled: true },
  { value: 'en', label: 'English', enabled: true },
  { value: 'ja', label: '日本語', enabled: false },
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
