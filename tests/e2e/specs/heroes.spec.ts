import { expect, test } from '@playwright/test';

test.describe('영웅', () => {
  test('영웅 목록 → 상세 페이지 진입', async ({ page }) => {
    await page.goto('/heroes');

    await expect(page.getByRole('heading', { name: /^영웅 \(\d+\)$/ })).toBeVisible();

    const firstHero = page.locator('a[href^="/heroes/"]').first();
    await expect(firstHero).toBeVisible();

    const heroName = (await firstHero.locator('div.font-semibold').first().textContent())?.trim();
    expect(heroName).toBeTruthy();

    await firstHero.click();

    await expect(page).toHaveURL(/\/heroes\/[^/]+$/);
    if (heroName) {
      await expect(page.getByRole('heading', { name: heroName, level: 1 })).toBeVisible();
    }
  });

  test('역할 그룹 헤더가 표시된다', async ({ page }) => {
    await page.goto('/heroes');

    const visibleRoles = await Promise.all(
      ['돌격', '공격', '지원'].map((label) => page.getByRole('heading', { name: label, level: 2 }).isVisible()),
    );
    expect(visibleRoles.some(Boolean)).toBe(true);
  });
});
