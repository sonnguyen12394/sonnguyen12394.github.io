import AxeBuilder from '@axe-core/playwright';
import { test, expect, play } from './fixtures.ts';
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
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
const onStage = (page: Page) => page.evaluate(() => ({ stage: document.body.classList.contains('stage'), game: document.body.dataset.game ?? '', fx: !!document.getElementById('stagefx'), top: !!(document.querySelector('.top') as HTMLElement | null)?.offsetParent }));

const GAMES: Array<[string, string]> = [['cfstart', 'cafe'], ['bbstart', 'bubbles'], ['gdstart', 'garden'], ['wsstart', 'shop'], ['dtstart', 'case'], ['ltstart', 'letter'], ['rbstart', 'robot'], ['pzstart', 'puzzle'], ['bkstart', 'blocks'], ['bdstart', 'board'], ['krstart', 'kara']];
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

test('v102 sân khấu: trả lời đúng ở Quán → khung phản hồi nảy (hiệu ứng), sai ở Bắt Âm → rung; bằng chứng như cũ', async ({ page, errors }) => {
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
  await play(page, 'bbstart');
  pk = await page.evaluate(() => (window as any).eval('EM').peek());
  const wrong = (pk.ans + 1) % pk.opts.length;
  await page.locator(`[data-e="bbans"][data-i="${wrong}"]`).click();
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
