import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { type AuthTokens, apiBase, clearAuthCookies, REFRESH_COOKIE, setAuthCookies } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const store = await cookies();
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (!refresh) {
    return NextResponse.json({ ok: false, error: 'no_refresh_token' }, { status: 401 });
  }

  const apiRes = await fetch(`${apiBase()}/auth/refresh`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      accept: 'application/json',
      authorization: `Bearer ${refresh}`,
    },
  });

  if (!apiRes.ok) {
    const failed = NextResponse.json({ ok: false, error: 'refresh_failed' }, { status: apiRes.status });
    clearAuthCookies(failed);
    return failed;
  }

  const data = (await apiRes.json()) as AuthTokens;
  const res = NextResponse.json({ ok: true });
  setAuthCookies(res, data);
  return res;
}
