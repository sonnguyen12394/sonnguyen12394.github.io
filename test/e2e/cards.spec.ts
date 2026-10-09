import { test, expect } from './fixtures.ts';

// v74 Bài Câu: lá từ của câu ngữ pháp do engine chọn; tự xếp câu = bằng chứng mức 3 (id lượt "quest-1:c…"); điểm / bùa là telemetry.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Bài Câu: xếp đúng thì ra bài có điểm, sai thì hiện câu đúng; 3 bàn × 3 lượt; bằng chứng đúng nút ngữ pháp', async ({ page, errors }) => {
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
  await page.locator('[data-e="cdstart"]').first().click();
  const end = page.getByRole('heading', { name: /Xong ván/ });
  let plays = 0, good = 0, shot = 0;
  for (let i = 0; i < 60 && !(await end.isVisible()); i++) {
    const play = page.locator('[data-e="cdplay"]'), next = page.locator('[data-e="cdnext"]'), charm = page.locator('[data-e="cdcharm"]');
    await expect(play.or(next).or(charm).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await charm.count()) { await charm.first().click(); continue; }
    if (await next.isVisible()) { await next.click(); continue; }
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    expect(pk.run).toBe('cards');
    if (plays % 2 === 0) for (const k of pk.order) await page.locator(`[data-e="cdtile"][data-i="${k}"]`).click();   // đúng
    else await page.locator('[data-e="cdtile"]').first().click();                                                     // sai (1 lá)
    if (shot++ === 0) await page.screenshot({ path: 'test-results/cards.png' });
    await play.click(); plays++;
    if (plays % 2 === 1) { await expect(page.locator('.fb.good')).toBeVisible(); good++; } else await expect(page.locator('.fb.bad')).toContainText('Câu đúng');
  }
  await expect(end).toBeVisible();
  expect(plays).toBe(9); expect(good).toBe(5);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:c1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, g: xs.every((x: any) => x.node.startsWith('g:')), gc: st.e.gc }; });
  expect(s.n).toBe(9); expect(s.ok).toBe(5); expect(s.g).toBe(true); expect(s.gc.runs).toBe(1);
  await page.screenshot({ path: 'test-results/cards-end.png' });
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  expect(errors).toEqual([]);
});
