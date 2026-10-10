import { test, expect, play } from './fixtures.ts';

// v77 Câu đố ngày: 16 ô của 4 cụm từ (u:) do engine chọn; ghép nhóm không vào năng lực; sau mỗi nhóm một câu nhớ lại (bằng chứng ở nút u:).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Câu đố ngày: nộp sai không mất gì, 4 nhóm + 4 câu nhớ lại; bằng chứng chỉ từ câu nhớ lại; ngày giải là telemetry', async ({ page, errors }) => {
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
  await expect(page.getByText(/Câu đố hôm nay đang chờ/)).toBeAttached();   // v88: thẻ game nằm trong mục thu gọn "Tất cả trò chơi"
  await play(page, 'pzstart');
  await expect(page.locator('.pztile')).toHaveCount(16);
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  // Nộp sai một lần: lấy 2 ô nhóm 0 + 2 ô nhóm 1.
  let pk = await page.evaluate(() => (window as any).eval('EM').peek());
  expect(pk.run).toBe('pzboard'); expect(pk.groups.length).toBe(4);
  for (const i of [...pk.groups[0].tiles.slice(0, 2), ...pk.groups[1].tiles.slice(0, 2)]) await page.locator(`[data-e="pztile"][data-i="${i}"]`).click();
  await page.locator('[data-e="pzsubmit"]').click();
  await expect(page.getByText(/Chưa phải một nhóm|Gần đúng/)).toBeVisible();
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);   // ghép sai không ghi bằng chứng
  await page.locator('[data-e="pzclear"]').click();
  await page.locator('[data-e="pzhint"]').click();
  await page.screenshot({ path: 'test-results/puzzle.png' });
  const end = page.getByRole('heading', { name: /Giải xong/ });
  let recalls = 0;
  for (let i = 0; i < 20 && !(await end.isVisible()); i++) {
    pk = await page.evaluate(() => (window as any).eval('EM').peek());
    if (pk?.run === 'pzboard') {
      const g = pk.groups.find((x: any) => !x.solved);
      for (const t of g.tiles) await page.locator(`[data-e="pztile"][data-i="${t}"]`).click();
      await page.locator('[data-e="pzsubmit"]').click(); continue;
    }
    if (pk?.run === 'puzzle') {
      if (recalls === 0) await page.screenshot({ path: 'test-results/puzzle-recall.png' });
      if (recalls === 1) await page.locator('[data-e="pzans"][data-i="-1"]').click();
      else if (pk.opts) await page.locator(`[data-e="pzans"][data-i="${pk.ans}"]`).click();
      else { await page.locator('input[name="a"]').fill(recalls === 2 ? 'zzz' : pk.accept[0]); await page.locator('input[name="a"]').press('Enter'); }
      recalls++; continue;
    }
    await page.locator('[data-e="pznext"]').click();
  }
  await expect(end).toBeVisible();
  expect(recalls).toBe(4);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:z1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, u: xs.every((x: any) => x.node.startsWith('u:')), lv: xs.every((x: any) => x.lv === 2 || x.lv === 3), gd: st.e.gd, today: (window as any).eval('today()') }; });
  expect(s.n).toBe(4); expect(s.ok).toBeGreaterThanOrEqual(2); expect(s.ok).toBeLessThanOrEqual(3); expect(s.u).toBe(true); expect(s.lv).toBe(true);
  expect(s.gd.runs).toBe(1); expect(s.gd.days).toBe(1); expect(s.gd.last).toBe(s.today);
  await expect(page.getByText(/bỏ một ngày không mất gì/)).toBeVisible();
  await page.locator('[data-e="qhome"]').click();
  await expect(page.getByText(/Đã giải hôm nay/)).toBeAttached();
  expect(errors).toEqual([]);
});
