import { DEFAULT_LOCALE, isLocale } from '@@shared';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * 라우트 prefix가 없으면 default locale로 308 redirect. SEO상 검색엔진이 이전에 인덱싱한
 * 무-prefix URL(`/heroes`, `/patch-notes/...`)을 자연스럽게 locale prefix URL로 이전.
 *
 * 매칭 대상: 페이지 라우트만. `_next`/`api`/asset은 제외.
 */
export const middleware = (request: NextRequest): NextResponse => {
  const { pathname, search } = request.nextUrl;

  // 이미 locale prefix가 있으면 그대로 통과
  const segments = pathname.split('/').filter(Boolean);
  const first = segments[0];
  if (first && isLocale(first)) {
    return NextResponse.next();
  }

  // unprefixed 페이지 → /<defaultLocale>/<원래 경로>로 redirect
  const url = request.nextUrl.clone();
  url.pathname = `/${DEFAULT_LOCALE}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url, 308);
};

export const config = {
  // _next, api, robots/sitemap/manifest, public asset은 매처에서 제외
  matcher: ['/((?!_next|api|monitoring|.*\\.[a-zA-Z0-9]+$).*)'],
};
