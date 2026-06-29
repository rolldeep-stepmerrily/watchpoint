import { DEFAULT_LOCALE, HERO_CODENAMES, isLocale } from '@@shared';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * 1. 라우트 prefix가 없으면 default locale로 308 redirect. SEO상 검색엔진이 이전에
 *    인덱싱한 무-prefix URL(`/heroes`, `/patch-notes/...`)을 자연스럽게 locale prefix
 *    URL로 이전.
 * 2. `/<locale>/heroes/<codename>`은 codename이 카탈로그에 존재하는지 사전 검증. 없으면
 *    NextResponse.rewrite로 status 404 강제 → Next.js 15 + Vercel에서 `notFound()`가
 *    status 200으로 응답하는 soft-404 quirk를 우회.
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

  // /<locale>/heroes/<codename> 단일 세그먼트만 사전 검증.
  // 하위 경로(/abilities 같은 잠재 확장)는 Next.js 라우터가 404 처리하므로 건드리지 않음.
  if (segments[1] === 'heroes' && segments.length === 3) {
    const codename = segments[2];
    if (!HERO_CODENAMES.has(codename)) {
      return NextResponse.rewrite(request.nextUrl, { status: 404 });
    }
  }

  return NextResponse.next();
};

export const config = {
  // _next, api, robots/sitemap/manifest, public asset은 매처에서 제외
  matcher: ['/((?!_next|api|monitoring|.*\\.[a-zA-Z0-9]+$).*)'],
};
