import { expect, test } from '@playwright/test';

test('admin signs in and opens a student record', async ({ page }) => {
  await page.goto('/login');
  await page.getByLabel('Email').fill('admin@schoolcoin.vn');
  await page.getByLabel('Mật khẩu').fill('demo1234');
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  await expect(page.getByRole('heading', { name: 'Chào Thành' })).toBeVisible();
  await page.getByRole('link', { name: 'Học sinh & ví' }).click();
  await expect(page.getByRole('heading', { name: 'Học sinh' })).toBeVisible();

  await page.getByPlaceholder('Tìm theo tên hoặc mã học sinh…').fill('Nguyễn Minh Anh');
  const row = page.getByRole('row', { name: /Nguyễn Minh Anh/ });
  await expect(row).toContainText('HS2026001');
  await row.click();

  await expect(page.getByRole('heading', { name: 'Nguyễn Minh Anh' })).toBeVisible();
  await expect(page.getByText('HS2026001 · Lớp 6A1')).toBeVisible();
});
