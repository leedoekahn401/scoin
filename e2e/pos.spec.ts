import { expect, test } from '@playwright/test';

// TODO(FE-1): sign in as cashier1 → add Cơm gà + Nước suối → scan DEMOKHANG7A1CARD → charge → "Đã thanh toán".
test('cashier sign-in page loads', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Đăng nhập thu ngân' })).toBeVisible();
});
