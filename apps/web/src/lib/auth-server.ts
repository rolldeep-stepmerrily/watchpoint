import { cookies } from 'next/headers';

const API_BASE = process.env.WEB_API_BASE_URL ?? 'http://localhost:3000';

export const ACCESS_COOKIE = 'wp_access';
export const REFRESH_COOKIE = 'wp_refresh';

const ACCESS_MAX_AGE = 15 * 60;
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60;

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthMe {
  id: number;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: 'USER' | 'ADMIN';
  hasPassword: boolean;
  createdAt: string;
}

export const apiBase = (): string => API_BASE;

/**
 * 응답에 access/refresh를 httpOnly cookie로 심는다. response.cookies API 사용 — Next.js 15.
 */
export const setAuthCookies = (
  res: { cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void } },
  tokens: AuthTokens,
): void => {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
  };

  res.cookies.set(ACCESS_COOKIE, tokens.accessToken, { ...base, maxAge: ACCESS_MAX_AGE });
  res.cookies.set(REFRESH_COOKIE, tokens.refreshToken, { ...base, maxAge: REFRESH_MAX_AGE });
};

export const clearAuthCookies = (res: {
  cookies: { set: (name: string, value: string, opts: Record<string, unknown>) => void };
}): void => {
  const isProd = process.env.NODE_ENV === 'production';
  const base = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0,
  };

  res.cookies.set(ACCESS_COOKIE, '', base);
  res.cookies.set(REFRESH_COOKIE, '', base);
};

/**
 * 백엔드 호출에 현재 access cookie를 Bearer로 자동 첨부한다. cookie 없으면 401 즉시 응답.
 * BFF route handler 안에서만 사용 (cookies() 의존).
 */
export const fetchWithAuth = async (path: string, init: RequestInit = {}): Promise<Response> => {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;

  if (!access) {
    return new Response(JSON.stringify({ errorCode: 'AUTH_REQUIRED' }), {
      status: 401,
      headers: { 'content-type': 'application/json' },
    });
  }

  const headers = new Headers(init.headers);
  headers.set('authorization', `Bearer ${access}`);
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }

  return await fetch(`${API_BASE}${path}`, { ...init, headers });
};

/**
 * 현재 access cookie로 백엔드 /users/me 호출. 401/만료/미존재 시 null.
 */
export const getCurrentUser = async (): Promise<AuthMe | null> => {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;

  if (!access) {
    return null;
  }

  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: { authorization: `Bearer ${access}`, accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      return null;
    }

    return (await res.json()) as AuthMe;
  } catch {
    return null;
  }
};
