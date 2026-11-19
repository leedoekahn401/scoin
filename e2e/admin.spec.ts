import { expect, test } from '@playwright/test';

// TODO(FE-2): sign in as admin → students list shows 5 students → print cards.
test('admin sign-in page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập quản trị' })).toBeVisible();
});
