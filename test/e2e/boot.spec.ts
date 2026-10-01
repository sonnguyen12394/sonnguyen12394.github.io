import { test, expect } from './fixtures.ts';

test('màn chào hiện ngay từ HTML; bấm trước khi app nạp xong thì app làm tiếp', async ({ page, errors }) => {
  // làm chậm app.js 2,5 giây như mạng yếu
  await page.route(/\/app\.js/, async r => { await new Promise(res => setTimeout(res, 2500)); await r.continue(); });
  await page.goto('/');
  const start = page.getByRole('button', { name: 'Bắt đầu ôn thi' });
  await expect(start).toBeVisible({ timeout: 2000 });
  await start.click();
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible({ timeout: 15000 });
  expect(errors).toEqual([]);
});
