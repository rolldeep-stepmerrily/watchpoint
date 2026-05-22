'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { LanguageToggle } from './language-toggle';
import { SearchBar } from './search-bar';

const NAV_LINKS = [
  { href: '/heroes', label: '영웅' },
  { href: '/patch-notes', label: '패치노트' },
] as const;

export function SiteHeader() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger to close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  return (
    <header className="border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-(--color-accent)"
        >
          Watchpoint
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hover:text-(--color-accent-hover)"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="ml-auto hidden md:flex flex-1 justify-end items-center gap-3">
          <SearchBar />
          <LanguageToggle />
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
          aria-expanded={isOpen}
          className="md:hidden ml-auto p-2 -mr-2 rounded hover:bg-(--color-surface-hover)"
        >
          <HamburgerIcon isOpen={isOpen} />
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-(--color-border) bg-(--color-surface)">
          <div className="max-w-5xl mx-auto px-6 py-4 space-y-4">
            <SearchBar />
            <nav className="flex flex-col gap-1 text-sm">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="px-2 py-2 rounded hover:bg-(--color-surface-hover)"
                >
                  {link.label}
                </Link>
              ))}
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

function HamburgerIcon({ isOpen }: { isOpen: boolean }) {
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
      aria-label={isOpen ? '메뉴 닫기' : '메뉴 열기'}
    >
      <title>{isOpen ? '메뉴 닫기' : '메뉴 열기'}</title>
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
