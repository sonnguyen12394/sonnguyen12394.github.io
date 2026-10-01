import type { Page } from '@playwright/test';
import { test, expect } from './fixtures.ts';

// Làm hết một phần: chọn phương án đầu tiên mỗi câu; phần Nghe thì phát âm thanh trước.
async function answerUntil(page: Page, skillLabel: RegExp, listen: boolean) {
  for (let k = 0; k < 14; k++) {
    const eyebrow = page.locator('.eyebrow').first();
    if (!(await eyebrow.isVisible()) || !skillLabel.test((await eyebrow.textContent()) || '')) return;
    if (listen) {
      const play = page.getByRole('button', { name: /Nghe \(1 lần\)/ });
      if (await play.isVisible()) { await play.click(); await expect(page.getByRole('button', { name: /Đang phát|Đã nghe/ })).toBeVisible(); }
    }
    for (const fs of await page.locator('form[data-xform="placenext"] fieldset').all()) await fs.locator('input[type=radio]').first().check();
    await page.getByRole('button', { name: 'Câu tiếp' }).click();
  }
}

test('kiểm tra đầu vào: ≤ 3 chạm từ màn chào, làm Đọc + Nghe, ra band kèm sai số, xem lại có giải thích', async ({ page, errors }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ôn thi' }).click();              // chạm 1
  await page.getByRole('button', { name: /IELTS Academic/ }).click();              // chạm 2
  await page.getByRole('button', { name: 'Bắt đầu kiểm tra' }).click();           // chạm 3
  await expect(page.getByText(/Kiểm tra đầu vào · Đọc/)).toBeVisible();
  await expect(page.locator('#xtimer')).toContainText('Còn 7:');
  await answerUntil(page, /· Đọc/, false);
  await expect(page.getByText(/Kiểm tra đầu vào · Nghe/)).toBeVisible();
  await answerUntil(page, /· Nghe/, true);
  await expect(page.getByRole('heading', { name: 'Kết quả của bạn' })).toBeVisible();
  await expect(page.locator('.me-stats .stat')).toHaveCount(2);
  await expect(page.getByText(/khoảng \d/).first()).toBeVisible();
  // xem lại: lời thoại hiện sau khi làm xong, giải thích tiếng Việt, báo lỗi
  await page.locator('details > summary').first().click();
  await expect(page.getByText('Vì sao đúng:').first()).toBeVisible();
  await page.getByRole('button', { name: 'Đáp án sai' }).first().click();
  await expect(page.locator('#toast')).toContainText('Đã ghi nhận');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}'));
  expect(saved.x.resp.length).toBeGreaterThanOrEqual(8);
  expect(saved.x.attempts.filter((a: { kind: string }) => a.kind === 'place').length).toBe(2);
  expect(saved.flags.some((f: { kind: string }) => f.kind === 'Ôn thi')).toBe(true);
  // trang Ôn thi giờ có band ước tính Nghe, Đọc
  await page.getByRole('button', { name: 'Về trang Ôn thi' }).click();
  await expect(page.getByText(/Chưa đủ dữ liệu/)).toHaveCount(2);   // còn Viết, Nói
  expect(errors).toEqual([]);
});

test('bỏ qua phần Nghe (khiếm thính): chỉ ước tính Đọc, không lỗi', async ({ page, errors }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu ôn thi' }).click();
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Bắt đầu kiểm tra' }).click();
  await expect(page.getByText(/Kiểm tra đầu vào · Đọc/)).toBeVisible();
  await answerUntil(page, /· Đọc/, false);
  await expect(page.getByText(/Kiểm tra đầu vào · Nghe/)).toBeVisible();
  await page.getByRole('button', { name: /Không nghe được\? Bỏ qua phần Nghe/ }).click();
  await expect(page.getByRole('heading', { name: 'Kết quả của bạn' })).toBeVisible();
  await expect(page.locator('.me-stats .stat')).toHaveCount(1);
  await expect(page.getByText('Bỏ qua: Nghe.')).toBeVisible();
  await expect(page.getByText(/\/10/).first()).toBeVisible();   // VSTEP hiện điểm thang 10
  expect(errors).toEqual([]);
});
