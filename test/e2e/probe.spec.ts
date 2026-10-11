import { test, expect } from './fixtures.ts';

// v58 (spec v2.4 §46–48): Lộ trình hôm nay đề xuất "Kiểm tra nhanh" có giá trị thông tin cao nhất; làm xong ghi bằng chứng và snapshot.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Kiểm tra nhanh: hiện trong Lộ trình hôm nay, làm 3 câu, ghi bằng chứng và snapshot chẩn đoán', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()');
    w.eval("go('goal',{er:'today'})");
  });
  await expect(page.getByText('Thử sức · 3 câu')).toBeVisible({ timeout: 15000 });
  // Bấm lại tới khi màn câu dò hiện ra: trên WebKit, cú bấm có thể rơi đúng lúc màn Lộ trình đang vẽ lại (tải nền xong) và bị mất.
  const q1 = page.getByText(/Thử sức · .* · câu 1\//);
  await expect(async () => {
    if (await q1.isVisible()) return;
    await page.getByRole('button', { name: 'Làm ngay' }).click({ timeout: 2000 });
    await expect(q1).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20000 });
  // Trả lời "Không biết" tới khi thấy màn kết quả (chờ từng câu hiện ra, không dựa vào đếm tức thời lúc màn đang vẽ lại).
  const done = page.getByRole('heading', { name: 'Đã cập nhật bản đồ năng lực' }), dunno = page.getByRole('button', { name: 'Không biết' }).first();
  for (let i = 0; i < 6 && !(await done.isVisible()); i++) {
    await expect(dunno.or(done)).toBeVisible();
    if (await done.isVisible()) break;
    await dunno.click();
  }
  await expect(done).toBeVisible();
  const e = await page.evaluate(() => (window as any).eval('st').e);
  expect(e.ev.pb.n).toBe(1);
  expect(e.ev.snap.some((s: any) => s.kind === 'diag' && String(s.dec).startsWith('probe:'))).toBe(true);
  expect(e.ev.led.some((x: any) => x.ctx === 'probe')).toBe(true);
  expect(errors).toEqual([]);
});
