'use client';

import { useEffect } from 'react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('app error:', error);
  }, [error]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-mono uppercase tracking-widest text-(--color-text-muted)">Error</p>
        <h1 className="text-2xl font-semibold tracking-tight">잠깐, 무언가 잘못됐어요.</h1>
        <p className="text-(--color-text-muted) max-w-lg leading-relaxed">
          페이지를 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도하거나 다른 페이지로 이동해 주세요.
        </p>
      </header>

      {error.digest && <p className="text-xs font-mono text-(--color-text-muted)">digest: {error.digest}</p>}

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="px-4 py-2 text-sm rounded-md border border-(--color-accent) text-(--color-accent) hover:bg-(--color-surface-hover)"
        >
          다시 시도
        </button>
        <a
          href="/"
          className="px-4 py-2 text-sm rounded-md border border-(--color-border) hover:bg-(--color-surface-hover)"
        >
          홈으로
        </a>
      </div>
    </div>
  );
}
