'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useCurrentUser } from '@/hooks/use-current-user';
import { useLocale } from '@/hooks/use-locale';
import { getLabels } from '@/lib/labels';
import { useImportLocalBookmarksOnLogin } from '@/lib/use-bookmarks';

export function AuthMenu(): React.JSX.Element {
  const locale = useLocale();
  const t = getLabels(locale);
  const { user, status, refresh } = useCurrentUser();
  useImportLocalBookmarksOnLogin();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onClick = (e: MouseEvent): void => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const logout = async (): Promise<void> => {
    setOpen(false);
    await fetch('/api/auth/logout', { method: 'POST' });
    await refresh();
    router.push(`/${locale}`);
    router.refresh();
  };

  if (status === 'loading') {
    return <div className="h-8 w-20 rounded bg-(--color-surface) animate-pulse" />;
  }

  if (!user) {
    return (
      <Link
        href={`/${locale}/auth/login` as never}
        className="text-sm font-medium px-3 py-1.5 rounded-md text-(--color-text-muted) hover:text-(--color-text) hover:bg-(--color-surface-hover) transition-colors"
      >
        {t.auth.login}
      </Link>
    );
  }

  const initial = (user.name?.[0] ?? user.email[0] ?? '?').toUpperCase();

  return (
    <div
      ref={wrapperRef}
      className="relative"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-(--color-surface-hover) transition-colors"
      >
        <Avatar
          url={user.avatarUrl}
          initial={initial}
        />
        <span className="hidden sm:block text-sm text-(--color-text) max-w-32 truncate">{user.name ?? user.email}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 rounded-md border border-(--color-border) bg-(--color-surface) shadow-lg z-30"
        >
          <div className="px-3 py-2 border-b border-(--color-border)">
            <p className="text-sm font-medium text-(--color-text-strong) truncate">{user.name ?? user.email}</p>
            {user.name && <p className="text-xs text-(--color-text-muted) truncate">{user.email}</p>}
            {user.role === 'ADMIN' && (
              <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-widest text-(--color-accent)">
                ADMIN
              </span>
            )}
          </div>
          <Link
            href={`/${locale}/me` as never}
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-hover)"
          >
            {t.auth.profile}
          </Link>
          <button
            type="button"
            onClick={logout}
            className="block w-full text-left px-3 py-2 text-sm text-(--color-text) hover:bg-(--color-surface-hover) rounded-b-md"
          >
            {t.auth.logout}
          </button>
        </div>
      )}
    </div>
  );
}

function Avatar({ url, initial }: { url: string | null; initial: string }): React.JSX.Element {
  if (url) {
    return (
      <span
        className="h-7 w-7 rounded-full bg-cover bg-center"
        style={{ backgroundImage: `url(${url})` }}
        aria-hidden="true"
      />
    );
  }
  return (
    <span className="h-7 w-7 rounded-full bg-(--color-accent-faint) text-(--color-accent) flex items-center justify-center text-xs font-bold">
      {initial}
    </span>
  );
}
