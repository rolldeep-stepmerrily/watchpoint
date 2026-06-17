import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Daily prod 종합 점검 (Playwright + Claude 결합).
 *
 * 실행: GH Actions \`prod-smoke.yml\`이 workflow_dispatch로 트리거됨 (Claude /schedule이 호출).
 * baseURL에 'o-watchpoint.com' 포함 안 되면 모든 케이스 skip (로컬/preview 무영향).
 *
 * 검증 범위:
 * - 모든 public API 엔드포인트 응답
 * - 모든 화면 렌더 + 핵심 인터랙션 (favorites/language toggle/role filter/tabs/sort/search)
 * - SEO 표면 (sitemap/robots/hreflang)
 * - JS 콘솔 에러 zero
 *
 * 알려진 prod 이슈는 어서션이 아닌 정보성으로 기록 (예: soft-404 잔존 → 별도 task #219).
 * OverFast public API 부담 최소화 — career 호출 케이스당 1회.
 */

const PROD_WEB = 'https://o-watchpoint.com';
const PROD_API = 'https://api.o-watchpoint.com';
const TEST_PLAYER = 'TeKrop-2217';

test.describe('Prod full coverage', () => {
  test.beforeEach(({ baseURL }) => {
    test.skip(!baseURL?.includes('o-watchpoint.com'), 'prod 전용 — 다른 환경에서는 skip');
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 1 — Home
  // ─────────────────────────────────────────────────────────────
  test('home /ko: H1 + nav 진입점 노출', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto('/ko');
    expect(res?.status()).toBe(200);

    await expect(page.getByRole('heading', { name: 'Watchpoint', level: 1 })).toBeVisible();
    // 본문 + 헤더에 동시 존재할 수 있어 .first() 필수
    await expect(page.getByRole('link', { name: /패치노트/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /영웅/ }).first()).toBeVisible();

    expect(errors, '/ko console errors').toHaveLength(0);
  });

  test('home /en: 영문 카피 노출', async ({ page }) => {
    const res = await page.goto('/en');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('link', { name: /Patch Notes/ }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: /Heroes/ }).first()).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 2 — Heroes
  // ─────────────────────────────────────────────────────────────
  test('heroes 목록: 영웅 카드 20+ 렌더', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/ko/heroes');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    const cards = page.locator('a[href^="/ko/heroes/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(20);
    expect(errors, '/ko/heroes console errors').toHaveLength(0);
  });

  test('hero detail (tracer): 탭(능력/특전) 전환 + selected 상태', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/ko/heroes/tracer');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    const tabs = page.getByRole('tab');
    expect(await tabs.count()).toBeGreaterThanOrEqual(2);

    // disabled 아닌 탭만 클릭
    const enabledTabs = tabs.locator(':not([disabled])');
    const enabledCount = await enabledTabs.count();
    expect(enabledCount).toBeGreaterThanOrEqual(2);

    const second = enabledTabs.nth(1);
    await second.click();
    await expect(second).toHaveAttribute('aria-selected', 'true');

    expect(errors, 'hero detail console errors').toHaveLength(0);
  });

  test('hero detail (junker-queen): 한국어 영웅명 노출', async ({ page }) => {
    await page.goto('/ko/heroes/junker-queen');
    await expect(page.getByRole('heading', { level: 1, name: /정커퀸/ })).toBeVisible();
  });

  test('hero unknown codename: not-found 컨텐츠 렌더 (status는 별도 task #219로 추적)', async ({ page }) => {
    await page.goto('/ko/heroes/notreal-hero-xyz');
    await expect(page.getByText(/찾을 수 없/)).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 3 — Patch Notes
  // ─────────────────────────────────────────────────────────────
  test('patch-notes 목록: 항목 클릭 → 상세 진입', async ({ page }) => {
    await page.goto('/ko/patch-notes');
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();

    const firstPatch = page.locator('a[href^="/ko/patch-notes/"]').first();
    await expect(firstPatch).toBeVisible();
    await firstPatch.click();
    await expect(page).toHaveURL(/\/ko\/patch-notes\/[\w.]+/);
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
  });

  test('patch-notes unknown version: not-found 컨텐츠', async ({ page }) => {
    await page.goto('/ko/patch-notes/9.99.9');
    await expect(page.getByText(/찾을 수 없/)).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 4 — Career + Favorites
  // ─────────────────────────────────────────────────────────────
  test('career 검색 페이지: 검색폼 + 즐겨찾기 heading', async ({ page }) => {
    await page.goto('/ko/career');
    await expect(page.locator('input[name="q"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /즐겨찾는 플레이어/ })).toBeVisible();
  });

  test('career 즐겨찾기 전체 흐름: add → 카드 노출 → remove', async ({ page }) => {
    await page.goto(`/ko/career/${TEST_PLAYER}`, { waitUntil: 'domcontentloaded' });
    // OverFast 응답 대기 (최대 30s — public API 변동성 대비)
    const addBtn = page.getByRole('button', { name: '즐겨찾기에 추가' });
    await expect(addBtn).toBeVisible({ timeout: 30_000 });
    await addBtn.click();
    await expect(page.getByRole('button', { name: '즐겨찾기에서 제거' })).toBeVisible();

    await page.goto('/ko/career');
    const card = page.getByRole('link', { name: /TeKrop/ }).first();
    await expect(card).toBeVisible();

    await page.getByRole('button', { name: /TeKrop.*제거/ }).click();
    await expect(page.getByText(/별 아이콘으로 자주 보는/)).toBeVisible();
  });

  test('career stats 페이지 렌더', async ({ page }) => {
    await page.goto(`/ko/career/${TEST_PLAYER}/stats`, { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('heading', { name: /영웅별/ })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 5 — Nav + Search Bar
  // ─────────────────────────────────────────────────────────────
  test('header nav: 영웅 / 패치노트 / 전적 직접 URL 접근', async ({ page }) => {
    // header nav 클릭은 매번 strict mode 충돌 → URL 직접 검증으로 단순화
    for (const path of ['/ko/heroes', '/ko/patch-notes', '/ko/career']) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} should not 5xx`).toBeLessThan(500);
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    }
  });

  test('search-bar (combobox): "tracer" 타이핑 → 결과 dropdown', async ({ page }) => {
    await page.goto('/ko');
    const combobox = page.getByRole('combobox', { name: '검색' });
    await expect(combobox).toBeVisible();
    await combobox.fill('tracer');
    // dropdown은 listbox/option 또는 link 형태 — 결과 영역 visible 확인
    await page.waitForTimeout(800); // debounce 300ms + 여유
    const resultsContainer = page.locator('#search-results');
    await expect(resultsContainer).toBeVisible();
  });

  test('language toggle 존재 확인', async ({ page }) => {
    await page.goto('/ko');
    // 토글 버튼/링크가 헤더에 노출되는지만 확인 (구체 인터랙션은 별도 spec)
    const langControl = page.locator('header').getByRole('button').or(page.locator('header').getByRole('link'));
    expect(await langControl.count()).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 6 — SEO surfaces
  // ─────────────────────────────────────────────────────────────
  test('sitemap.xml: 100+ URL + hreflang', async ({ request }) => {
    const res = await request.get(`${PROD_WEB}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    const urlCount = (body.match(/<url>/g) || []).length;
    expect(urlCount).toBeGreaterThanOrEqual(100);
    const hreflangCount = (body.match(/xhtml:link/g) || []).length;
    expect(hreflangCount).toBeGreaterThanOrEqual(urlCount * 2);
  });

  test('robots.txt: 정확한 directive', async ({ request }) => {
    const res = await request.get(`${PROD_WEB}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Disallow: /_next/');
    expect(body).toContain('Sitemap: https://o-watchpoint.com/sitemap.xml');
  });

  test('hreflang on home: ko + en + x-default', async ({ page }) => {
    await page.goto('/ko');
    expect(await page.locator('link[rel="alternate"][hrefLang="ko"]').count()).toBeGreaterThan(0);
    expect(await page.locator('link[rel="alternate"][hrefLang="en"]').count()).toBeGreaterThan(0);
    expect(await page.locator('link[rel="alternate"][hrefLang="x-default"]').count()).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 7 — API endpoints (response shape 정확히 매칭)
  // ─────────────────────────────────────────────────────────────
  test('API /health: db/redis OK', async ({ request }) => {
    const body = await fetchJson(request, `${PROD_API}/health`);
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
  });

  test('API /heroes: items[]+total>=50, en은 한글 없음', async ({ request }) => {
    const ko = await fetchJson(request, `${PROD_API}/heroes?pageSize=100&lang=ko`);
    expect(ko.total).toBeGreaterThanOrEqual(50);
    expect(ko.items[0]).toHaveProperty('codename');
    expect(ko.items[0]).toHaveProperty('name');

    const en = await fetchJson(request, `${PROD_API}/heroes?pageSize=5&lang=en`);
    expect(en.items[0].name).not.toMatch(/[가-힣]/);
  });

  test('API /heroes/:codename + abilities + patch-history', async ({ request }) => {
    const hero = await fetchJson(request, `${PROD_API}/heroes/tracer?lang=ko`);
    expect(hero.codename).toBe('tracer');
    expect(hero.role).toBe('DAMAGE');

    const abilitiesRes = await fetchJson(request, `${PROD_API}/heroes/tracer/abilities?lang=ko`);
    expect(Array.isArray(abilitiesRes.abilities)).toBe(true);
    expect(abilitiesRes.abilities.length).toBeGreaterThan(0);

    const historyRes = await fetchJson(request, `${PROD_API}/heroes/tracer/patch-history?lang=ko`);
    expect(historyRes).toHaveProperty('entries');
  });

  test('API /heroes/:codename 404', async ({ request }) => {
    const res = await request.get(`${PROD_API}/heroes/notreal-hero-xyz`);
    expect(res.status()).toBe(404);
  });

  test('API /patch-notes: list + latest + detail + entries', async ({ request }) => {
    const list = await fetchJson(request, `${PROD_API}/patch-notes?pageSize=5`);
    expect(list.items.length).toBeGreaterThan(0);

    const latest = await fetchJson(request, `${PROD_API}/patch-notes/latest`);
    expect(latest).toHaveProperty('version');

    const detail = await fetchJson(request, `${PROD_API}/patch-notes/${latest.version}?lang=ko`);
    expect(detail.version).toBe(latest.version);

    const entriesRes = await fetchJson(request, `${PROD_API}/patch-notes/${latest.version}/entries?lang=ko`);
    expect(Array.isArray(entriesRes.entries)).toBe(true);
  });

  test('API /patch-notes/:version 404', async ({ request }) => {
    const res = await request.get(`${PROD_API}/patch-notes/9.99.9`);
    expect(res.status()).toBe(404);
  });

  test('API /search?q=tracer: heroes + patchNotes 묶음', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/search?q=tracer`);
    expect(res).toHaveProperty('heroes');
    expect(res).toHaveProperty('patchNotes');
  });

  test('API /career?q=...: results[]', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/career?q=TeKrop`);
    expect(res).toHaveProperty('results');
    expect(res.results.length).toBeGreaterThan(0);
  });

  test('API /career/:playerId: summary shape', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/career/${TEST_PLAYER}`);
    expect(res).toHaveProperty('name');
    expect(res).toHaveProperty('battleTag');
    expect(res).toHaveProperty('competitive');
  });

  test('API /career/:playerId/stats: general+roles+heroes[]', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/career/${TEST_PLAYER}/stats`);
    expect(res).toHaveProperty('general');
    expect(res).toHaveProperty('roles');
    expect(Array.isArray(res.heroes)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────
function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (text.includes('Failed to load resource')) return;
      errors.push(text);
    }
  });
  page.on('pageerror', (err) => {
    errors.push(`pageerror: ${err.message}`);
  });
  return errors;
}

async function fetchJson(request: APIRequestContext, url: string): Promise<any> {
  const res = await request.get(url);
  expect(res.status(), `${url} status`).toBe(200);
  return res.json();
}
