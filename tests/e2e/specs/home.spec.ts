import { expect, test } from '@playwright/test';

test.describe('홈', () => {
  test('헤더와 메인 섹션이 렌더된다', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Watchpoint' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Watchpoint', level: 1 })).toBeVisible();

    await expect(page.getByRole('link', { name: /패치노트 →/ })).toBeVisible();
    await expect(page.getByRole('link', { name: /영웅 →/ })).toBeVisible();

    await expect(page.getByRole('searchbox', { name: '검색' })).toBeVisible();
  });
});
