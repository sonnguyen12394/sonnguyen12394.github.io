import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v88 Bộ não chọn game: sảnh mở đầu bằng "▶ Chơi tiếp" kèm lý do + lộ trình 3 chặng; xong game thì màn kết đưa thẳng tới game kế.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page, placed: boolean): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate((pl) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    if (pl) st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  }, placed);
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());

test('Bộ não: người mới chưa xếp lớp → nút Chơi tiếp là Thám hiểm, có lý do; danh sách game thu gọn', async ({ page, errors }) => {
  await open(page, false);
  const go = page.locator('.dgo');
  await expect(go).toHaveCount(1);
  await expect(go).toContainText('Chơi tiếp: Thám hiểm sương mù');
  await expect(go).toContainText('Vì:');
  await expect(page.locator('.dplan li')).toHaveCount(3);
  await expect(page.locator('details.gall').first()).not.toHaveAttribute('open', '');   // v99: mục Luyện tập (đầu tiên); Leo tháp cũng thu gọn
  // v99: mở mục thu gọn rồi app vẽ lại #app (dữ liệu nền tải xong, bấm nút…) → mục vẫn mở; mục khác vẫn đóng.
  await page.locator('details.gall summary').first().click();
  await page.evaluate(() => (window as any).eval('render()'));
  await expect(page.locator('details.gall').first()).toHaveAttribute('open', '');
  await expect(page.locator('details.gtower')).not.toHaveAttribute('open', '');
  await page.locator('details.gall summary').first().click();
  await page.screenshot({ path: 'test-results/director-new.png', fullPage: true });
  await go.click();
  await expect(page.getByRole('heading', { name: /Đi đường nào/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Bộ não: bấm Chơi tiếp vào đúng game; xong game → màn kết có "▶ Tiếp" sang game khác, chặng đã chơi có ✓; Vì sao có snapshot', async ({ page, errors }) => {
  await open(page, true);
  const go = page.locator('.dgo').first(), g0 = await go.getAttribute('data-g');
  expect(g0).toBeTruthy();
  await page.screenshot({ path: 'test-results/director-lobby.png', fullPage: true });
  // Ép chặng đầu là Vườn từ (luồng chơi ngắn, đã có test riêng) để kiểm phần chuyển game.
  await page.evaluate(() => { const st = (window as any).eval('st'); st.e.gp.plan[0] = { game: 'garden', need: 'vocab', why: 'Từ mới cần cho mục tiêu.' }; st.e.gp.plan = st.e.gp.plan.filter((p: any, i: number) => i === 0 || p.game !== 'garden'); (window as any).eval('save()'); (window as any).eval('render()'); });
  await expect(page.locator('.dgo')).toHaveAttribute('data-g', 'garden');
  await page.locator('.dgo').click();
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('heading', { name: /Vườn của bạn/ }).isVisible()) break;
    const pk = await peek(page);
    if (pk?.run === 'gdteach') { await page.locator('[data-e="gdask"]').click(); continue; }
    if (pk?.run === 'garden') { await page.locator(`[data-e="gdans"][data-i="${pk.ans}"]`).click(); continue; }
    await page.locator('[data-e="gdnext"]').click();
  }
  await expect(page.getByRole('heading', { name: /Vườn của bạn/ })).toBeVisible();
  const nx = page.locator('.dgo');
  await expect(nx).toContainText('▶ Tiếp:');
  expect(await nx.getAttribute('data-g')).not.toBe('garden');
  await expect(page.locator('.dplan li.ok')).toHaveCount(1);
  await page.screenshot({ path: 'test-results/director-next.png', fullPage: true });
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { gp: st.e.gp, snap: st.e.ev.snap.filter((x: any) => x.kind === 'dir').map((x: any) => x.subj) }; });
  expect(s.gp.done).toContain('garden'); expect(s.gp.last).toBe('garden');
  expect(s.snap.length).toBeGreaterThanOrEqual(2);
  // Bấm Tiếp → vào game kế (một run mới đang chạy, không quay về danh sách).
  const g1 = await nx.getAttribute('data-g');
  await nx.click();
  const last = await page.evaluate(() => (window as any).eval('st').e.gp.last);
  expect(last).toBe(g1);
  expect(errors).toEqual([]);
});
