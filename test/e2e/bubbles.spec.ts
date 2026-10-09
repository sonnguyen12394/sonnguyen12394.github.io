import { test, expect } from './fixtures.ts';

// v76 Bắt Âm: từ nghe của nút âm (ph:) do engine chọn, 3 bong bóng (đoán mò 1/3), không hết giờ; điểm / màn là telemetry.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Bắt Âm: 10 từ, 3 lựa chọn, sai thì nghe lại hai từ của cặp + mẹo; bằng chứng ở nút ph: với g = 1/3', async ({ page, errors }) => {
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
  await page.locator('[data-e="bbstart"]').first().click();
  const end = page.getByRole('heading', { name: /Xong màn/ });
  let n = 0;
  for (let i = 0; i < 40 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="bbnext"]'), bub = page.locator('[data-e="bbans"][data-i="0"]');
    await expect(next.or(bub).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await next.isVisible()) { await next.click(); continue; }
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    expect(pk.run).toBe('bubbles'); expect(pk.opts.length).toBe(3);
    if (n === 0) await page.screenshot({ path: 'test-results/bubbles.png' });
    const wrong = n % 4 === 3, pick = wrong ? (pk.ans + 1) % 3 : pk.ans;
    await page.locator(`[data-e="bbans"][data-i="${pick}"]`).click(); n++;
    if (wrong) await expect(page.locator('.fb.bad [data-say]').first()).toBeVisible();
  }
  await expect(end).toBeVisible();
  expect(n).toBe(10);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:s1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, ph: xs.every((x: any) => x.node.startsWith('ph:')), gs: st.e.gs }; });
  expect(s.n).toBe(10); expect(s.ok).toBe(8); expect(s.ph).toBe(true); expect(s.gs.runs).toBe(1); expect(s.gs.stage).toBe(2);
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  expect(errors).toEqual([]);
});
