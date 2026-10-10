import AxeBuilder from '@axe-core/playwright';
import { test, expect, play, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v102 sân khấu dùng chung cho game kỹ năng (GAME-CRITERIA §10.14): khi một game cũ chạy, khung app ẩn, cảnh động theo game phía sau,
// thanh ✕ / tên game; câu đúng / sai có hiệu ứng. Không đổi luật, câu hỏi, bằng chứng.
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
const onStage = (page: Page) => page.evaluate(() => ({ stage: document.body.classList.contains('stage'), game: document.body.dataset.game ?? '', fx: !!document.getElementById('stagefx'), top: !!(document.querySelector('.top') as HTMLElement | null)?.offsetParent }));

const GAMES: Array<[string, string]> = [['cfstart', 'cafe'], ['gdstart', 'garden'], ['wsstart', 'shop'], ['dtstart', 'case'], ['ltstart', 'letter'], ['rbstart', 'robot'], ['pzstart', 'puzzle'], ['bkstart', 'blocks'], ['bdstart', 'board'], ['krstart', 'kara']];
test('v102 sân khấu: mỗi game kỹ năng mở ra toàn màn (ẩn khung app, cảnh động, ✕); ✕ về sảnh thì khung app trở lại', async ({ page, errors }) => {
  await lobby(page);
  expect((await onStage(page)).stage).toBe(false);
  for (const [start, game] of GAMES) {
    await play(page, start);
    await expect.poll(async () => (await onStage(page)).game, { message: game }).toBe(game);
    const s = await onStage(page);
    expect(s.stage && s.fx && !s.top, `${game}: ${JSON.stringify(s)}`).toBe(true);
    await expect(page.locator('.stagebar')).toContainText(/\S/);
    await page.locator('.stagebar [data-e="stexit"]').click();
    await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible();
    expect((await onStage(page)).stage, `${game}: rời sân khấu`).toBe(false);
  }
  expect(errors).toEqual([]);
});

test('v102 sân khấu: trả lời đúng ở Quán → khung phản hồi nảy (hiệu ứng), sai ở Quán → rung; bằng chứng như cũ', async ({ page, errors }) => {
  await lobby(page);
  await play(page, 'cfstart');
  let pk = await page.evaluate(() => (window as any).eval('EM').peek());
  expect(pk.run).toBe('cafe');
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await page.locator(`[data-e="cfans"][data-i="${pk.ans}"]`).click();
  await expect(page.locator('#app .fb.good.stpop')).toBeVisible();
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0 + 1);
  await page.screenshot({ path: 'test-results/stage-cafe.png' });
  await page.locator('.stagebar [data-e="stexit"]').click();
  await play(page, 'cfstart');
  pk = await page.evaluate(() => (window as any).eval('EM').peek());
  const wrong = (pk.ans + 1) % pk.opts.length;
  await page.locator(`[data-e="cfans"][data-i="${wrong}"]`).click();
  await expect(page.locator('#app .fb.bad.stshake')).toBeVisible();
  await page.screenshot({ path: 'test-results/stage-bubbles.png' });
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`v102 sân khấu: WCAG AA (${scheme}) ở 390px, Quán và Xưởng`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await lobby(page);
    for (const start of ['cfstart', 'wsstart']) {
      await play(page, start);
      await expect(page.locator('.stagebar')).toBeVisible();
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      const w = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(w).toBeLessThanOrEqual(390);
      await page.screenshot({ path: `test-results/stage-${start}-${scheme}.png` });
      await page.locator('.stagebar [data-e="stexit"]').click();
    }
    expect(errors).toEqual([]);
  });
}

test('v105–v106 cảnh sống: Vườn từ có luống chậu cây ở trên (cây lớn khi trả lời đúng), Quán có khách bước vào; thẻ câu hỏi bên dưới; bằng chứng như cũ', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await play(page, 'cfstart');
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('scene'))).toBe(true);
  const top = await page.locator('#app').boundingBox();
  expect(top!.y).toBeGreaterThan(200);   // chừa 1/3 trên cho cảnh
  await expect(page.locator('#app .cfshop')).toBeHidden();
  await page.waitForTimeout(800);
  await page.screenshot({ path: 'test-results/scene-cafe.png' });
  await page.locator('.stagebar [data-e="stexit"]').click();
  await play(page, 'gdstart');
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('scene'))).toBe(true);
  const ask = page.locator('[data-e="gdask"]');
  if (await ask.isVisible()) await ask.click();
  const pk = await page.evaluate(() => (window as any).eval('EM').peek());
  if (pk?.opts) await page.locator(`[data-e="gdans"][data-i="${pk.ans}"]`).click();
  else if (pk?.accept) { await page.locator('#app input[name="a"]').fill(pk.accept[0]); await page.locator('#app input[name="a"]').press('Enter'); }
  await expect(page.locator('#app .fb.good')).toBeVisible();
  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/scene-garden.png' });
  const r = await new (await import('@axe-core/playwright')).default({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  expect(errors).toEqual([]);
});

