import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

async function quickPlacement(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ôn thi' }).click();
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu kiểm tra' }).click();
  await expect(page.getByText(/Kiểm tra đầu vào · Đọc/)).toBeVisible();
  for (let k = 0; k < 8 && await page.getByText(/Kiểm tra đầu vào · Đọc/).isVisible(); k++) {
    // chọn phương án cuối để chắc chắn có câu sai vào sổ
    for (const fs of await page.locator('form[data-xform="placenext"] fieldset').all()) await fs.locator('input[type=radio]').last().check();
    await page.getByRole('button', { name: 'Câu tiếp' }).click();
  }
  await page.getByRole('button', { name: /Không nghe được\? Bỏ qua phần Nghe/ }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả của bạn' })).toBeVisible();
  await page.getByRole('button', { name: 'Về trang Ôn thi' }).click();
}

test('sổ lỗi sai: câu sai tự vào sổ, ôn lại có giải thích ngay, lịch giãn ra khi đúng', async ({ page, errors }) => {
  await quickPlacement(page);
  await expect(page.getByRole('heading', { name: /Hôm nay/ })).toBeVisible();
  await page.getByRole('button', { name: /Sổ lỗi sai · \d+ câu đến hạn/ }).click();
  await expect(page.getByRole('heading', { name: 'Sổ lỗi sai' })).toBeVisible();
  await expect(page.getByRole('cell', { name: /Đọc hiểu ngắn/ })).toBeVisible();
  await page.getByRole('button', { name: /^Ôn \d+ câu$/ }).click();
  await expect(page.getByText(/Sổ lỗi sai · câu 1\//)).toBeVisible();
  const total = Number((await page.getByText(/Sổ lỗi sai · câu 1\//).textContent())!.match(/\/(\d+)/)![1]);
  for (let k = 0; k < total; k++) {
    await page.locator('form[data-xform="nbanswer"] input[type=radio]').first().check();
    await page.getByRole('button', { name: 'Kiểm tra' }).click();
    await expect(page.getByText(/Đúng rồi|Chưa đúng/)).toBeVisible();
    await page.getByRole('button', { name: /Câu tiếp|Xong/ }).click();
  }
  await expect(page.locator('#toast')).toContainText('Xong: đúng');
  const nb = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').x.nb);
  expect(Object.keys(nb).length).toBe(total);
  const reps = Object.values(nb as Record<string, { reps: number }>).map(e => e.reps);
  expect(reps.every(r => r >= 2)).toBe(true);
  expect(errors).toEqual([]);
});

test('kế hoạch: cảnh báo khi mục tiêu quá cao so với thời gian, có đề xuất điều chỉnh', async ({ page, errors }) => {
  await quickPlacement(page);
  await page.getByRole('button', { name: 'Đổi mục tiêu, ngày thi, thời gian' }).click();
  await page.getByLabel('Mục tiêu').selectOption('8.5');
  await page.getByLabel('Ngày thi').fill(new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel('Số phút học mỗi ngày').fill('30');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByText(/cần khoảng \d+ giờ/).first()).toBeVisible();
  await page.getByRole('button', { name: /Kế hoạch tới ngày thi/ }).click();
  await expect(page.getByRole('heading', { name: 'Kế hoạch tới ngày thi' })).toBeVisible();
  await expect(page.getByText(/Tăng lên khoảng \d+ phút mỗi ngày/)).toBeVisible();
  await expect(page.getByText(/lùi ngày thi/)).toBeVisible();
  await expect(page.getByText('Cambridge English – Guided learning hours')).toBeVisible();
  await expect(page.locator('details summary').filter({ hasText: 'Hôm nay' })).toBeVisible();
  expect(errors).toEqual([]);
});
