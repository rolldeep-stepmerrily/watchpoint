'use client';

import { useCallback, useEffect, useState } from 'react';

import { useCurrentUser } from '@/hooks/use-current-user';

export type BookmarkKind = 'HERO' | 'PLAYER';

export interface BookmarkEntry {
  kind: BookmarkKind;
  targetId: string;
  metadata: Record<string, unknown> | null;
  /** epoch ms — 게스트는 local, 로그인은 서버 createdAt 변환 */
  createdAt: number;
}

interface ServerBookmark {
  id: number;
  kind: BookmarkKind;
  targetId: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

const BOOKMARK_LIMIT = 100;
const LEGACY_FAVORITE_KEY = 'watchpoint:favorites:v1';
const IMPORT_FLAG_PREFIX = 'watchpoint:bookmarks-imported:';

const storageKeyFor = (kind: BookmarkKind): string => `watchpoint:bookmarks:${kind}:v1`;

function readLocal(kind: BookmarkKind): BookmarkEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(storageKeyFor(kind));
    if (!raw) {
      if (kind === 'PLAYER') {
        return readLegacyFavorites();
      }
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidEntry).slice(0, BOOKMARK_LIMIT);
  } catch {
    return [];
  }
}

/**
 * 2026-06 이전 전적 즐겨찾기 키 호환. 새 hook은 PLAYER kind 신규 키가 없으면 legacy로 fallback.
 * 첫 로그인 import 시점에도 legacy를 함께 포함시켜 한 번에 흡수.
 */
function readLegacyFavorites(): BookmarkEntry[] {
  try {
    const raw = window.localStorage.getItem(LEGACY_FAVORITE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap(toLegacyEntry);
  } catch {
    return [];
  }
}

function toLegacyEntry(value: unknown): BookmarkEntry[] {
  if (typeof value !== 'object' || value === null) {
    return [];
  }
  const v = value as Record<string, unknown>;
  if (typeof v.playerId !== 'string') {
    return [];
  }
  return [
    {
      kind: 'PLAYER',
      targetId: v.playerId,
      metadata: {
        name: typeof v.name === 'string' ? v.name : v.playerId,
        avatar: typeof v.avatar === 'string' || v.avatar === null ? v.avatar : null,
      },
      createdAt: typeof v.addedAt === 'number' ? v.addedAt : Date.now(),
    },
  ];
}

function isValidEntry(value: unknown): value is BookmarkEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    (v.kind === 'HERO' || v.kind === 'PLAYER') &&
    typeof v.targetId === 'string' &&
    typeof v.createdAt === 'number' &&
    (v.metadata === null || typeof v.metadata === 'object')
  );
}

function writeLocal(kind: BookmarkKind, entries: BookmarkEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(storageKeyFor(kind), JSON.stringify(entries));
}

function sortByRecent(entries: BookmarkEntry[]): BookmarkEntry[] {
  return [...entries].sort((a, b) => b.createdAt - a.createdAt);
}

interface UseBookmarksResult {
  hydrated: boolean;
  bookmarks: BookmarkEntry[];
  isBookmarked: (targetId: string) => boolean;
  add: (input: { targetId: string; metadata?: Record<string, unknown> }) => Promise<boolean>;
  remove: (targetId: string) => Promise<void>;
  limit: number;
}

/**
 * 회원: 백엔드 `/api/users/me/bookmarks` 호출. 게스트: localStorage.
 * mount/auth 변경 시 자동 refetch. `useImportLocalBookmarksOnLogin`이 별도로 게스트 → 서버 1회 흡수.
 */
