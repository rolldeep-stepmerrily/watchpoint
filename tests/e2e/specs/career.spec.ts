import { expect, test } from '@playwright/test';

test.describe('전적조회 (Beta)', () => {
  test('career 페이지 로드 + 검색폼 노출', async ({ page }) => {
    await page.goto('/ko/career');

    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const input = page.locator('input[name="q"]');
    await expect(input).toBeVisible();
  });

  test('빈 쿼리 submit 시 required로 차단', async ({ page }) => {
    await page.goto('/ko/career');

    const input = page.locator('input[name="q"]');
    await input.click();
    await page.keyboard.press('Enter');

    await expect(page).toHaveURL(/\/ko\/career$/);
  });

  test('헤더 nav에 Career(Beta) 링크 존재', async ({ page }) => {
    await page.goto('/ko');

    const careerLink = page.locator('nav a[href="/ko/career"]').first();
    await expect(careerLink).toBeVisible();
  });
});
