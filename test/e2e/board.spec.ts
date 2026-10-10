import { test, expect, play, toLobby } from './fixtures.ts';

// v73 Bàn Cờ Phố: tung xúc xắc → dừng ở ô cảnh → câu do engine chọn (id lượt "quest-1:d…") → tung tiếp; xây nhà bằng xu.
// Xu / nhà / vị trí chỉ là telemetry (e.bd), không vào mastery.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Bàn Cờ: sảnh → tung 8 lượt → trả lời ở ô cảnh, xây nhà khi đủ xu → hết lượt; bằng chứng đúng game', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.q = { floor: 1, best: 0, coins: 500, runs: 0, wins: 0, ans: 0, ok: 0, day: 0 };   // đủ xu để thử xây
    w.eval('save()');
    w.eval("go('games')");
  });
  await toLobby(page);
  await play(page, 'bdstart');
  const end = page.getByRole('heading', { name: /Hết lượt tung/ });
  let rolls = 0, answered = 0, built = 0, shot = false;
  for (let i = 0; i < 80 && !(await end.isVisible()); i++) {
    const rollB = page.locator('[data-e="bdroll"]'), buildB = page.locator('[data-e="bdbuild"]'), skip = page.locator('[data-e="bdskip"]');
    const next = page.locator('[data-e="qnext"]'), check = page.locator('[data-e="qcheck"]'), opt = page.locator('[data-e="qans"][data-i="0"]'), input = page.locator('input[name="a"]');
    await expect(rollB.or(buildB).or(skip).or(next).or(check).or(opt).or(input).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await rollB.isVisible()) { if (!shot && rolls === 1) { await page.screenshot({ path: 'test-results/board.png' }); shot = true; } await rollB.click(); rolls++; continue; }
    if (await buildB.isVisible()) { await buildB.click(); built++; continue; }
    if (await skip.isVisible()) { await skip.click(); continue; }
    if (await check.isVisible()) { await check.click(); continue; }
    if (await next.isVisible()) { await next.click(); continue; }
    if (await input.isVisible()) { await input.fill('zzz'); await input.press('Enter'); answered++; continue; }
    await opt.click(); answered++;
  }
  await expect(end).toBeVisible();
  expect(rolls).toBe(8);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { led: st.e.ev.led.filter((x: any) => /^quest-1:d1:/.test(x.ch ?? '')).length, bd: st.e.bd, snap: st.e.ev.snap.find((x: any) => x.subj === 'board:1') }; });
  expect(s.bd.runs).toBe(1);
  expect(s.led).toBeGreaterThan(0); expect(s.led).toBeLessThanOrEqual(answered);   // câu thử ở lửa trại ghi là micro/…
  expect(s.snap?.dec).toBe('board:end');
  if (built) expect(s.bd.spent).toBeGreaterThan(0);
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  await page.locator('[data-e="qhome"]').click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible();
  expect(errors).toEqual([]);
});
