import { expect, test } from '@playwright/test';

// TODO(FE-1): scan DEMOKHANG7A1CARD → PIN → balance shown → request 50 → "Đã gửi yêu cầu".
test('kiosk idle screen loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Quẹt thẻ của em' })).toBeVisible();
});
