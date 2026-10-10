import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v101 cốt truyện "Phố Chữ mất tiếng" (GAME-CRITERIA §10.13): thẻ truyện ở sảnh, cảnh truyện, nhiệm vụ nối ba game, chương cuối khu cần
// kỹ năng vững thật. Truyện không ghi bằng chứng.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function lobby(page: Page, sy?: unknown): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate((y) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    if (y) st.e.sy = y;
    w.eval('save()'); w.eval("go('games')");
  }, sy);
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
async function watch(page: Page): Promise<void> {
  await expect(page.locator('#stfx')).toBeVisible();
  for (let i = 0; i < 12 && await page.locator('#stfx').count(); i++) { await page.locator('#stfx [data-st="next"]').click(); }
  await expect(page.locator('#stfx')).toHaveCount(0);
}

test('v101 truyện: mở đầu → chương 1; tìm từ ở Mỏ Chữ = đào chữ cho Bà Lan (hiện cả trong game); đủ nhiệm vụ → cảnh truyện → chương 2 + xu', async ({ page, errors }) => {
  await lobby(page);
  const card = page.locator('.stcard');
  await expect(card).toContainText('Phố Chữ mất tiếng');
  await page.locator('[data-e="stscene"]').click();
  await expect(page.locator('#stfx .sten')).toHaveAttribute('lang', 'en');
  await page.screenshot({ path: 'test-results/story-scene.png' });
  await watch(page);
  await expect(card).toContainText('Hoa không tên');
  await expect(card).toContainText('0/3');
  const ledN = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  // Nhiệm vụ đào chữ dẫn vào Mỏ Chữ; phụ đề game nói đang đào cho ai.
  await card.locator('[data-e="hnstart"]').click();
  await expect(page.locator('#whfx .whsu')).toContainText('Đào chữ cho Bà Lan: 0/3');
  const pk = await page.evaluate(() => (window as any).eval('EM').peek());
  await page.locator('#whfx input[name="a"]').fill(pk.accept[0]); await page.locator('#whfx input[name="a"]').press('Enter');
  await expect(page.locator('#whfx .whsu')).toContainText('1/3');
  await page.locator('[data-e="hnexit"]').first().click();
  await expect(card).toContainText('1/3');
  // Truyện không thêm bằng chứng: sổ chỉ tăng bằng chính câu trả lời trong game (≤ 1 sự kiện cho một từ).
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length) - ledN).toBeLessThanOrEqual(1);
  // Đủ nhiệm vụ → nút xem cảnh → chương 2, +20 xu.
  const c0 = await page.evaluate(() => { const st = (window as any).eval('st'); st.e.sy.prog = { dig: 3, light: 1, voice: 2 }; (window as any).eval('render()'); return st.e.q?.coins ?? 0; });
  await page.locator('[data-e="stscene"]').click();
  await watch(page);
  await expect(card).toContainText('Bánh mì im lặng');
  expect(await page.evaluate(() => (window as any).eval('st').e.q.coins)).toBe(c0 + 20);
  expect(errors).toEqual([]);
});

test('v101 chương cuối khu: đủ nhiệm vụ game mà thiếu kỹ năng vững → khoá, chỉ sang Lộ trình hôm nay; WCAG AA thẻ truyện + cảnh truyện ở 390px', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, { ch: 4, prog: { dig: 99, light: 99, voice: 99 } });
  const card = page.locator('.stcard');
  await expect(card).toContainText('Chợ Sáng thức giấc');
  await expect(card.locator('.stgate')).toContainText('kỹ năng vững');
  await expect(card.locator('[data-e="stscene"]')).toHaveCount(0);
  await expect(card.locator('[data-e="go"][data-r="today"]')).toBeVisible();
  const r1 = await new AxeBuilder({ page }).include('.stcard').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r1.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await page.screenshot({ path: 'test-results/story-gate.png', fullPage: false });
  // Xem lại cảnh đã qua (chương 1) vẫn được; không đổi chương.
  await page.evaluate(() => { const st = (window as any).eval('st'); st.e.sy = { ch: 2, prog: { dig: 0, light: 0, voice: 0 } }; (window as any).eval('render()'); });
  await page.evaluate(() => (document.querySelector('.stcard') as HTMLElement).insertAdjacentHTML('beforeend', '<button data-e="stscene" data-ch="1" id="replay">x</button>'));
  await page.locator('#replay').click();
  await expect(page.locator('#stfx')).toBeVisible();
  await page.waitForTimeout(1500);
  const r2 = await new AxeBuilder({ page }).include('#stfx').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r2.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await page.screenshot({ path: 'test-results/story-scene-390.png' });
  await page.locator('#stfx [data-st="skip"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').e.sy.ch)).toBe(2);
  expect(errors).toEqual([]);
});
