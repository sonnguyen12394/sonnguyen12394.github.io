import { test, expect, play, openAll } from './fixtures.ts';

// v72 Xếp Khối Chữ: trả lời câu do engine chọn → nhận khối → đặt khối. Câu trả lời thành bằng chứng (id lượt "quest-1:b…"),
// điểm / kỷ lục chỉ là telemetry (e.bk), không vào mastery.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Xếp Khối: sảnh Chơi → ván mới → trả lời, đặt khối → hết ván; bằng chứng đúng game, điểm không vào mastery', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()');
    w.eval("go('games')");
  });
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
  await page.getByRole('heading', { name: /Hôm nay chơi gì/ }).waitFor({ timeout: 15000 }); await openAll(page);
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible();   // tháp vẫn còn (Leo nhanh)
  await play(page, 'bkstart');
  const end = page.getByRole('heading', { name: /Xong ván|Hết chỗ đặt/ });
  let answered = 0, placed = 0, typed = false;
  for (let i = 0; i < 160 && !(await end.isVisible()); i++) {
    const put = page.locator('[data-e="bkput"][data-ok]'), next = page.locator('[data-e="qnext"]'), check = page.locator('[data-e="qcheck"]');
    const opt = page.locator('[data-e="qans"][data-i="0"]'), input = page.locator('input[name="a"]');
    await expect(put.or(next).or(check).or(opt).or(input).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await put.count()) { await put.first().click(); placed++; continue; }
    if (await check.isVisible()) { await check.click(); continue; }
    if (await next.isVisible()) { await next.click(); continue; }
    if (await input.isVisible()) { await input.fill('zzz'); await input.press('Enter'); typed = true; answered++; continue; }
    await opt.click(); answered++;
    if (answered === 1) await page.screenshot({ path: 'test-results/blocks-ask.png' });
    if (answered === 2) {
      await next.click();
      await page.screenshot({ path: 'test-results/blocks-place.png' });
    }
  }
  await expect(end).toBeVisible();
  await page.screenshot({ path: 'test-results/blocks-end.png' });
  expect(answered).toBeGreaterThan(0);
  expect(placed).toBeGreaterThan(0);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { led: st.e.ev.led.filter((x: any) => /^quest-1:b1:/.test(x.ch ?? '')).length, bk: st.e.bk, q: st.e.q, snap: st.e.ev.snap.find((x: any) => x.subj === 'blocks:1') }; });
  expect(s.led).toBeGreaterThan(0);
  expect(s.bk.runs).toBe(1);
  expect(s.bk.streak).toBe(1);
  expect(s.snap?.dec).toMatch(/^blocks:(win|lose)$/);
  expect(typeof s.snap?.info?.score).toBe('number');
  expect(s.q?.floor ?? 1).toBe(1);   // tầng tháp không đổi
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  await page.locator('[data-e="qhome"]').click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible();
  void typed;
  expect(errors).toEqual([]);
});
