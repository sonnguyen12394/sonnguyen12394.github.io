import { test, expect } from './fixtures.ts';

// v60 (spec v2.4 §59): nút đã Đạt được thử ở câu mới chưa gặp (câu điền từ từ bài đọc khác); trượt ở câu mới → mở lại nút.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Transfer: unit đã Đạt hiện "Thử ở câu mới"; trượt câu mới ghi bằng chứng critical, snapshot và mở lại nút', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: t, date: null }];
    for (let i = 0; i < 20; i++) w.ELCORE.ev(st, { node: 'u:a1-u1', level: 3, ok: true, item: 'w:practice' + (i % 5), src: 'vocab', ctx: 'rcl', qt: 'typed' }, t);
    w.eval('save()');
    w.eval("go('goal',{er:'today'})");
  });
  await expect(page.getByText('Thử ở câu mới · 3 câu').first()).toBeVisible({ timeout: 15000 });
  await page.evaluate(() => (window as any).eval("go('goal',{er:'xfer/u:a1-u1/3'})"));
  await expect(page.getByText(/Điền từ nghĩa là/)).toBeVisible({ timeout: 15000 });
  const done = page.getByRole('heading', { name: /Đã cập nhật bản đồ năng lực|Dùng được thật/ }), dunno = page.getByRole('button', { name: 'Không biết' }).first();
  for (let i = 0; i < 6 && !(await done.isVisible()); i++) {
    await expect(dunno.or(done)).toBeVisible();
    if (await done.isVisible()) break;
    await dunno.click();
  }
  await expect(done).toBeVisible();
  await expect(page.getByText(/mở lại phần này/)).toBeVisible();
  const e = await page.evaluate(() => (window as any).eval('st').e);
  const xs = e.ev.led.filter((x: any) => x.ctx === 'transfer');
  expect(xs.length).toBeGreaterThanOrEqual(2);
  expect(xs.every((x: any) => x.tier === 3 && x.nov === 1)).toBe(true);
  expect(e.ev.snap.some((s: any) => s.kind === 'diag' && s.dec === 'transfer:fail')).toBe(true);
  expect(e.ev.dis['u:a1-u1|3']?.on).toBe(1);
  await page.getByRole('button', { name: 'Vì sao?' }).click();
  await expect(page.getByText(/Ở câu mới chưa gặp \(transfer\)/)).toBeVisible();
  expect(errors).toEqual([]);
});