export function useBookmarks(kind: BookmarkKind): UseBookmarksResult {
  const { user, status } = useCurrentUser();
  const [hydrated, setHydrated] = useState(false);
  const [bookmarks, setBookmarks] = useState<BookmarkEntry[]>([]);

  useEffect(() => {
    if (status === 'loading') {
      return;
    }

    let cancelled = false;
    if (user) {
      fetch(`/api/users/me/bookmarks?kind=${kind}`, { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : { items: [] }))
        .then((data: { items?: ServerBookmark[] }) => {
          if (cancelled) {
            return;
          }
          const items = (data.items ?? []).map(toEntry);
          setBookmarks(sortByRecent(items));
          setHydrated(true);
        })
        .catch(() => {
          if (!cancelled) {
            setBookmarks([]);
            setHydrated(true);
          }
        });
      return () => {
        cancelled = true;
      };
    }

    setBookmarks(sortByRecent(readLocal(kind)));
    setHydrated(true);

    const onStorage = (event: StorageEvent): void => {
      if (event.key !== storageKeyFor(kind) && event.key !== LEGACY_FAVORITE_KEY) {
        return;
      }
      setBookmarks(sortByRecent(readLocal(kind)));
    };
    window.addEventListener('storage', onStorage);
    return () => {
      cancelled = true;
      window.removeEventListener('storage', onStorage);
    };
  }, [kind, user, status]);

  const isBookmarked = useCallback((targetId: string) => bookmarks.some((b) => b.targetId === targetId), [bookmarks]);

  const add = useCallback(
    async (input: { targetId: string; metadata?: Record<string, unknown> }): Promise<boolean> => {
      if (bookmarks.some((b) => b.targetId === input.targetId)) {
        return true;
      }
      if (bookmarks.length >= BOOKMARK_LIMIT) {
        return false;
      }

      if (user) {
        const res = await fetch('/api/users/me/bookmarks', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ kind, targetId: input.targetId, metadata: input.metadata }),
        });
        if (!res.ok) {
          return false;
        }
        const row = (await res.json()) as ServerBookmark;
        setBookmarks((prev) => sortByRecent([...prev.filter((b) => b.targetId !== row.targetId), toEntry(row)]));
        return true;
      }

      const entry: BookmarkEntry = {
        kind,
        targetId: input.targetId,
        metadata: input.metadata ?? null,
        createdAt: Date.now(),
      };
      const next = sortByRecent([...readLocal(kind), entry]);
      writeLocal(kind, next);
      setBookmarks(next);
      return true;
    },
    [bookmarks, kind, user],
  );

  const remove = useCallback(
    async (targetId: string): Promise<void> => {
      if (user) {
        await fetch(`/api/users/me/bookmarks/${kind}/${encodeURIComponent(targetId)}`, { method: 'DELETE' });
        setBookmarks((prev) => prev.filter((b) => b.targetId !== targetId));
        return;
      }
      const next = readLocal(kind).filter((b) => b.targetId !== targetId);
      writeLocal(kind, next);
      setBookmarks(sortByRecent(next));
    },
    [kind, user],
  );

  return { hydrated, bookmarks, isBookmarked, add, remove, limit: BOOKMARK_LIMIT };
}

function toEntry(row: ServerBookmark): BookmarkEntry {
  return {
    kind: row.kind,
    targetId: row.targetId,
    metadata: row.metadata,
    createdAt: new Date(row.createdAt).getTime(),
  };
}

/**
 * 로그인 직후 게스트가 모아둔 localStorage 북마크(HERO/PLAYER + legacy `watchpoint:favorites:v1`)를
 * 서버로 1회 흡수한다. sessionStorage flag로 같은 세션에서 재실행 방지.
 *
 * site-header 등 layout-level client component에서 한 번만 mount할 것.
 */
export function useImportLocalBookmarksOnLogin(): void {
  const { user, status } = useCurrentUser();

  useEffect(() => {
    if (status !== 'ready' || !user || typeof window === 'undefined') {
      return;
    }

    const flagKey = `${IMPORT_FLAG_PREFIX}${user.id}`;
    if (window.sessionStorage.getItem(flagKey) === '1') {
      return;
    }

    const items = [...readLocal('HERO'), ...readLocal('PLAYER')];
    if (items.length === 0) {
      window.sessionStorage.setItem(flagKey, '1');
      return;
    }

    const payload = items.map(({ kind, targetId, metadata }) => ({
      kind,
      targetId,
      ...(metadata ? { metadata } : {}),
    }));

    fetch('/api/users/me/bookmarks/import', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ items: payload }),
    })
      .then((res) => {
        if (!res.ok) {
          return;
        }
        window.localStorage.removeItem(storageKeyFor('HERO'));
        window.localStorage.removeItem(storageKeyFor('PLAYER'));
        window.localStorage.removeItem(LEGACY_FAVORITE_KEY);
        window.sessionStorage.setItem(flagKey, '1');
        window.dispatchEvent(new StorageEvent('storage', { key: storageKeyFor('HERO') }));
        window.dispatchEvent(new StorageEvent('storage', { key: storageKeyFor('PLAYER') }));
      })
      .catch(() => undefined);
  }, [user, status]);
}
