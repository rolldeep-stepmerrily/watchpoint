import { DEFAULT_LOCALE, HERO_CODENAMES, isLocale } from '@@shared';
import { type NextRequest, NextResponse } from 'next/server';

/**
 * 1. 라우트 prefix가 없으면 default locale로 308 redirect. SEO상 검색엔진이 이전에
 *    인덱싱한 무-prefix URL(`/heroes`, `/patch-notes/...`)을 자연스럽게 locale prefix
 *    URL로 이전.
 * 2. `/<locale>/heroes/<codename>`은 codename이 카탈로그에 존재하는지 사전 검증. 없으면
 *    그냥 next()로 통과시켜 page.tsx의 notFound() 호출이 한국어 not-found.tsx를 렌더하도록
 *    위임. HTTP status soft-404 이슈는 task #219에서 별도 추적.
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
  // 알 수 없는 codename은 page.tsx의 notFound() 호출에 맡겨 한국어 not-found.tsx를 렌더.
  // (이전에 NextResponse.rewrite + status:404 를 썼으나 Next.js 기본 영문 404가 노출되는
  //  부작용이 있었음 — HTTP status soft-404 이슈는 task #219에서 별도 추적)
  if (segments[1] === 'heroes' && segments.length === 3) {
    if (!HERO_CODENAMES.has(segments[2])) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
};

export const config = {
  // _next, api, robots/sitemap/manifest, public asset은 매처에서 제외
  matcher: ['/((?!_next|api|monitoring|.*\\.[a-zA-Z0-9]+$).*)'],
};
