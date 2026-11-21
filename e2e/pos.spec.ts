import { expect, test } from '@playwright/test';

test('cashier charges a student and sees the payment result', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Tên đăng nhập').fill('thungan1');
  await page.getByLabel('Mật khẩu').fill('demo1234');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page.getByRole('button', { name: /Bánh mì/ })).toBeVisible();
  await page.getByLabel('Thẻ demo').selectOption({ label: 'Nguyễn Minh Anh · 6A1' });
  await expect(page.getByText('Nguyễn Minh Anh', { exact: true }).first()).toBeVisible();

  await page.getByRole('button', { name: /Bánh mì/ }).click();
  await page.getByRole('button', { name: 'Thu 15 xu' }).click();

  await expect(page.getByText('Đã thanh toán 15 xu')).toBeVisible();
  await expect(page.getByText('Số dư còn lại 11 xu')).toBeVisible();
});
