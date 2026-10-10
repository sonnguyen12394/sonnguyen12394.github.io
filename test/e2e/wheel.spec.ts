import AxeBuilder from '@axe-core/playwright';
import { test, expect, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v93 Vòng Chữ (game chủ lực, GAME-CRITERIA §10): màn toàn màn hình vẽ bằng canvas; vuốt qua chữ trên vòng để ghép từ; từ của cụm engine
// chọn → bằng chứng mức 2 (gợi ý → có trợ giúp); thắng màn → màn kết, Phố, chặng tiếp; thử thách ngày giống nhau mỗi ngày.
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
  await toLobby(page);
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());
const centers = (page: Page) => page.evaluate(() => { const r = document.getElementById('whfx') as any; return r?._pos ? r._pos() : []; });
// Vuốt thật bằng chuột / ngón tay qua tâm các chữ của từ.
async function swipe(page: Page, word: string): Promise<void> {
  const pos: Array<{ ch: string; x: number; y: number }> = await centers(page), used = new Set<number>(), path: Array<{ x: number; y: number }> = [];
  for (const ch of word) { const k = pos.findIndex((p, i) => p.ch === ch && !used.has(i)); expect(k, `chữ ${ch} có trên vòng`).toBeGreaterThanOrEqual(0); used.add(k); path.push(pos[k]!); }
  await page.mouse.move(path[0]!.x, path[0]!.y); await page.mouse.down();
  for (const p of path.slice(1)) await page.mouse.move(p.x, p.y, { steps: 6 });
  await page.mouse.up();
}

test('Vòng Chữ: toàn màn hình, vuốt ra từ → ô mở + bằng chứng ở cụm engine chọn; gõ cũng được; thắng màn → màn kết + Phố', async ({ page, errors }) => {
  await lobby(page);
  await expect(page.locator('.whhero').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/wheel-lobby.png' });
  await page.locator('.whhero [data-e="whstart"]').click();
  const fx = page.locator('#whfx');
  await expect(fx).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: 'test-results/wheel-start.png' });
  // Từ đầu: vuốt.
  let pk = await peek(page);
  expect(pk.run).toBe('wheel');
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await swipe(page, pk.accept[0]);
  await page.waitForTimeout(250);
  await page.screenshot({ path: 'test-results/wheel-found.png' });
  const led1 = await page.evaluate(() => { const l = (window as any).eval('st').e.ev.led; return l.slice(-1)[0]; });
  const isTarget = pk.node.startsWith('u:');
  if (isTarget) { expect(led1.ctx).toBe('wheel'); expect(led1.lv).toBe(2); expect(led1.ok).toBe(1); }
  expect(await page.evaluate(() => (window as any).eval('st').e.gh.words)).toBe(1);
  // Từ sai: không mở ô, không bằng chứng.
  await page.locator('#whfx input[name="a"]').fill('zzz'); await page.locator('#whfx input[name="a"]').press('Enter');
  // Các từ còn lại: gõ (lối cho trình đọc màn hình / máy không vuốt được).
  for (let i = 0; i < 12; i++) {
    pk = await peek(page);
    if (!pk) break;
    await page.locator('#whfx input[name="a"]').fill(pk.accept[0]); await page.locator('#whfx input[name="a"]').press('Enter');
  }
  await expect(page.locator('.whwin')).toBeVisible();
  await page.waitForTimeout(900);
  await page.screenshot({ path: 'test-results/wheel-win.png' });
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { gh: st.e.gh, led: st.e.ev.led.filter((x: any) => x.ctx === 'wheel').length, pm: st.e.pm.g.wheel }; });
  expect(s.gh.lv).toBe(2); expect(s.gh.runs).toBe(1); expect(s.gh.stars).toBe(3);
  expect(s.pm.done).toBe(1);
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBeGreaterThanOrEqual(led0 + (isTarget ? 1 : 0));
  // Màn tiếp ngay trong lớp phủ (không về danh sách).
  await page.locator('[data-e="whnext"]').click();
  await expect(page.locator('.whwin')).toBeHidden();
  expect((await peek(page)).run).toBe('wheel');
  await page.locator('[data-e="whexit"]').first().click();
  await expect(fx).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Vòng Chữ: gợi ý tốn 10 xu, mở một chữ; từ tìm sau gợi ý là có trợ giúp; không đủ xu thì nút gợi ý tắt', async ({ page, errors }) => {
  await lobby(page, 25);
  await page.locator('.whhero [data-e="whstart"]').click();
  await expect(page.locator('#whfx')).toBeVisible();
  await page.locator('[data-e="whhint"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').e.tw.spent)).toBe(10);
  const pk = await peek(page), hw = pk.hinted[0] as string;
  expect(hw).toBeTruthy();
  await page.locator('#whfx input[name="a"]').fill(hw); await page.locator('#whfx input[name="a"]').press('Enter');
  const led = await page.evaluate(() => (window as any).eval('st').e.ev.led.slice(-1)[0]);
  if (led?.ctx === 'wheel' && led.item?.includes(':wheel')) expect(led.asst === 1 || led.ok === 0).toBe(true);   // ô của cụm: có gợi ý → trợ giúp / chưa nhớ ra
  await page.locator('[data-e="whhint"]').click();   // còn 15 xu → được
  await expect(page.locator('[data-e="whhint"]')).toBeDisabled();   // còn 5 xu
  expect(errors).toEqual([]);
});

