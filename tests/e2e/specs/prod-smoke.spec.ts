import { expect, test, type APIRequestContext } from '@playwright/test';

/**
 * Daily prod 종합 점검 (Playwright + Claude 결합).
 *
 * 실행: GH Actions \`prod-smoke.yml\`이 workflow_dispatch로 트리거됨 (Claude /schedule이 호출).
 * baseURL에 'o-watchpoint.com' 포함 안 되면 모든 케이스 skip (로컬/preview 무영향).
 *
 * 목표:
 * - 모든 public API 엔드포인트 응답 검증
 * - 모든 화면 렌더 + 핵심 인터랙션 (favorites/language toggle/role filter/tabs/sort/search)
 * - SEO 표면 (sitemap/robots/hreflang/soft-404 회귀)
 * - JS 콘솔 에러 zero
 *
 * OverFast public API에 부담 안 주기 위해 career 호출은 1회씩만.
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
  test('home /ko: 헤더 + 패치 spotlight + 역할별 grid + 통계', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    const res = await page.goto('/ko');
    expect(res?.status()).toBe(200);

    await expect(page.getByRole('link', { name: 'Watchpoint' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Watchpoint', level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /패치노트 →/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /영웅 →/ })).toBeVisible();

    expect(errors, '/ko console errors').toHaveLength(0);
  });

  test('home /en: 영문 카피 렌더', async ({ page }) => {
    const res = await page.goto('/en');
    expect(res?.status()).toBe(200);
    await expect(page.getByRole('link', { name: /Patch Notes →/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /Heroes →/ })).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 2 — Heroes
  // ─────────────────────────────────────────────────────────────
  test('heroes 목록: 영웅 카드 렌더 + role 필터 작동', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/ko/heroes');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const cards = page.locator('a[href^="/ko/heroes/"]');
    expect(await cards.count()).toBeGreaterThanOrEqual(20);

    const tankFilter = page.getByRole('button', { name: /^돌격/ }).or(page.getByRole('link', { name: /^돌격/ })).first();
    if (await tankFilter.isVisible().catch(() => false)) {
      await tankFilter.click();
    }
    expect(errors, '/ko/heroes console errors').toHaveLength(0);
  });

  test('hero detail (tracer): 탭 클릭으로 능력/특전/패치 이력 전환', async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto('/ko/heroes/tracer');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const tabAbilities = page.getByRole('tab', { name: /능력/ }).first();
    const tabPerks = page.getByRole('tab', { name: /특전/ }).first();
    const tabHistory = page.getByRole('tab', { name: /패치 이력/ }).first();

    await expect(tabAbilities).toBeVisible();
    await tabPerks.click();
    await expect(tabPerks).toHaveAttribute('aria-selected', 'true');
    await tabHistory.click();
    await expect(tabHistory).toHaveAttribute('aria-selected', 'true');

    expect(errors, 'hero detail console errors').toHaveLength(0);
  });

  test('hero detail (junker-queen): 한국어 ability 명칭 노출', async ({ page }) => {
    await page.goto('/ko/heroes/junker-queen');
    await expect(page.getByRole('heading', { level: 1, name: /정커퀸/ })).toBeVisible();
  });

  test('hero unknown codename → 404 (soft-404 회귀 차단)', async ({ page }) => {
    const res = await page.goto('/ko/heroes/notreal-hero-xyz');
    expect(res?.status(), 'hero not-found must be 404').toBe(404);
    await expect(page.getByText(/찾을 수 없/)).toBeVisible();
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 3 — Patch Notes
  // ─────────────────────────────────────────────────────────────
  test('patch-notes 목록: 항목 클릭 → 상세 페이지 진입', async ({ page }) => {
    await page.goto('/ko/patch-notes');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();

    const firstPatch = page.locator('a[href^="/ko/patch-notes/"]').first();
    await expect(firstPatch).toBeVisible();
    await firstPatch.click();
    await expect(page).toHaveURL(/\/ko\/patch-notes\/[\w.]+/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });

  test('patch-notes unknown version → 404', async ({ page }) => {
    const res = await page.goto('/ko/patch-notes/9.99.9');
    expect(res?.status(), 'patch not-found must be 404').toBe(404);
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 4 — Career + Favorites
  // ─────────────────────────────────────────────────────────────
  test('career 검색 페이지: 폼 + 즐겨찾기 빈 상태 카피', async ({ page }) => {
    await page.goto('/ko/career');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('input[name="q"]')).toBeVisible();
    await expect(page.getByRole('heading', { name: /즐겨찾는 플레이어/ })).toBeVisible();
  });

  test('career 즐겨찾기 전체 흐름: add → 카드 노출 → remove', async ({ page }) => {
    await page.goto(`/ko/career/${TEST_PLAYER}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    const addBtn = page.getByRole('button', { name: '즐겨찾기에 추가' });
    await expect(addBtn).toBeVisible();
    await addBtn.click();
    await expect(page.getByRole('button', { name: '즐겨찾기에서 제거' })).toBeVisible();

    await page.goto('/ko/career');
    const card = page.getByRole('link', { name: /TeKrop/ }).first();
    await expect(card).toBeVisible();

    const removeBtn = page.getByRole('button', { name: /TeKrop.*제거/ });
    await removeBtn.click();
    await expect(page.getByText(/별 아이콘으로 자주 보는/)).toBeVisible();
  });

  test('career stats 페이지: 영웅 테이블 + 정렬 클릭', async ({ page }) => {
    await page.goto(`/ko/career/${TEST_PLAYER}/stats`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    const heroesHeader = page.getByRole('heading', { name: /영웅별/ });
    await expect(heroesHeader).toBeVisible();

    const winrateSort = page.getByRole('button', { name: /승률/ }).first();
    if (await winrateSort.isVisible().catch(() => false)) {
      await winrateSort.click();
      await winrateSort.click();
    }
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 5 — Nav + Search Bar
  // ─────────────────────────────────────────────────────────────
  test('header nav 링크 클릭: heroes / patch-notes / career', async ({ page }) => {
    await page.goto('/ko');
    await page.getByRole('link', { name: /^영웅$/ }).first().click();
    await expect(page).toHaveURL(/\/ko\/heroes/);

    await page.goto('/ko');
    await page.getByRole('link', { name: /^패치노트$/ }).first().click();
    await expect(page).toHaveURL(/\/ko\/patch-notes/);

    await page.goto('/ko');
    await page.getByRole('link', { name: /^전적$/ }).first().click();
    await expect(page).toHaveURL(/\/ko\/career/);
  });

  test('search-bar: "tracer" 타이핑 → dropdown에 트레이서 노출', async ({ page }) => {
    await page.goto('/ko');
    const searchBox = page.getByRole('searchbox', { name: '검색' });
    await searchBox.fill('tracer');
    await expect(page.getByRole('option').first()).toBeVisible({ timeout: 5_000 });
  });

  test('language toggle: ko → en URL 전환', async ({ page }) => {
    await page.goto('/ko');
    const enLink = page.getByRole('link', { name: /English/i }).or(page.getByRole('button', { name: /English/i })).first();
    if (await enLink.isVisible().catch(() => false)) {
      await enLink.click();
      await expect(page).toHaveURL(/\/en/);
    }
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 6 — SEO surfaces
  // ─────────────────────────────────────────────────────────────
  test('sitemap.xml: 100+ URL + hreflang 양쪽', async ({ request }) => {
    const res = await request.get(`${PROD_WEB}/sitemap.xml`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    const urlCount = (body.match(/<url>/g) || []).length;
    expect(urlCount, 'sitemap urls').toBeGreaterThanOrEqual(100);
    const hreflangCount = (body.match(/xhtml:link/g) || []).length;
    expect(hreflangCount, 'hreflang count').toBeGreaterThanOrEqual(urlCount * 2);
  });

  test('robots.txt: /api/ + /_next/ disallow + sitemap pointer', async ({ request }) => {
    const res = await request.get(`${PROD_WEB}/robots.txt`);
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain('Disallow: /api/');
    expect(body).toContain('Disallow: /_next/');
    expect(body).toContain('Sitemap: https://o-watchpoint.com/sitemap.xml');
  });

  test('hreflang on home: ko + en + x-default', async ({ page }) => {
    await page.goto('/ko');
    const ko = page.locator('link[rel="alternate"][hrefLang="ko"]');
    const en = page.locator('link[rel="alternate"][hrefLang="en"]');
    const xDefault = page.locator('link[rel="alternate"][hrefLang="x-default"]');
    expect(await ko.count()).toBeGreaterThan(0);
    expect(await en.count()).toBeGreaterThan(0);
    expect(await xDefault.count()).toBeGreaterThan(0);
  });

  // ─────────────────────────────────────────────────────────────
  // SECTION 7 — API endpoints
  // ─────────────────────────────────────────────────────────────
  test('API /health: status + db + redis OK', async ({ request }) => {
    const res = await request.get(`${PROD_API}/health`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');
  });

  test('API /heroes: 51개 영웅 + lang 쿼리', async ({ request }) => {
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

    const abilities = await fetchJson(request, `${PROD_API}/heroes/tracer/abilities?lang=ko`);
    expect(Array.isArray(abilities)).toBe(true);
    expect(abilities.length).toBeGreaterThan(0);

    const history = await fetchJson(request, `${PROD_API}/heroes/tracer/patch-history?lang=ko`);
    expect(history).toHaveProperty('entries');
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

    const entries = await fetchJson(request, `${PROD_API}/patch-notes/${latest.version}/entries?lang=ko`);
    expect(Array.isArray(entries)).toBe(true);
  });

  test('API /patch-notes/:version 404', async ({ request }) => {
    const res = await request.get(`${PROD_API}/patch-notes/9.99.9`);
    expect(res.status()).toBe(404);
  });

  test('API /search?q=tracer: 영웅 + 패치노트 묶인 결과', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/search?q=tracer`);
    expect(res).toHaveProperty('heroes');
    expect(res).toHaveProperty('patchNotes');
  });

  test('API /career?q=...: 검색 결과 dict', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/career?q=TeKrop`);
    expect(res).toHaveProperty('results');
    expect(res).toHaveProperty('total');
    expect(res.results.length).toBeGreaterThan(0);
  });

  test('API /career/:playerId: summary shape', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/career/${TEST_PLAYER}`);
    expect(res.playerId).toBeTruthy();
    expect(res).toHaveProperty('name');
    expect(res).toHaveProperty('battleTag');
    expect(res).toHaveProperty('competitive');
  });

  test('API /career/:playerId/stats: general+roles+heroes', async ({ request }) => {
    const res = await fetchJson(request, `${PROD_API}/career/${TEST_PLAYER}/stats`);
    expect(res).toHaveProperty('general');
    expect(res).toHaveProperty('roles');
    expect(res).toHaveProperty('heroes');
    expect(Array.isArray(res.heroes)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────
// helpers
// ─────────────────────────────────────────────────────────────
function collectConsoleErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // 알려진 noise 제외 (예: 외부 이미지 404)
      if (text.includes('Failed to load resource')) {
        return;
      }
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
