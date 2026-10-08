import { test, expect } from './fixtures.ts';

// v64 goal-first + Quest là màn chính: người mới → bài dò ngắn → app tự đặt mục tiêu CEFR → màn chính là tháp → leo một tầng.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('người mới: Bắt đầu → dò ngắn (≤ 8 phần) → mục tiêu tự đặt → tab Chơi là màn chính', async ({ page, errors }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Bạn đang ở đâu?' })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/tối đa 8 phần/)).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu dò' }).click();
  const result = page.getByRole('heading', { name: 'Bạn đang ở đâu', exact: true }), dunno = page.getByRole('button', { name: 'Không biết' }).first();
  for (let i = 0; i < 40 && !(await result.isVisible()); i++) {
    await expect(dunno.or(result)).toBeVisible();
    if (await result.isVisible()) break;
    await dunno.click();
  }
  await expect(page.getByRole('heading', { name: /App đã đặt mục tiêu/ })).toBeVisible();
  // v69 (bot L01): kết quả nói rõ là ước lượng, sẽ kiểm tra lại khi chơi; bản chỉ CEFR không có bảng giờ học các kỳ thi.
  await expect(page.getByText(/có thể lệch khoảng nửa cấp/)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Số giờ học ước tính tới từng kỳ thi' })).toHaveCount(0);
  const e = await page.evaluate(() => (window as any).eval('st').e);
  expect(e.goals.map((g: any) => g.id)).toEqual(['cefr-a1']);   // không biết gì → A1
  expect(e.diag.n).toBeLessThanOrEqual(8);
  expect(e.ev.snap.some((s: any) => s.dec === 'goal:AUTO')).toBe(true);
  await page.getByRole('button', { name: /Bắt đầu leo tháp/ }).click();
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible();
  await expect(page.getByText(/kỹ năng đã vững/)).toBeVisible();   // v69: tiến độ kỹ năng con, không chỉ số năng lực Can-do
  await expect(page.locator('#bnav button[aria-current="page"], #nav button[aria-current="page"]').first()).toContainText('Chơi');
  // Mở lại app: màn chính là tháp (chờ dữ liệu nền tải xong trước, như trên).
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.reload();
  await expect(page.getByRole('heading', { name: /Leo tháp tiếng Anh/ })).toBeVisible({ timeout: 15000 });
  expect(errors).toEqual([]);
});

test('người dùng cũ đã học mà chưa có mục tiêu: app đặt mục tiêu cấp đang học một lần', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true; st.e.goals = []; delete st.set.autoGoal;
    const wd = w.eval('UNITS')[0].words[0]; w.eval('W')(wd.id).learned = true;
    w.eval('save()');
  });
  // Chờ dữ liệu bài học nền tải xong trước khi tải lại trang: WebKit báo lỗi khi một lượt tải bị huỷ giữa chừng.
  const settled = () => page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await settled();
  await page.reload();
  await page.waitForFunction(() => ((window as any).eval('st').e.goals || []).length === 1, null, { timeout: 15000 });
  const e = await page.evaluate(() => (window as any).eval('st'));
  expect(e.e.goals[0].id).toBe('cefr-a1'); expect(e.set.autoGoal).toBe(1);
  // Bỏ hết mục tiêu rồi mở lại: không tự đặt lại.
  await settled();
  await page.evaluate(() => { const st = (window as any).eval('st'); st.e.goals = []; (window as any).eval('save()'); });
  await page.reload();
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForTimeout(1500);
  await settled();
  expect(await page.evaluate(() => (window as any).eval('st').e.goals.length)).toBe(0);
  expect(errors).toEqual([]);
});
