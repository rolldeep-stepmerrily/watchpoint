'use client';

import { useEffect } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  const t = getLabels(useLocale());

  useEffect(() => {
    console.error('app error:', error);
  }, [error]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">{t.common.error.kicker}</p>
        <h1 className="text-2xl font-semibold tracking-tight">{t.common.error.heading}</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">{t.common.error.body}</p>
      </header>

      {error.digest && <p className="text-xs font-mono text-(--color-text-muted)">digest: {error.digest}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
        >
          {t.common.retry}
        </button>
        <a
          href="/"
          className="px-4 py-2 text-sm rounded-md border border-(--color-border) hover:bg-(--color-surface-hover)"
        >
          {t.common.home}
        </a>
      </div>
    </div>
  );
}
