import { test, expect } from './fixtures.ts';

// v62 Ladder Quest: mỗi lượt là một câu do engine chọn; câu trả lời vào bản đồ năng lực, xu/tim/tầng chỉ là telemetry.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Ladder Quest: vào từ Thử thách, leo một tầng, câu trả lời thành bằng chứng, kết quả game không vào mastery', async ({ page, errors }) => {
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
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/chỉ câu trả lời mới được tính/)).toBeVisible();
  await page.getByRole('button', { name: /Leo tầng 1/ }).click();
  const end = page.getByRole('heading', { name: /Qua tầng|Hết tim/ });
  // Câu đầu chọn phương án đầu tiên, các câu sau "Không biết"; trại thì đọc bí kíp rồi đi tiếp.
  for (let i = 0; i < 20 && !(await end.isVisible()); i++) {
    const next = page.locator('[data-e="qnext"]'), dunno = page.getByRole('button', { name: 'Không biết' }).first();
    await expect(next.or(dunno).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await next.isVisible()) { await next.click(); continue; }
    await dunno.click();
  }
  await expect(end).toBeVisible();
  const e = await page.evaluate(() => (window as any).eval('st').e);
  const ev = e.ev.led.filter((x: any) => x.src === 'game' || (x.src === 'transfer' && String(x.ch).startsWith('quest-1:')));
  expect(ev.length).toBeGreaterThanOrEqual(3);
  expect(ev.every((x: any) => String(x.ch).startsWith('quest-1:1:'))).toBe(true);
  expect(e.q.runs).toBe(1);
  expect(e.q.ans).toBe(ev.length);
  expect(e.ev.snap.some((s: any) => String(s.dec).startsWith('quest:'))).toBe(true);
  // Giới hạn trung thực: một tầng là lượt hữu hạn, có điểm dừng.
  await expect(page.getByText(/Nghỉ ở đây cũng tốt/)).toBeVisible();
  await page.getByRole('button', { name: 'Về tháp' }).click();
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible();
  expect(errors).toEqual([]);
});
