import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { ACCESS_COOKIE, apiBase, clearAuthCookies, REFRESH_COOKIE } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(): Promise<NextResponse> {
  const store = await cookies();
  const access = store.get(ACCESS_COOKIE)?.value;
  const refresh = store.get(REFRESH_COOKIE)?.value;

  if (access && refresh) {
    // 백엔드에 access+refresh 폐기 알림. 결과는 신경 안 씀 — 어차피 cookie는 클리어한다.
    await fetch(`${apiBase()}/auth/logout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        authorization: `Bearer ${access}`,
      },
      body: JSON.stringify({ refreshToken: refresh }),
    }).catch(() => undefined);
  }

  const res = NextResponse.json({ ok: true });
  clearAuthCookies(res);
  return res;
}
