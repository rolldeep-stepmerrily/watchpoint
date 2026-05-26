'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

import { LanguageToggle } from './language-toggle';
import { SearchBar } from './search-bar';

const NAV_LINKS = [
  { href: '/heroes', match: /^\/heroes/ },
  { href: '/patch-notes', match: /^\/patch-notes/ },
] as const;

export function SiteHeader() {
  const t = getLabels(useLocale());
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = NAV_LINKS.map((link) => ({
    ...link,
    label: link.href === '/heroes' ? t.nav.heroes : t.nav.patchNotes,
  }));

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger to close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuLabel = isOpen ? t.nav.menuClose : t.nav.menuOpen;

  return (
    <header className="border-b border-(--color-border) bg-(--color-bg)/85 backdrop-blur sticky top-0 z-20">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center gap-8">
        <Link
          href="/"
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
                href={link.href}
                className={`px-3 py-2 rounded-md transition-colors ${
                  active
                    ? 'text-(--color-accent) bg-(--color-accent-faint)'
                    : 'text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-hover)'
                }`}
              >
                {link.label}
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
                    href={link.href}
                    className={`px-3 py-2 rounded-md ${
                      active ? 'text-(--color-accent) bg-(--color-accent-faint)' : 'hover:bg-(--color-surface-hover)'
                    }`}
                  >
                    {link.label}
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
