import { test, expect } from './fixtures.ts';

// v63: Đo tiến bộ — 12 câu giữ riêng, không hiện đáp án, câu giữ riêng bị loại khỏi thử transfer.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Đo tiến bộ: lần đo đầu vào, bộ câu giữ riêng không xuất hiện ở thử câu mới, lần sau hẹn sau 14 ngày', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()');
    w.eval("go('goal',{er:'today'})");
  });
  await page.getByRole('button', { name: /Đo đầu vào/ }).click();
  await expect(page.getByRole('heading', { name: /tiến bộ thật/ })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: /Đo đầu vào \(12 câu\)/ }).click();
  await expect(page.getByText(/không hiện đáp án/)).toBeVisible();
  const done = page.getByRole('heading', { name: /tiến bộ thật/ }), dunno = page.getByRole('button', { name: 'Không biết' }).first();
  for (let i = 0; i < 20 && !(await done.isVisible()); i++) {
    await expect(dunno.or(done)).toBeVisible();
    if (await done.isVisible()) break;
    await dunno.click();
  }
  await expect(page.getByRole('button', { name: /Đo sau khi học: từ/ })).toBeDisabled();
  const r = await page.evaluate(() => {
    const e = (window as any).eval('st').e;
    return { n: e.ms.set.length, pre: e.ms.checks[0], snap: e.ev.snap.some((s: any) => s.dec === 'measure:pre'), ctx: e.ev.led.filter((x: any) => x.ctx === 'measure').length };
  });
  expect(r.n).toBeGreaterThanOrEqual(10);
  expect(r.pre.phase).toBe('pre'); expect(r.pre.of).toBe(r.n);
  expect(r.snap).toBe(true); expect(r.ctx).toBe(r.n);
  // Câu giữ riêng không bao giờ xuất hiện ở "Thử ở câu mới" của cùng nút.
  const held = await page.evaluate(() => {
    const w = window as any, x = w.eval('st').e.ms.set[0];
    w.eval(`go('goal',{er:'xfer/${x.node}/3'})`);
    return (w.eval('eXfer')(x.node) as any[]).find(q => q.id === x.item).prompt as string;
  });
  const shown: string[] = [];
  const xdone = page.getByRole('heading', { name: /Đã cập nhật bản đồ năng lực|Dùng được thật/ });
  for (let i = 0; i < 5 && !(await xdone.isVisible()); i++) {
    await expect(dunno.or(xdone)).toBeVisible();
    if (await xdone.isVisible()) break;
    shown.push(await page.locator('h2').first().innerText());
    await dunno.click();
  }
  expect(shown.length).toBeGreaterThan(0);
  expect(shown).not.toContain(held);
  expect(errors).toEqual([]);
});
