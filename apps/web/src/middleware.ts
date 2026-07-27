import { DEFAULT_LOCALE, isLocale } from '@@shared';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * 라우트 prefix가 없으면 default locale로 308 redirect. SEO상 검색엔진이 이전에
 * 인덱싱한 무-prefix URL(`/heroes`, `/patch-notes/...`)을 자연스럽게 locale prefix
 * URL로 이전.
 *
 * 매처는 페이지 라우트만. `_next`/`api`/asset은 제외.
 *
 * NOTE: 과거에 `/<locale>/heroes/<codename>`의 존재 여부를 HERO_CODENAMES으로 사전 검증해
 * NextResponse.rewrite(status: 404)를 반환했으나, Next.js 15에서 이 패턴이 built-in
 * `/_not-found` 라우트를 렌더링해 커스텀 not-found.tsx를 우회하는 버그가 있다.
 * 대신 page.tsx의 `notFound()` 호출에 의존 (soft-404, task #219).
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
