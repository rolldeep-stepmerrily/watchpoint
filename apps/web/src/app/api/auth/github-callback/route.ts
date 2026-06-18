import { NextResponse } from 'next/server';

import { setAuthCookies } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Backend `/auth/github/callback`가 토큰을 query string에 담아 redirect해온다.
 * 여기서 httpOnly cookie로 옮기고 query 없는 홈으로 redirect — 토큰이 브라우저 history/referrer로 새지 않게.
 */
export function GET(request: Request): NextResponse {
  const url = new URL(request.url);
  const accessToken = url.searchParams.get('accessToken');
  const refreshToken = url.searchParams.get('refreshToken');

  if (accessToken === null || refreshToken === null) {
    const fail = new URL('/', url.origin);
    fail.searchParams.set('auth_error', 'github_callback_missing_token');
    return NextResponse.redirect(fail);
  }

  const res = NextResponse.redirect(new URL('/', url.origin));
  setAuthCookies(res, { accessToken, refreshToken });
  return res;
}
