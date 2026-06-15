'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

import { LanguageToggle } from './language-toggle';
import { SearchBar } from './search-bar';

// pathname의 첫 segment가 locale이면 그 다음 segment를 검사하도록 match 패턴을 어디서나 동작하게 설계.
// `/ko/heroes` `/en/heroes/...` 모두 매치.
const HERO_ROUTE = /^\/(?:ko|en|ja)\/heroes(?:\/|$)/;
const PATCH_ROUTE = /^\/(?:ko|en|ja)\/patch-notes(?:\/|$)/;
const CAREER_ROUTE = /^\/(?:ko|en|ja)\/career(?:\/|$)/;

export function SiteHeader() {
  const locale = useLocale();
  const t = getLabels(locale);
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: `/${locale}/heroes` as const, match: HERO_ROUTE, label: t.nav.heroes, beta: false },
    { href: `/${locale}/patch-notes` as const, match: PATCH_ROUTE, label: t.nav.patchNotes, beta: false },
    { href: `/${locale}/career` as const, match: CAREER_ROUTE, label: t.nav.career, beta: true },
  ];

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger to close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuLabel = isOpen ? t.nav.menuClose : t.nav.menuOpen;

  return (
    <header
      className="border-b border-(--color-border) bg-(--color-bg)/90 backdrop-blur sticky top-0 z-20"
      style={{ boxShadow: '0 1px 2px rgba(74, 76, 78, 0.04)' }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link
          href={`/${locale}` as never}
          className="flex items-center gap-2 group"
        >
          <span className="h-7 w-7 rounded-md bg-(--color-accent) text-(--color-bg) flex items-center justify-center font-black text-sm tracking-tight group-hover:bg-(--color-accent-hover) transition-colors">
            W
          </span>
          <span className="text-base font-extrabold tracking-tight text-(--color-text-strong)">{t.site.name}</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
          {navLinks.map((link) => {
            const active = link.match.test(pathname);
            return (
              <Link
                key={link.href}
                href={link.href as never}
                className={`px-3 py-2 rounded-md transition-colors flex items-center gap-1.5 ${
                  active
                    ? 'text-(--color-accent) bg-(--color-accent-faint)'
                    : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-hover)'
                }`}
              >
                {link.label}
                {link.beta ? <BetaChip /> : null}
              </Link>
            );
          })}
        </nav>
        <div className="ml-auto hidden md:flex flex-1 max-w-md justify-end items-center gap-3">
          <SearchBar />
          <LanguageToggle />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={menuLabel}
          aria-expanded={isOpen}
          className="md:hidden ml-auto p-2 -mr-2 rounded hover:bg-(--color-surface-hover)"
        >
          <HamburgerIcon
            isOpen={isOpen}
            label={menuLabel}
          />
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-(--color-border) bg-(--color-surface)">
          <div className="max-w-6xl mx-auto px-6 py-4 space-y-4">
            <SearchBar />
            <nav className="flex flex-col gap-1 text-sm">
              {navLinks.map((link) => {
                const active = link.match.test(pathname);
                return (
                  <Link
                    key={link.href}
                    href={link.href as never}
                    className={`px-3 py-2 rounded-md flex items-center gap-1.5 ${
                      active ? 'text-(--color-accent) bg-(--color-accent-faint)' : 'hover:bg-(--color-surface-hover)'
                    }`}
                  >
                    {link.label}
                    {link.beta ? <BetaChip /> : null}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-2 border-t border-(--color-border)">
              <LanguageToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

function BetaChip() {
  return (
    <span className="rounded border border-(--color-accent) px-1 py-px text-[9px] font-bold uppercase tracking-widest text-(--color-accent)">
      Beta
    </span>
  );
}

function HamburgerIcon({ isOpen, label }: { isOpen: boolean; label: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      role="img"
      aria-label={label}
    >
      <title>{label}</title>
      {isOpen ? (
        <>
          <line
            x1="4"
            y1="4"
            x2="16"
            y2="16"
          />
          <line
            x1="16"
            y1="4"
            x2="4"
            y2="16"
          />
        </>
      ) : (
        <>
          <line
            x1="3"
            y1="6"
            x2="17"
            y2="6"
          />
          <line
            x1="3"
            y1="10"
            x2="17"
            y2="10"
          />
          <line
            x1="3"
            y1="14"
            x2="17"
            y2="14"
          />
        </>
      )}
    </svg>
  );
}
