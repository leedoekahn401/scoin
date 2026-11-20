import { expect, test } from '@playwright/test';

test('parent tops up a child and sees the credited balance', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('lan.nguyen@gmail.com');
  await page.getByLabel('Mật khẩu').fill('demo1234');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page.getByRole('heading', { name: 'Chào Lan' })).toBeVisible();
  await page.getByRole('link', { name: 'Nạp xu' }).first().click();

  await expect(page.getByRole('radio', { name: 'Nguyễn Minh Anh' })).toBeChecked();
  await page.getByRole('button', { name: /50 xu/ }).click();
  await page.getByRole('button', { name: 'Tạo mã QR' }).click();

  await expect(page.getByText('Chờ thanh toán')).toBeVisible();
  await page.getByRole('button', { name: /Giả lập chuyển khoản/ }).click();

  await expect(page.getByRole('heading', { name: 'Đã nạp 50 xu' })).toBeVisible();
  await expect(page.getByText('Số dư mới: 76 xu')).toBeVisible();
});
