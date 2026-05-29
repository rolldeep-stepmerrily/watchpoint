'use client';

import type { HeroSummaryDto, PatchNoteSummaryDto } from '@@shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type KeyboardEvent, useEffect, useMemo, useRef, useState } from 'react';

import { HeroPortrait } from '@/components/hero-portrait';
import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

interface SearchResponse {
  heroes: HeroSummaryDto[];
  patchNotes: PatchNoteSummaryDto[];
}

const MIN_LENGTH = 1;
const DEBOUNCE_MS = 200;

export function SearchBar() {
  const locale = useLocale();
  const t = getLabels(locale);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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
        const response = await fetch(
          `/api/search?q=${encodeURIComponent(trimmed)}&lang=${encodeURIComponent(locale)}`,
          { signal: controller.signal },
        );
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
  }, [query, locale]);

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
    setActiveIndex(-1);
  };

  const flatHrefs = useMemo(() => {
    if (!results) return [] as string[];
    return [
      ...results.heroes.map((hero) => `/heroes/${hero.codename}`),
      ...results.patchNotes.map((patch) => `/patch-notes/${patch.version}`),
    ];
  }, [results]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: results 변화가 reset 트리거
  useEffect(() => {
    setActiveIndex(-1);
  }, [results]);

  useEffect(() => {
    if (activeIndex < 0) return;
    const node = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`);
    node?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const showDropdown = isOpen && query.trim().length >= MIN_LENGTH;
  const hasResults = Boolean(results && (results.heroes.length > 0 || results.patchNotes.length > 0));
  const isEmpty = !isLoading && results !== null && !hasResults;
  const heroesCount = results?.heroes.length ?? 0;

  const moveActive = (delta: 1 | -1) => {
    setActiveIndex((i) => Math.max(0, Math.min(flatHrefs.length - 1, i + delta)));
  };

  const submitActive = () => {
    const href = activeIndex >= 0 ? flatHrefs[activeIndex] : flatHrefs[0];
    if (!href) return;
    router.push(href);
    close();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      close();
      return;
    }
    if (!showDropdown || flatHrefs.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveActive(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      submitActive();
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative flex-1 max-w-sm"
    >
      <input
        type="search"
        role="combobox"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={t.search.placeholder}
        aria-label={t.search.ariaLabel}
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls="search-results"
        aria-activedescendant={activeIndex >= 0 ? `search-result-${activeIndex}` : undefined}
        className="w-full text-sm px-3 py-1.5 rounded-md bg-(--color-bg) border border-(--color-border) focus:border-(--color-accent) focus:outline-none placeholder:text-(--color-text-muted)"
      />
      {showDropdown && (
        <div
          ref={listRef}
          id="search-results"
          className="absolute left-0 right-0 mt-2 rounded-lg border border-(--color-border) bg-(--color-surface) shadow-lg overflow-hidden max-h-[60vh] overflow-y-auto"
        >
          {isLoading && !results && <p className="px-3 py-3 text-xs text-(--color-text-muted)">{t.search.searching}</p>}
          {isEmpty && <p className="px-3 py-3 text-xs text-(--color-text-muted)">{t.search.empty}</p>}
          {results && results.heroes.length > 0 && (
            <section>
              <h3 className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                {t.search.groupHeroes}
              </h3>
              <ul>
                {results.heroes.map((hero, index) => {
                  const isActive = activeIndex === index;
                  return (
                    <li key={hero.id}>
                      <Link
                        id={`search-result-${index}`}
                        data-index={index}
                        href={`/heroes/${hero.codename}`}
                        onClick={close}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`flex items-center gap-2 px-3 py-2 text-sm ${
                          isActive ? 'bg-(--color-surface-hover)' : 'hover:bg-(--color-surface-hover)'
                        }`}
                      >
                        <HeroPortrait
                          src={hero.portraitUrl}
                          alt={hero.name}
                          role={hero.role}
                          size="sm"
                        />
                        <span className="font-medium">{hero.name}</span>
                        <span className="text-xs text-(--color-text-muted) font-mono">{hero.codename}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {results && results.patchNotes.length > 0 && (
            <section>
              <h3 className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-widest text-(--color-text-muted)">
                {t.search.groupPatchNotes}
              </h3>
              <ul>
                {results.patchNotes.map((patch, offset) => {
                  const index = heroesCount + offset;
                  const isActive = activeIndex === index;
                  return (
                    <li key={patch.id}>
                      <Link
                        id={`search-result-${index}`}
                        data-index={index}
                        href={`/patch-notes/${patch.version}`}
                        onClick={close}
                        onMouseEnter={() => setActiveIndex(index)}
                        className={`block px-3 py-2 text-sm ${
                          isActive ? 'bg-(--color-surface-hover)' : 'hover:bg-(--color-surface-hover)'
                        }`}
                      >
                        <span className="font-mono text-(--color-accent) mr-2">{patch.version}</span>
                        <span>{patch.title}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
