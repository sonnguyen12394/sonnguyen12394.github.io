import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v78 Thám tử (đọc) / v79 Đài phát thanh (nghe): một bài đúng cấp người học, mỗi câu hỏi hiểu là một manh mối (≥ 3 lựa chọn);
// điểm bài lưu như tab Đọc / Nghe (st.lread hoặc st.units[].read|listen), thử lại không tính điểm; sổ thám tử / kệ băng là telemetry.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()'); w.eval("go('games')");
  });
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
const saved = (page: Page) => page.evaluate(() => { const st = (window as any).eval('st'); return { lread: JSON.parse(JSON.stringify(st.lread)), units: Object.fromEntries(Object.entries(st.units).map(([k, v]: any) => [k, { read: v.read ?? null, listen: v.listen ?? null }])), gt: st.e.gt, gr: st.e.gr, led: st.e.ev.led.length }; });

test('Thám tử: đọc hồ sơ, manh mối 3 lựa chọn; sai thì tô sáng câu + thử lại (không tính điểm); điểm đọc lưu như tab Đọc', async ({ page, errors }) => {
  await open(page);
  const before = await saved(page);
  await page.locator('[data-e="dtstart"]').first().click();
  await expect(page.locator('.dtdoc')).toBeVisible();
  if (await page.locator('.dtw').count()) { await page.locator('.dtw').first().click(); await expect(page.locator('.dtlook')).toBeVisible(); }   // chạm từ → nghĩa
  const end = page.getByRole('heading', { name: /Phá án|Hồ sơ còn bỏ ngỏ/ });
  let n = 0, firstOk = 0, id = '';
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    if (pk?.run === 'case') {
      expect(pk.opts.length).toBeGreaterThanOrEqual(3); id = pk.id.split(':')[0];
      if (n === 0) {   // sai → tô sáng + thử lại đúng
        await page.locator(`[data-e="dtans"][data-i="${(pk.ans + 1) % pk.opts.length}"]`).click();
        await expect(page.locator('[data-e="dtretry"]')).toBeVisible();
        await page.screenshot({ path: 'test-results/case-wrong.png' });
        await page.locator('[data-e="dtretry"]').click();
        await page.locator(`[data-e="dtans"][data-i="${pk.ans}"]`).click();
        await expect(page.getByText(/không tính điểm/)).toBeVisible();
      } else if (n === 1) await page.locator('[data-e="dtans"][data-i="-1"]').click();
      else { await page.locator(`[data-e="dtans"][data-i="${pk.ans}"]`).click(); firstOk++; }
      n++; continue;
    }
    await page.locator('[data-e="dtnext"]').click();
  }
  await expect(end).toBeVisible();
  expect(n).toBeGreaterThanOrEqual(2);
  const after = await saved(page);
  expect(after.led).toBe(before.led);   // không ghi bằng chứng vào nút từ / ngữ pháp
  const sc = after.lread[id]?.best ?? after.units[id]?.read;
  expect(sc).toBeCloseTo(firstOk / n, 5);
  expect(after.gt.runs).toBe(1);
  await expect(page.getByText(/lưu như ở tab Đọc/)).toBeVisible();
  await page.screenshot({ path: 'test-results/case-end.png' });
  expect(errors).toEqual([]);
});

test('Đài phát thanh: nghe cả bài (lời ẩn tới cuối), trả lời đúng hết → bắt được sóng; điểm nghe lưu như tab Nghe', async ({ page, errors }) => {
  await open(page);
  const has = await page.locator('[data-e="rdstart"]').count();
  test.skip(!has, 'máy không có giọng đọc');
  await page.locator('[data-e="rdstart"]').first().click();
  await expect(page.locator('[data-e="rdplay"]').first()).toBeVisible();
  await expect(page.locator('.dtdoc')).toHaveCount(0);   // lời bản tin chưa hiện
  const end = page.getByRole('heading', { name: /Bắt được sóng|Sóng còn rè/ });
  let n = 0, id = '';
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    if (pk?.run === 'radio') { id = pk.id.split(':')[0]; if (n === 1) await page.screenshot({ path: 'test-results/radio.png' }); await page.locator(`[data-e="dtans"][data-i="${pk.ans}"]`).click(); n++; continue; }
    await page.locator('[data-e="dtnext"]').click();
  }
  await expect(page.getByRole('heading', { name: /Bắt được sóng/ })).toBeVisible();
  const after = await saved(page);
  expect(after.lread[id]?.best ?? after.units[id]?.listen).toBe(1);
  expect(after.gr.runs).toBe(1); expect(after.gr.solved).toBe(1);
  expect(errors).toEqual([]);
});
