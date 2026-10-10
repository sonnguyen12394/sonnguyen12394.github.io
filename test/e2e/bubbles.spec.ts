import { test, expect, play } from './fixtures.ts';

// v104: lớp phủ toàn màn hình, bong bóng là nút thật; đúng tự sang từ kế.
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
  await play(page, 'bbstart');
  const end = page.getByRole('heading', { name: /Xong màn/ });
  let n = 0;
  for (let i = 0; i < 40 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="bbnext"]').filter({ visible: true }), bub = page.locator('[data-e="bbans"][data-i="0"]').filter({ visible: true });
    await expect(next.or(bub).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await next.count()) { await next.first().click(); continue; }
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    expect(pk.run).toBe('bubbles'); expect(pk.opts.length).toBe(3);
    if (n === 0) await page.screenshot({ path: 'test-results/bubbles.png' });
    const wrong = n % 4 === 3, pick = wrong ? (pk.ans + 1) % 3 : pk.ans;
    await page.locator(`[data-e="bbans"][data-i="${pick}"]`).click(); n++;
    if (wrong) await expect(page.locator('.bbfb .fb.bad [data-say]').first()).toBeVisible();
    else await expect(page.locator('.bbfb .fb.good')).toBeVisible();   // v104: đúng thì tự sang từ kế (có micro thì dừng cho "nói thử")
  }
  await expect(end).toBeVisible();
  expect(n).toBe(10);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:s1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, ph: xs.every((x: any) => x.node.startsWith('ph:')), gs: st.e.gs }; });
  expect(s.n).toBe(10); expect(s.ok).toBe(8); expect(s.ph).toBe(true); expect(s.gs.runs).toBe(1); expect(s.gs.stage).toBe(2);
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('v104 Bắt Âm: lớp phủ toàn màn, bong bóng ≥ 44 px trong màn 390, chạm thật → nổ / tự sang từ kế; WCAG AA; ✕ về sảnh', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }]; w.eval('save()'); w.eval("go('games')"); });
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await play(page, 'bbstart');
  await expect(page.locator('#whfx.bbfx')).toBeVisible();
  await page.waitForTimeout(300);
  const pos: Array<{ t: string; x: number; y: number }> = await page.evaluate(() => (document.getElementById('whfx') as any)._pos());
  const box = await page.locator('#whfx .bbbub').first().boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(pos.every(p => p.x > 0 && p.x < 390)).toBe(true);
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  const r = await new AxeBuilder({ page }).include('#whfx').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await page.screenshot({ path: 'test-results/bubbles-390.png' });
  const pk = await page.evaluate(() => (window as any).eval('EM').peek());
  const p = pos[pk.ans]!;
  await page.mouse.click(p.x, p.y);
  await expect(page.locator('.bbfb .fb.good')).toBeVisible();
  const nx = page.locator('[data-e="bbnext"]').filter({ visible: true });
  if (await nx.count()) await nx.first().click();   // máy có nhận giọng nói: dừng cho phần "nói thử"
  await expect(page.locator('#whfx .whti')).toContainText('từ 2/10', { timeout: 4000 });
  await page.locator('[data-e="bbexit"]').first().click();
  await expect(page.locator('#whfx')).toHaveCount(0);
  expect(errors).toEqual([]);
});
