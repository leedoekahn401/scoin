import { expect, test } from '@playwright/test';

// TODO(FE-2): sign in as parent.an → open Khang → top up 100 → QR shown → simulate webhook → success.
test('parent sign-in page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập' })).toBeVisible();
});
