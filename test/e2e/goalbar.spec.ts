import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v110 Mục tiêu + tiến độ (spec v2.4 §XIX "Play → Goal → Progress → Next Challenge"): sảnh mở đầu bằng thẻ 🎯 Mục tiêu (trên
// "▶ Chơi tiếp"), chạm thẻ mở trang mục tiêu có danh sách còn thiếu; màn kết mọi game có một dòng nối ván với mục tiêu.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function lobby(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page);
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());

test('Sảnh: thẻ 🎯 Mục tiêu ở trên Chơi tiếp, có số kỹ năng vững và mốc gần; chạm mở trang mục tiêu; WCAG AA ở 390 px', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  const bar = page.locator('.gbar');
  await expect(bar).toHaveCount(1);
  await expect(bar).toContainText('🎯 Mục tiêu:');
  await expect(bar).toContainText(/\d+\/\d+ kỹ năng đã vững/);
  await expect(bar).toContainText('Gần đạt nhất:');
  const [b, d] = await Promise.all([bar.boundingBox(), page.locator('.dbox').first().boundingBox()]);
  expect(b!.y).toBeLessThan(d!.y);
  await expect(page.locator('#app')).not.toContainText(/Sẵn sàng: \d+%/);
  const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await noHorizontalScroll(page);
  await page.screenshot({ path: 'test-results/goalbar-lobby.png', fullPage: true });
  await bar.click();
  await expect(page.locator('#app')).toContainText(/Chưa đạt .+ vì còn thiếu/);
  expect(errors).toEqual([]);
});

test('Màn kết: dòng 🎯 nối ván với mục tiêu (Vườn từ), kể cả khi chưa vững thêm phần nào', async ({ page, errors }) => {
  await lobby(page);
  await page.locator('.twt[data-e="gdstart"]').click();
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('heading', { name: /Vườn của bạn/ }).isVisible()) break;
    const pk = await peek(page);
    if (pk?.run === 'gdteach') { await page.locator('[data-e="gdask"]').click(); continue; }
    if (pk?.run === 'garden') { await page.locator(`[data-e="gdans"][data-i="${pk.ans}"]`).click(); continue; }
    await page.locator('[data-e="gdnext"]').click();
  }
  await expect(page.getByRole('heading', { name: /Vườn của bạn/ })).toBeVisible();
  const line = page.locator('.gline');
  await expect(line).toHaveCount(1);
  await expect(line).toContainText(/🎯 .+: \d+\/\d+ kỹ năng đã vững/);
  await expect(line).toContainText(/Vững thêm|Tiến một bậc|câu bằng chứng|chưa có câu/);
  await page.screenshot({ path: 'test-results/goalbar-end.png', fullPage: true });
  expect(errors).toEqual([]);
});
