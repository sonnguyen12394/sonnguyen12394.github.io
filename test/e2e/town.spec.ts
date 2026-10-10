import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v89 Phố chung + số liệu chơi (GAME-CRITERIA §8–§9): sảnh có phố 15 công trình (chạm để chơi); màn kết báo công trình lên cấp
// và mốc gần nhất; ván được đếm (đi từ "Chơi tiếp", xong, thời lượng); bảng số liệu ở sảnh.
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
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());

test('Phố chung: 17 công trình (v93 Vòng đu quay, v95 Mỏ chữ), đã xây / chưa xây, chạm công trình mở đúng game', async ({ page, errors }) => {
  await lobby(page);
  const tiles = page.locator('.twt');
  await expect(tiles).toHaveCount(17);
  await expect(page.locator('.twbox')).toContainText('Phố của bạn');
  await expect(page.locator('.twt:not(.off)')).toHaveCount(1);              // Cổng bản đồ (đã thám hiểm 1 lần)
  await expect(page.locator('.dbox .tisay')).toHaveCount(1);                // Tí dẫn đường
  await page.screenshot({ path: 'test-results/town-lobby.png', fullPage: true });
  await page.locator('.twt[data-e="gdstart"]').click();
  const s = await page.evaluate(() => (window as any).eval('st').e.pm);
  expect(s.cur.g).toBe('garden'); expect(s.cur.via).toBe('self'); expect(s.g.garden.n).toBe(1);
  expect(errors).toEqual([]);
});

test('Màn kết: ván được đếm (từ Chơi tiếp, xong, thời lượng), báo Phố mới khi công trình lên cấp; bảng số liệu ở sảnh', async ({ page, errors }) => {
  await lobby(page);
  await page.evaluate(() => { const st = (window as any).eval('st'); st.e.gp.plan[0] = { game: 'garden', need: 'vocab', why: 'Từ mới cần cho mục tiêu.' }; st.e.gp.plan = st.e.gp.plan.filter((p: any, i: number) => i === 0 || p.game !== 'garden'); (window as any).eval('save()'); (window as any).eval('render()'); });
  await page.locator('.dgo').click();
  // Trong lúc chơi, quán (game khác) có sao: phố khác lúc bắt đầu → màn kết báo công trình mới.
  await page.evaluate(() => { const st = (window as any).eval('st'); st.e.gq = { stars: 6, runs: 1, best: 6, day: 1 }; });
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('heading', { name: /Vườn của bạn/ }).isVisible()) break;
    const pk = await peek(page);
    if (pk?.run === 'gdteach') { await page.locator('[data-e="gdask"]').click(); continue; }
    if (pk?.run === 'garden') { await page.locator(`[data-e="gdans"][data-i="${pk.ans}"]`).click(); continue; }
    await page.locator('[data-e="gdnext"]').click();
  }
  await expect(page.getByRole('heading', { name: /Vườn của bạn/ })).toBeVisible();
  const gain = page.locator('.twgain');
  await expect(gain).toContainText('Phố mới');
  await expect(gain).toContainText('Quán cà phê');
  await expect(gain).toContainText('Vườn hoa có ★ thứ 1');
  await page.screenshot({ path: 'test-results/town-end.png', fullPage: true });
  const pm = await page.evaluate(() => (window as any).eval('st').e.pm);
  expect(pm.g.garden).toMatchObject({ n: 1, done: 1, quit: 0, self: 0 });
  expect(pm.g.garden.fa.length).toBe(1); expect(pm.g.garden.du.length).toBe(1); expect(pm.g.garden.er.length).toBe(1);
  // Vẽ lại màn kết không đếm thêm.
  await page.evaluate(() => (window as any).eval('render()'));
  expect(await page.evaluate(() => (window as any).eval('st').e.pm.g.garden.done)).toBe(1);
  await page.locator('[data-e="qhome"]').first().click();
  const stats = page.locator('details', { hasText: 'Số liệu chơi' });
  await expect(stats).toHaveCount(1);
  await stats.locator('summary').click();
  await expect(stats).toContainText('Vườn từ');
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`Phố chung + bảng số liệu: WCAG AA, ${scheme}, 390px không cuộn ngang`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await lobby(page);
    await page.evaluate(() => { const st = (window as any).eval('st'); st.e.gq = { stars: 30, runs: 5, best: 6, day: 1 }; st.e.q = { floor: 1, best: 0, coins: 100, runs: 0, wins: 0, ans: 0, ok: 0, day: 0 }; st.e.tw = { spent: 30, deco: { cafe: 1 } }; st.e.pm = { g: { cafe: { n: 6, self: 2, again: 1, done: 5, quit: 1, cont: 3, fa: [3, 4, 5], du: [200, 260], er: [31, 28] }, robot: { n: 2, self: 2, again: 0, done: 2, quit: 0, cont: 1, fa: [6], du: [120], er: [] } }, cur: null }; (window as any).eval('render()'); });
    await page.locator('details', { hasText: 'Số liệu chơi' }).locator('summary').click();
    await page.locator('details.twshop summary').click();
    const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    await noHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
}
