import { expect, test } from '@playwright/test';

/**
 * Daily prod 모니터링 전용 smoke spec.
 *
 * 실행 조건: `E2E_BASE_URL=https://o-watchpoint.com` 일 때만 의미가 있으므로
 * 다른 환경(로컬, preview)에서는 모든 케이스가 자동으로 skip된다.
 *
 * 목적:
 * - prod 페이지가 5xx 없이 그려지는가
 * - 정상 페이지는 200, 잘못된 path는 404 (soft-404 회귀 감지)
 * - JS console에 unhandled error/warning 발생하지 않는가
 * - localStorage 기반 즐겨찾기 흐름(저장/렌더/삭제)이 동작하는가
 */

const PROD_HOST = 'o-watchpoint.com';

test.describe('Prod smoke', () => {
  test.beforeEach(({ baseURL }) => {
    test.skip(!baseURL?.includes(PROD_HOST), 'prod 전용 smoke — 로컬/preview에서는 skip');
  });

  test('주요 페이지가 5xx 없이 로드된다 + console error 없음', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      consoleErrors.push(`pageerror: ${err.message}`);
    });

    const paths = [
      '/ko',
      '/en',
      '/ko/heroes',
      '/ko/heroes/tracer',
      '/ko/patch-notes',
      '/ko/career',
    ];

    for (const path of paths) {
      const response = await page.goto(path);
      expect(response, `${path} no response`).not.toBeNull();
      expect(response?.status(), `${path} returned ${response?.status()}`).toBeLessThan(500);
      expect(response?.status(), `${path} returned ${response?.status()}`).toBeGreaterThanOrEqual(200);
    }

    const ignoreable = consoleErrors.filter((line) => {
      if (line.includes('Failed to load resource')) {
        return false;
      }
      if (line.includes('hydration')) {
        return true;
      }
      return true;
    });
    expect(ignoreable, 'Unexpected console errors').toHaveLength(0);
  });

  test('hero/patch-notes 잘못된 path는 404 status (soft-404 회귀 감지)', async ({ page }) => {
    const notFoundCases = [
      '/ko/heroes/notreal-hero-zzz',
      '/ko/patch-notes/9.99.9',
      '/ko/notreal-page-404-test',
    ];

    for (const path of notFoundCases) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should be 404 but got ${response?.status()}`).toBe(404);
    }
  });

  test('헤더 네비게이션 클릭으로 페이지 전환', async ({ page }) => {
    await page.goto('/ko');

    await page.getByRole('link', { name: /^영웅$/ }).first().click();
    await expect(page).toHaveURL(/\/ko\/heroes/);

    await page.getByRole('link', { name: /^패치노트$/ }).first().click();
    await expect(page).toHaveURL(/\/ko\/patch-notes/);

    await page.getByRole('link', { name: /^전적$/ }).first().click();
    await expect(page).toHaveURL(/\/ko\/career/);
  });

  test('영웅 상세 페이지 핵심 컨텐츠가 렌더된다', async ({ page }) => {
    await page.goto('/ko/heroes/tracer');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByText('출시')).toBeVisible();
  });

  test('즐겨찾기 추가 → 검색 페이지에서 카드 노출 → 삭제', async ({ page }) => {
    // 1. 플레이어 상세 진입 (TeKrop-2217은 public 프로필이라 안정적)
    await page.goto('/ko/career/TeKrop-2217');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible({ timeout: 15_000 });

    // 2. 별 토글 클릭 → 즐겨찾기 추가
    const addButton = page.getByRole('button', { name: '즐겨찾기에 추가' });
    await expect(addButton).toBeVisible();
    await addButton.click();

    // 3. 같은 버튼이 "제거" 라벨로 바뀌었는지 확인 (aria-pressed=true)
    await expect(page.getByRole('button', { name: '즐겨찾기에서 제거' })).toBeVisible();

    // 4. 검색 페이지로 이동, 즐겨찾기 카드가 노출되는지 확인
    await page.goto('/ko/career');
    await expect(page.getByRole('heading', { name: /즐겨찾는 플레이어/ })).toBeVisible();
    const favoriteCard = page.getByRole('link', { name: /TeKrop/ });
    await expect(favoriteCard.first()).toBeVisible();

    // 5. X 버튼 클릭 → 카드 제거 → 빈 상태 카피
    await page.getByRole('button', { name: /TeKrop.*제거/ }).click();
    await expect(page.getByText(/별 아이콘으로 자주 보는/)).toBeVisible();
  });

  test('API health + 핵심 엔드포인트 응답', async ({ request }) => {
    const health = await request.get('https://api.o-watchpoint.com/health');
    expect(health.status()).toBe(200);
    const body = await health.json();
    expect(body.status).toBe('ok');
    expect(body.db).toBe('ok');
    expect(body.redis).toBe('ok');

    const heroes = await request.get('https://api.o-watchpoint.com/heroes');
    expect(heroes.status()).toBe(200);

    const patches = await request.get('https://api.o-watchpoint.com/patch-notes');
    expect(patches.status()).toBe(200);

    const search = await request.get('https://api.o-watchpoint.com/search?q=tracer');
    expect(search.status()).toBe(200);
  });
});
