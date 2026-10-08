import { test, expect, openApp, navTo } from './fixtures.ts';

// v52 (spec v2.4 §7): bản MVP chỉ CEFR. Không bật "mục tiêu tương lai" thì không có tab Ôn thi, chỉ chọn được mục tiêu CEFR,
// bài Pre-A1 ghi bằng chứng cho nút pa:<bài>. Bật trong Cài đặt thì tab Ôn thi trở lại.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

// "Bắt đầu học" mở thẳng bài đầu tiên (thanh điều hướng ẩn trong bài): thoát bài để về trang chính.
async function startCefr(page: import('@playwright/test').Page): Promise<void> {
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.getByRole('button', { name: 'Bắt đầu học' }).click();
  await page.getByRole('button', { name: 'Thoát bài học' }).click();
  const m = page.locator('#modal:not([hidden])');
  if (await m.count()) await m.getByRole('button').first().click();
  await expect(page.locator('#bnav:visible button, #nav:visible button').first()).toBeVisible();
}

test('màn chào học CEFR; không có tab Ôn thi; chỉ mục tiêu CEFR', async ({ page, errors }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Tiếng Anh từ con số 0 tới C2' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Bắt đầu ôn thi' })).toHaveCount(0);
  await startCefr(page);
  const nav = page.locator('#bnav:visible button, #nav:visible button');
  await expect(nav.filter({ hasText: 'Ôn thi' })).toHaveCount(0);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu của bạn', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /^VSTEP/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^IELTS/ })).toHaveCount(0);
  await page.getByRole('button', { name: /^Tiếng Anh tổng quát/ }).click();
  await expect(page.getByRole('button', { name: 'Chọn Khởi động Pre-A1 (người mới tinh)' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('bài Pre-A1 ghi bằng chứng cho nút pa:', async ({ page, errors }) => {
  await page.goto('/');
  await startCefr(page);
  const n = await page.evaluate(() => {
    const w = window as any;
    w.eval("startPa('pa-num')");
    w.eval('qzAnswer(true)');
    const m = w.eval('st').e.m['pa:num'];
    return m ? Object.keys(m).length : 0;
  });
  expect(n).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('bật mục tiêu tương lai trong Cài đặt thì tab Ôn thi trở lại', async ({ page, errors }) => {
  await page.goto('/');
  await startCefr(page);
  await page.evaluate(() => (window as any).eval("go('settings')"));
  await page.getByRole('heading', { name: 'Nâng cao', level: 3 }).click();   // mục Cài đặt gập sẵn
  await page.locator('[data-act="future"]').click();
  await expect(page.locator('#bnav:visible button, #nav:visible button').filter({ hasText: 'Ôn thi' })).toHaveCount(1);
  expect(errors).toEqual([]);
});
