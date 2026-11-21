import { expect, test } from '@playwright/test';

test('student scans a card and sends a top-up request from the kiosk', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Nguyễn Minh Anh/ })
    .first()
    .click();
  await expect(page.getByText('Nhập mã PIN', { exact: true })).toBeVisible();
  for (const digit of '1234') {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }

  await expect(page.getByText('Số dư của bạn')).toBeVisible();
  await page.getByRole('button', { name: 'Xin phụ huynh thêm xu' }).click();
  await page.getByRole('button', { name: /20xu/ }).click();
  await page.getByRole('button', { name: /Gửi yêu cầu 20 xu/ }).click();

  await expect(page.getByText('Đã gửi yêu cầu 20 xu')).toBeVisible();
  await expect(page.getByText('Phụ huynh sẽ nhận thông báo ngay')).toBeVisible();
});
