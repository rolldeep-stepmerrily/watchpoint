'use client';

import { useCallback, useEffect, useState } from 'react';

export interface CareerFavoriteEntry {
  playerId: string;
  name: string;
  avatar: string | null;
  addedAt: number;
}

const STORAGE_KEY = 'watchpoint:favorites:v1';
const MAX_FAVORITES = 20;

function readStorage(): CareerFavoriteEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.filter(isValidEntry).slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

function isValidEntry(value: unknown): value is CareerFavoriteEntry {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const v = value as Record<string, unknown>;
  return (
    typeof v.playerId === 'string' &&
    typeof v.name === 'string' &&
    (v.avatar === null || typeof v.avatar === 'string') &&
    typeof v.addedAt === 'number'
  );
}

function writeStorage(entries: CareerFavoriteEntry[]): void {
  if (typeof window === 'undefined') {
    return;
  }
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

/**
 * 즐겨찾기 플레이어 목록을 localStorage에서 읽고 쓴다. SSR 안전(`hydrated=false` 동안 빈 배열),
 * 동일 도메인 다른 탭과 storage 이벤트로 동기화. 정원 초과는 add 시 reject(false 반환).
 */
export function useFavorites(): {
  hydrated: boolean;
  favorites: CareerFavoriteEntry[];
  isFavorite: (playerId: string) => boolean;
  add: (entry: Omit<CareerFavoriteEntry, 'addedAt'>) => boolean;
  remove: (playerId: string) => void;
  limit: number;
} {
  const [hydrated, setHydrated] = useState(false);
  const [favorites, setFavorites] = useState<CareerFavoriteEntry[]>([]);

  useEffect(() => {
    setFavorites(sortByRecent(readStorage()));
    setHydrated(true);

    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) {
        return;
      }
      setFavorites(sortByRecent(readStorage()));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isFavorite = useCallback(
    (playerId: string) => favorites.some((entry) => entry.playerId === playerId),
    [favorites],
  );

  const add = useCallback((input: Omit<CareerFavoriteEntry, 'addedAt'>): boolean => {
    const current = readStorage();
    if (current.some((entry) => entry.playerId === input.playerId)) {
      return true;
    }
    if (current.length >= MAX_FAVORITES) {
      return false;
    }
    const next = [...current, { ...input, addedAt: Date.now() }];
    writeStorage(next);
    setFavorites(sortByRecent(next));
    return true;
  }, []);

  const remove = useCallback((playerId: string) => {
    const next = readStorage().filter((entry) => entry.playerId !== playerId);
    writeStorage(next);
    setFavorites(sortByRecent(next));
  }, []);

  return { hydrated, favorites, isFavorite, add, remove, limit: MAX_FAVORITES };
}

function sortByRecent(entries: CareerFavoriteEntry[]): CareerFavoriteEntry[] {
  return [...entries].sort((a, b) => b.addedAt - a.addedAt);
}