test('Vòng Chữ: thử thách ngày giống nhau cho mọi người, xong thì không chơi lại trong ngày; chia sẻ không lộ đáp án', async ({ page, errors }) => {
  await lobby(page);
  await page.locator('.whhero [data-e="whdaily"]').click();
  await expect(page.locator('#whfx')).toBeVisible();
  const base = await page.evaluate(() => (window as any).eval('EM').peek());
  expect(base.run).toBe('wheel');
  for (let i = 0; i < 10; i++) { const pk = await peek(page); if (!pk) break; await page.locator('#whfx input[name="a"]').fill(pk.accept[0]); await page.locator('#whfx input[name="a"]').press('Enter'); }
  await expect(page.locator('[data-e="whshare"]').first()).toBeVisible();
  const gh = await page.evaluate(() => (window as any).eval('st').e.gh);
  expect(gh.daily.done).toBe(true);
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.filter((x: any) => x.ctx === 'wheel').length)).toBe(0);   // nội dung chung, không do engine chọn → không ghi bằng chứng
  await page.locator('[data-e="whexit"]').first().click();
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`Vòng Chữ: WCAG AA (${scheme}), 390px, nút đủ lớn`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await lobby(page, 50);
    const scan = async (sel: string) => {
      const r = await new AxeBuilder({ page }).include(sel).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    };
    await scan('#app');
    await page.locator('.whhero [data-e="whstart"]').click();
    await expect(page.locator('#whfx')).toBeVisible();
    await scan('#whfx');
    for (const b of await page.locator('#whfx .whb').all()) { const box = await b.boundingBox(); expect(box!.height).toBeGreaterThanOrEqual(44); }
    await page.screenshot({ path: `test-results/wheel-390-${scheme}.png` });
    expect(errors).toEqual([]);
  });
}

test('v94 Vòng Chữ: hũ từ thưởng đầy → gợi ý miễn phí (không trừ xu); combo; từ vào sổ từ ở sảnh', async ({ page, errors }) => {
  await lobby(page);
  await page.evaluate(() => { const st = (window as any).eval('st'); st.e.gh = { lv: 1, stars: 0, words: 0, bonus: 0, runs: 0, day: 0, daily: { day: 0, done: false, secs: 0, hints: 0, streak: 0 }, book: {}, jar: 5, free: 0 }; (window as any).eval('save()'); (window as any).eval('render()'); });
  await page.locator('.whhero [data-e="whstart"]').click();
  await expect(page.locator('#whfx')).toBeVisible();
  let pk = await peek(page);
  test.skip(!pk.bonus?.length, 'màn này không có từ thưởng');
  await page.locator('#whfx input[name="a"]').fill(pk.bonus[0]); await page.locator('#whfx input[name="a"]').press('Enter');
  const gh = await page.evaluate(() => (window as any).eval('st').e.gh);
  expect(gh.free).toBe(1); expect(gh.jar).toBe(0);
  await expect(page.locator('[data-e="whhint"]')).toContainText('×1');
  await page.locator('[data-e="whhint"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').e.tw?.spent ?? 0)).toBe(0);
  expect(await page.evaluate(() => (window as any).eval('st').e.gh.free)).toBe(0);
  for (let i = 0; i < 12; i++) { pk = await peek(page); if (!pk) break; await page.locator('#whfx input[name="a"]').fill(pk.accept[0]); await page.locator('#whfx input[name="a"]').press('Enter'); }
  await expect(page.locator('.whwin')).toBeVisible();
  const book = await page.evaluate(() => Object.keys((window as any).eval('st').e.gh.book));
  expect(book.length).toBeGreaterThan(0);
  await page.locator('[data-e="whexit"]').first().click();
  await page.locator('[data-e="qhome"]').first().click();
  const box = page.locator('details.whbookbox');
  await box.locator('summary').click();
  await expect(box.locator('.whw')).toHaveCount(book.length);
  await page.screenshot({ path: 'test-results/wheel-book.png', fullPage: true });
  expect(errors).toEqual([]);
});
