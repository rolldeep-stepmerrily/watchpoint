'use client';

import type { HeroSummaryDto, PatchNoteSummaryDto } from '@@shared';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface SearchResponse {
  heroes: HeroSummaryDto[];
  patchNotes: PatchNoteSummaryDto[];
}

const MIN_LENGTH = 1;
const DEBOUNCE_MS = 200;

export function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_LENGTH) {
      setResults(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    setIsLoading(true);
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(trimmed)}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error(`status ${response.status}`);
        const data = (await response.json()) as SearchResponse;
        setResults(data);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') {
          setResults(null);
        }
      } finally {
        setIsLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const close = () => {
    setIsOpen(false);
    setQuery('');
  };

  const showDropdown = isOpen && query.trim().length >= MIN_LENGTH;
  const hasResults = Boolean(results && (results.heroes.length > 0 || results.patchNotes.length > 0));
  const isEmpty = !isLoading && results !== null && !hasResults;

  return (
    <div
      ref={containerRef}
      className="relative flex-1 max-w-sm"
    >
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        placeholder="영웅·패치노트 검색"
        aria-label="검색"
        className="w-full text-sm px-3 py-1.5 rounded-md bg-(--color-bg) border border-(--color-border) focus:border-(--color-accent) focus:outline-none placeholder:text-(--color-text-muted)"
      />
      {showDropdown && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg border border-(--color-border) bg-(--color-surface) shadow-lg overflow-hidden">
          {isLoading && !results && (
            <p className="px-3 py-3 text-xs text-(--color-text-muted)">검색 중…</p>
          )}
          {isEmpty && <p className="px-3 py-3 text-xs text-(--color-text-muted)">결과 없음</p>}
          {results && results.heroes.length > 0 && (
            <section>
              <h3 className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                영웅
              </h3>
              <ul>
                {results.heroes.map((hero) => (
                  <li key={hero.id}>
                    <Link
                      href={`/heroes/${hero.codename}`}
                      onClick={close}
                      className="block px-3 py-2 text-sm hover:bg-(--color-surface-hover)"
                    >
                      <span className="font-medium">{hero.name}</span>
                      <span className="text-xs text-(--color-text-muted) ml-2 font-mono">{hero.codename}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {results && results.patchNotes.length > 0 && (
            <section>
              <h3 className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                패치노트
              </h3>
              <ul>
                {results.patchNotes.map((patch) => (
                  <li key={patch.id}>
                    <Link
                      href={`/patch-notes/${patch.version}`}
                      onClick={close}
                      className="block px-3 py-2 text-sm hover:bg-(--color-surface-hover)"
                    >
                      <span className="font-mono text-(--color-accent) mr-2">{patch.version}</span>
                      <span>{patch.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
