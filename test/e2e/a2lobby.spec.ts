import { test, expect, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';
/* eslint-disable @typescript-eslint/no-explicit-any */

// v135 Sảnh A2 (docs/DUONG-A2.md): mặc định sảnh chỉ còn một đường "⚔️ Vào trận / 🔨 Thợ rèn gợi ý" + thẻ mục tiêu;
// phần cũ ẩn (không xoá), một nút bật lại đủ mục và nhớ lựa chọn.
test.use({ future: false, full: false });

async function lobby(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a2', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page, false);
}
// Số thứ bấm được đang hiện trong #app (không tính thanh dưới).
const clickable = (page: Page) => page.evaluate(() => [...document.querySelectorAll('#app button, #app a[href]')].filter(el => {
  const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0;
}).length);

test('sảnh A2: chỉ ⚔️, 🔨, mục tiêu và nút hiện đủ mục; bật lại đủ mục được và nhớ qua lần mở sau', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await expect(page.locator('html')).toHaveClass(/\ba2\b/);
  await expect(page.locator('#app .cbgo')).toBeVisible();
  await expect(page.locator('#app .cbsmith')).toBeVisible();
  await expect(page.locator('#app .gbar.slim')).toContainText(/A2/);
  for (const sel of ['.lbstage', '.dgo', '.lanterns', '.wmap', '.tcard', '.wpow']) await expect(page.locator(`#app ${sel}`)).toBeHidden();
  const n = await clickable(page);
  expect(n, 'sảnh A2 ít thứ để bấm').toBeLessThanOrEqual(7);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(h, 'sảnh A2 vừa một màn hình').toBeLessThanOrEqual(900);
  await page.screenshot({ path: 'test-results/a2-lobby.png' });

  await page.locator('#app .a2tog').click();
  await expect(page.locator('html')).not.toHaveClass(/\ba2\b/);
  await expect(page.locator('#app .wmap')).toBeVisible();
  await expect(page.locator('#app .dgo')).toBeVisible();
  await expect(page.locator('#app .a2tog')).toContainText('Về sảnh A2');
  await page.reload();
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => (window as any).eval("go('games')"));
  await toLobby(page, false);
  await expect(page.locator('#app .wmap')).toBeVisible();
  await page.locator('#app .a2tog').click();
  await expect(page.locator('#app .wmap')).toBeHidden();
  expect(errors).toEqual([]);
});
