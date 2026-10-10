import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';
import { findPath } from '../../src/engine/wordhunt.ts';

// v95 Mỏ Chữ (game chủ lực thứ hai, GAME-CRITERIA §10.7): lưới chữ toàn màn hình; vuốt qua ô kề nhau thành từ; từ nhiệm vụ của cụm engine
// chọn → bằng chứng mức 2; từ khác chỉ ăn điểm; hết lượt → chơi lại; thắng → màn kết, Phố.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function lobby(page: Page, coins = 0): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate((c) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    if (c) st.e.q = { floor: 1, best: 0, coins: c, runs: 0, wins: 0, ans: 0, ok: 0, day: 0 };
    w.eval('save()'); w.eval("go('games')");
  }, coins);
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());
const cells = (page: Page) => page.evaluate(() => { const r = document.getElementById('whfx') as any; return r?._pos ? r._pos() : []; });
async function swipe(page: Page, word: string): Promise<void> {
  const pos: Array<{ ch: string; x: number; y: number }> = await cells(page);
  const p = findPath(pos.map((c, i) => ({ ch: c.ch, sp: '' as const, id: i })), word)!;
  expect(p, `${word} có trên lưới`).toBeTruthy();
  await page.mouse.move(pos[p[0]!]!.x, pos[p[0]!]!.y); await page.mouse.down();
  for (const i of p.slice(1)) await page.mouse.move(pos[i]!.x, pos[i]!.y, { steps: 5 });
  await page.mouse.up();
}
const typeWord = async (page: Page, w: string) => { await page.locator('#whfx input[name="a"]').fill(w); await page.locator('#whfx input[name="a"]').press('Enter'); };

test('Mỏ Chữ: vuốt từ nhiệm vụ trên lưới → bằng chứng mức 2, ô vỡ + chữ rơi, tốn 1 lượt; từ sai không tốn lượt; thắng → màn tiếp', async ({ page, errors }) => {
  await lobby(page);
  await expect(page.locator('.whhero', { hasText: 'Mỏ Chữ' })).toBeVisible();
  await page.locator('[data-e="hnstart"]').first().click();
  await expect(page.locator('#whfx')).toBeVisible();
  await page.waitForTimeout(300);
  await page.screenshot({ path: 'test-results/hunt-start.png' });
  let pk = await peek(page);
  expect(pk.run).toBe('hunt');
  const before = await cells(page), mv0 = Number(await page.locator('.hnmv').textContent());
  await swipe(page, pk.accept[0]);
  await page.waitForTimeout(120);
  await page.screenshot({ path: 'test-results/hunt-found.png' });
  expect(Number(await page.locator('.hnmv').textContent())).toBe(mv0 - 1);
  const after = await cells(page);
  expect(after.map((c: any) => c.ch).join('')).not.toBe(before.map((c: any) => c.ch).join(''));
  if (pk.node.startsWith('u:')) { const led = await page.evaluate(() => (window as any).eval('st').e.ev.led.slice(-1)[0]); expect(led.ctx).toBe('hunt'); expect(led.lv).toBe(2); expect(led.ok).toBe(1); }
  await typeWord(page, 'qzx');   // không có trên lưới / không phải từ → không tốn lượt
  expect(Number(await page.locator('.hnmv').textContent())).toBe(mv0 - 1);
  for (let i = 0; i < 10; i++) { pk = await peek(page); if (!pk) break; await typeWord(page, pk.accept[0]); }
  await expect(page.locator('[data-e="hnnext"]')).toBeVisible();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'test-results/hunt-win.png' });
  const gn = await page.evaluate(() => (window as any).eval('st').e.gn);
  expect(gn.lv).toBe(2); expect(gn.runs).toBe(1); expect(gn.stars).toBeGreaterThanOrEqual(1);
  await page.locator('[data-e="hnnext"]').click();
  expect((await peek(page)).run).toBe('hunt');
  await page.locator('[data-e="hnexit"]').first().click();
  await expect(page.locator('#whfx')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Mỏ Chữ: gợi ý chữ đầu tốn 10 xu, từ nhiệm vụ tìm sau gợi ý tính là có trợ giúp', async ({ page, errors }) => {
  await lobby(page, 30);
  await page.locator('[data-e="hnstart"]').first().click();
  await expect(page.locator('#whfx')).toBeVisible();
  await page.locator('[data-e="hnhint"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').e.tw.spent)).toBe(10);
  const pk = await peek(page);
  await typeWord(page, pk.accept[0]);
  if (pk.node.startsWith('u:')) { const led = await page.evaluate(() => (window as any).eval('st').e.ev.led.slice(-1)[0]); expect(led.asst).toBe(1); }
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`Mỏ Chữ: WCAG AA (${scheme}), 390px, ô lưới đủ lớn để chạm`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await lobby(page, 50);
    await page.locator('[data-e="hnstart"]').first().click();
    await expect(page.locator('#whfx')).toBeVisible();
    const r = await new AxeBuilder({ page }).include('#whfx').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    const pos: Array<{ x: number; y: number }> = await cells(page);
    expect(Math.abs(pos[1]!.x - pos[0]!.x)).toBeGreaterThanOrEqual(44);
    await page.screenshot({ path: `test-results/hunt-390-${scheme}.png` });
    expect(errors).toEqual([]);
  });
}
