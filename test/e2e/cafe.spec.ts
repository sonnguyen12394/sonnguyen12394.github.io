import { test, expect, play } from './fixtures.ts';

// v75 Quán Cà Phê: khách là câu của nút chức năng giao tiếp (fn:) do engine chọn; nghe hiểu (mức 2) / chọn câu đáp (mức 3), 4 lựa chọn.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Quán Cà Phê: 6 khách, xen kẽ nghe hiểu / chọn câu đáp; bằng chứng ở nút fn: với 4 lựa chọn; sao là telemetry', async ({ page, errors }) => {
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
  await play(page, 'cfstart');
  const end = page.getByRole('heading', { name: /Đóng ca/ });
  let n = 0;
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="cfnext"]'), opt = page.locator('[data-e="cfans"][data-i="0"]');
    await expect(next.or(opt).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await next.isVisible()) { await next.click(); continue; }
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    expect(pk.run).toBe('cafe'); expect(pk.opts.length).toBe(4);
    if (n === 1) await page.screenshot({ path: 'test-results/cafe.png' });
    await page.locator(`[data-e="cfans"][data-i="${n % 3 === 2 ? -1 : pk.ans}"]`).click(); n++;
  }
  await expect(end).toBeVisible();
  expect(n).toBe(6);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:q1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, fn: xs.every((x: any) => x.node.startsWith('fn:')), lv: [...new Set(xs.map((x: any) => x.lv))].sort(), gq: st.e.gq }; });
  expect(s.n).toBe(6); expect(s.ok).toBe(4); expect(s.fn).toBe(true); expect(s.gq.runs).toBe(1); expect(s.gq.stars).toBeGreaterThan(0);
  expect(s.lv).toEqual([2, 3]);
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  expect(errors).toEqual([]);
});
