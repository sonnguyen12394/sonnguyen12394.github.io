import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v86 Thám hiểm sương mù (bài chẩn đoán dạng bản đồ), v87 Vườn từ (từ mới: hạt → mầm → cây → hoa).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page): Promise<void> {
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
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());

test('Thám hiểm sương mù: chọn đường, mỗi điểm dò mở một ô (đúng hay sai đều mở), hết bản đồ → kết quả chẩn đoán', async ({ page, errors }) => {
  await open(page);
  await page.locator('[data-e="fgstart"]').first().click();
  await expect(page.getByRole('heading', { name: /Đi đường nào/ })).toBeVisible();
  await page.screenshot({ path: 'test-results/fog-pick.png' });
  let picks = 0, wrongNode = true, n = 0;
  for (let i = 0; i < 200; i++) {
    if (await page.getByRole('heading', { name: /Bạn đang ở đâu/ }).isVisible()) break;
    const pk = await peek(page);
    if (pk?.run === 'fogpick') {
      const open0 = await page.locator('.fgcell.open').count();
      expect(open0).toBe(picks);   // số ô mở = số điểm dò đã xong
      const k = pk.opts.includes(picks % 2 ? 'g' : 'u') ? (picks % 2 ? 'g' : 'u') : pk.opts[0];
      await page.locator(`[data-e="fgpick"][data-k="${k}"]`).click(); picks++; continue;
    }
    if (pk?.run === 'diag') {
      if (n === 1) await page.screenshot({ path: 'test-results/fog-ask.png' });
      // Điểm dò đầu: trả lời sai hết (ô vẫn mở). Còn lại: đúng.
      if (wrongNode && picks === 1) { await page.locator('[data-e="dans"][data-i="-1"]').first().click(); n++; continue; }
      wrongNode = false;
      if (pk.opts) await page.locator(`[data-e="dans"][data-i="${pk.ans}"]`).first().click();
      else { await page.locator('input[name="a"]').fill(pk.accept[0]); await page.locator('input[name="a"]').press('Enter'); }
      n++; continue;
    }
    break;
  }
  await expect(page.getByRole('heading', { name: /Bạn đang ở đâu/ })).toBeVisible();
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { diag: st.e.diag, gf: st.e.gf }; });
  expect(s.diag.n).toBe(picks); expect(picks).toBeGreaterThanOrEqual(8); expect(s.gf.runs).toBe(1);
  expect(errors).toEqual([]);
});

test('Vườn từ: gieo hạt (thẻ dạy trước), tưới = câu nhận ra mức 1; hôm sau cây lên câu nhớ ngược mức 2; sai giữ bậc', async ({ page, errors }) => {
  await open(page);
  await page.locator('[data-e="gdstart"]').first().click();
  const end = page.getByRole('heading', { name: /Vườn của bạn/ });
  let asked = 0;
  for (let i = 0; i < 40 && !(await end.isVisible()); i++) {
    const pk = await peek(page);
    if (pk?.run === 'gdteach') { if (asked === 0) await page.screenshot({ path: 'test-results/garden-teach.png' }); await page.locator('[data-e="gdask"]').click(); continue; }
    if (pk?.run === 'garden') {
      expect(pk.level).toBe(1); expect(pk.id).toMatch(/:vi$/);
      await page.locator(`[data-e="gdans"][data-i="${asked === 1 ? -1 : pk.ans}"]`).click(); asked++; continue;
    }
    await page.locator('[data-e="gdnext"]').click();
  }
  await expect(end).toBeVisible();
  await page.screenshot({ path: 'test-results/garden-end.png' });
  const s1 = await page.evaluate(() => { const st = (window as any).eval('st'); const gv = st.e.gv; return { plants: gv.plants, led: st.e.ev.led.filter((x: any) => /:v1:/.test(x.ch ?? '')).map((x: any) => ({ lv: x.lv, ok: x.ok, node: x.node })) }; });
  expect(Object.keys(s1.plants).length).toBe(asked);
  expect(Object.values(s1.plants).filter((p: any) => p.s === 1).length).toBe(asked - 1);   // một câu "Không biết": cây giữ bậc hạt
  expect(s1.led.every((x: any) => x.lv === 1 && x.node.startsWith('u:'))).toBe(true);
  // Hôm sau (lùi ngày lên bậc 1 ngày): cây đã là mầm → câu nhớ ngược mức 2, không dạy lại.
  await page.evaluate(() => { const st = (window as any).eval('st'); for (const p of Object.values(st.e.gv.plants) as any[]) p.d -= 1; (window as any).eval('save()'); });
  await page.locator('[data-e="qhome"]').click();
  await page.locator('[data-e="gdstart"]').first().click();
  // Cây "hạt" (trả lời Không biết hôm qua) hỏi lại nhận ra mức 1, không dạy lại thẻ; cây "mầm" lên câu nhớ ngược mức 2.
  let pk = await peek(page);
  expect(pk.run).toBe('garden'); expect(pk.level).toBe(1);
  await page.locator(`[data-e="gdans"][data-i="${pk.ans}"]`).click();
  await page.locator('[data-e="gdnext"]').click();
  pk = await peek(page);
  expect(pk.run).toBe('garden'); expect(pk.level).toBe(2); expect(pk.id).toMatch(/:word$/);
  expect(errors).toEqual([]);
});
