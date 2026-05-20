import { expect, test } from '@playwright/test';

test.describe('검색', () => {
  test('검색바 입력 → 드롭다운 결과 노출', async ({ page }) => {
    await page.goto('/');

    const searchbox = page.getByRole('searchbox', { name: '검색' });
    await searchbox.click();
    await searchbox.fill('시');

    const dropdown = page.locator('#search-results');
    await expect(dropdown).toBeVisible({ timeout: 10_000 });
  });

  test('Esc로 검색 드롭다운 닫힘 + 쿼리 초기화', async ({ page }) => {
    await page.goto('/');

    const searchbox = page.getByRole('searchbox', { name: '검색' });
    await searchbox.click();
    await searchbox.fill('시');

    await expect(page.locator('#search-results')).toBeVisible({ timeout: 10_000 });

    await searchbox.press('Escape');
    await expect(page.locator('#search-results')).toBeHidden();
    await expect(searchbox).toHaveValue('');
  });

  test('↓ + Enter로 첫 결과 이동', async ({ page }) => {
    await page.goto('/');

    const searchbox = page.getByRole('searchbox', { name: '검색' });
    await searchbox.click();
    await searchbox.fill('시');

    await expect(page.locator('#search-results')).toBeVisible({ timeout: 10_000 });

    await searchbox.press('ArrowDown');
    await expect(page.locator('#search-result-0')).toBeVisible();

    await searchbox.press('Enter');
    await expect(page).toHaveURL(/\/(heroes|patch-notes)\/[^/]+/);
  });
});
