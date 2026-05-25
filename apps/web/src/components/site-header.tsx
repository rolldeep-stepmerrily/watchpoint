'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';

import { LanguageToggle } from './language-toggle';
import { SearchBar } from './search-bar';

export function SiteHeader() {
  const t = getLabels(useLocale());
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: '/heroes', label: t.nav.heroes },
    { href: '/patch-notes', label: t.nav.patchNotes },
  ];

  // biome-ignore lint/correctness/useExhaustiveDependencies: pathname is the trigger to close menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const menuLabel = isOpen ? t.nav.menuClose : t.nav.menuOpen;

  return (
    <header className="border-b border-(--color-border) bg-(--color-surface)/80 backdrop-blur sticky top-0 z-10">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-(--color-accent)"
        >
          {t.site.name}
        </Link>
        <div className="hidden md:flex items-center gap-5 text-sm">
          {navLinks.map((link) => (
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
          <div className="max-w-5xl mx-auto px-6 py-4 space-y-4">
            <SearchBar />
            <nav className="flex flex-col gap-1 text-sm">
              {navLinks.map((link) => (
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
