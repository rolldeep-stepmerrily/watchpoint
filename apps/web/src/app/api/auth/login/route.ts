import { NextResponse } from 'next/server';

import { type AuthTokens, apiBase, setAuthCookies } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.text();

  const apiRes = await fetch(`${apiBase()}/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json' },
    body,
  });

  const data = (await apiRes.json().catch(() => ({}))) as Partial<AuthTokens> & Record<string, unknown>;

  const res = NextResponse.json(apiRes.ok ? { ok: true } : data, { status: apiRes.status });

  if (apiRes.ok && data.accessToken && data.refreshToken) {
    setAuthCookies(res, { accessToken: data.accessToken, refreshToken: data.refreshToken });
  }

  return res;
}
