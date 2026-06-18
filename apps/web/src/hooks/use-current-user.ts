'use client';

import { useCallback, useEffect, useState } from 'react';

export interface CurrentUser {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  hasPassword: boolean;
  createdAt: string;
}

interface State {
  user: CurrentUser | null;
  status: 'loading' | 'ready';
}

export function useCurrentUser(): State & { refresh: () => Promise<void> } {
  const [state, setState] = useState<State>({ user: null, status: 'loading' });

  const refresh = useCallback(async (): Promise<void> => {
    try {
      const res = await fetch('/api/auth/me', { cache: 'no-store' });
      const data = (await res.json()) as { user: CurrentUser | null };
      setState({ user: data.user ?? null, status: 'ready' });
    } catch {
      setState({ user: null, status: 'ready' });
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [refresh]);

  return { ...state, refresh };
}
