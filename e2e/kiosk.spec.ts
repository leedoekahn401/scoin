import { expect, test } from '@playwright/test';

test('student scans a card and sends a top-up request from the kiosk', async ({ page }) => {
  await page.goto('/');
  await page
    .getByRole('button', { name: /Nguyễn Minh Anh/ })
    .first()
    .click();
  await page.keyboard.type('1234');

  await expect(page.getByText('Số dư của bạn')).toBeVisible();
  await page.getByRole('button', { name: 'Xin phụ huynh thêm xu' }).click();
  await page.getByRole('button', { name: '20 xu' }).click();
  await page.getByRole('button', { name: /Gửi yêu cầu 20 xu/ }).click();

  await expect(page.getByText('Đã gửi yêu cầu 20 xu')).toBeVisible();
  await expect(page.getByText('Phụ huynh sẽ nhận thông báo ngay')).toBeVisible();
});
