import { DEFAULT_LOCALE, isLocale } from '@@shared';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * 라우트 prefix가 없으면 default locale로 308 redirect. SEO상 검색엔진이 이전에
 * 인덱싱한 무-prefix URL(`/heroes`, `/patch-notes/...`)을 자연스럽게 locale prefix
 * URL로 이전.
 *
 * 영웅 codename 사전 검증 + NextResponse.rewrite(..., { status: 404 })로 soft-404를
 * 우회하던 시도는 제거됨: Vercel이 그 응답을 자체 정적 /404 폴백으로 매칭해
 * (x-matched-path: /404) not-found.tsx의 커스텀 UI 자체가 사라지는 회귀를 유발했다.
 * 페이지 쪽 notFound() 호출에 맡기고, status 200으로 응답하는 soft-404 quirk는
 * patch-notes와 동일하게 잔존 — task #219에서 추적.
 *
 * 매처는 페이지 라우트만. `_next`/`api`/asset은 제외.
 */
export const middleware = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];

  // unprefixed 페이지 → /<defaultLocale>/<원래 경로>로 redirect
  if (!(first && isLocale(first))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
    url.search = search;
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
};

export const config = {
  // _next, api, robots/sitemap/manifest, public asset은 매처에서 제외
  matcher: ['/((?!_next|api|monitoring|.*\\.[a-zA-Z0-9]+$).*)'],
};