// v107 cảnh sống cho các game kỹ năng còn lại: mỗi game có cảnh 1/3 trên (canvas aria-hidden), thẻ HTML bên dưới, WCAG AA giữ nguyên.
for (const scheme of ['light', 'dark'] as const) {
  test(`v107 cảnh sống: Xưởng, Thư, Thám tử, Karaoke, Robot, Leo tháp có cảnh; thẻ bên dưới; WCAG AA (${scheme}) 390px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await lobby(page);
    for (const start of ['wsstart', 'ltstart', 'dtstart', 'krstart', 'rbstart', 'qstart']) {
      await play(page, start);
      await expect.poll(() => page.evaluate(() => document.body.classList.contains('scene')), { message: start }).toBe(true);
      expect(await page.evaluate(() => document.getElementById('app')!.getBoundingClientRect().top + scrollY), start).toBeGreaterThan(200);   // Thư tự cuộn tới ô viết
      await page.evaluate(() => scrollTo(0, 0)); await page.waitForTimeout(300);
      if (scheme === 'light') await page.screenshot({ path: `test-results/scene-${start}.png` });
      const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(r.violations.map(v => `${start} ${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth), start).toBeLessThanOrEqual(390);
      await page.locator('.stagebar [data-e="stexit"]').click();
      await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible();
    }
    expect(errors).toEqual([]);
  });
}

// v108: hạt nổ vẽ ở lớp trong suốt TRÊN thẻ (trước đây nằm sau thẻ đặc nên không thấy), không chặn chạm; bàn chơi có sẵn có hiệu ứng riêng.
test('v108 hiệu ứng: lớp hạt nổ ở trên thẻ, không chặn chạm; Bàn Cờ đổ xúc xắc → xúc xắc xoay / ô tới nảy', async ({ page, errors }) => {
  await lobby(page);
  await play(page, 'bdstart');
  const pop = await page.evaluate(() => { const p = document.getElementById('stagepop')!, cs = getComputedStyle(p); return { z: Number(cs.zIndex), pe: cs.pointerEvents, hidden: p.getAttribute('aria-hidden') }; });
  expect(pop).toEqual({ z: 40, pe: 'none', hidden: 'true' });
  const roll = page.locator('[data-e="bdroll"]');
  await expect(roll).toBeVisible();
  const hit = await roll.evaluate(b => { const r = b.getBoundingClientRect(); return document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2)?.closest('[data-e]')?.getAttribute('data-e'); });
  expect(hit).toBe('bdroll');
  await roll.click();
  await expect(page.locator('#app .bddie.stspin, #app .bdt.land.stpop')).toHaveCount(1);   // tới lô đất thì ô vừa tới nảy
  await page.locator('.stagebar [data-e="stexit"]').click();
  await expect(page.locator('#stagepop')).toHaveCount(0);
  expect(errors).toEqual([]);
});

// v109 trò nhanh cũ của app.js (Tốc độ 60 giây, Ghép cặp) cũng lên sân khấu: ẩn khung app, ✕ = thoát trò; trả lời đúng → điểm nảy.
test('v109 sân khấu: Tốc độ 60 giây và Ghép cặp chơi toàn màn, ✕ thoát; đúng → điểm nảy; WCAG AA', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(async () => {
    const w = window as any; w.eval('ALL_WORDS').slice(0, 30).forEach((x: any) => { w.eval('W')(x.id).learned = true; });
    w.eval('st').onboarded = true; w.eval('save()'); await w.eval('emLoad()'); w.eval("go('games')");
  });
  await page.evaluate(() => document.querySelectorAll('details').forEach(d => { (d as HTMLDetailsElement).open = true; }));
  await page.locator('[data-act="speed"]').first().click();
  await expect.poll(() => page.evaluate(() => document.body.dataset.game)).toBe('speed');
  await expect(page.locator('#app > .back')).toBeHidden();
  const ans = await page.evaluate(() => (window as any).eval('ui.game.q.ans'));
  await page.locator(`[data-spk="${ans}"]`).click();
  await expect(page.locator('#app .q .pill.accent.stpop')).toHaveCount(1);
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await page.screenshot({ path: 'test-results/stage-speed.png' });
  await page.locator('.stagebar [data-act="gameexit"]').click();
  await page.locator('[data-act="mquit"]').click();   // đang giữa lượt: hỏi xác nhận thoát (như nút ← cũ)
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('stage'))).toBe(false);
  await page.evaluate(() => { (window as any).eval("go('games')"); document.querySelectorAll('details').forEach(d => { (d as HTMLDetailsElement).open = true; }); });
  await page.locator('[data-act="match"]').first().click();
  await expect.poll(() => page.evaluate(() => document.body.dataset.game)).toBe('match');
  await page.locator('.stagebar [data-act="gameexit"]').click();
  await expect.poll(() => page.evaluate(() => document.body.classList.contains('stage'))).toBe(false);
  expect(errors).toEqual([]);
});
