import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v111 trận cổng cuối khu (SPEC "Mô hình học v111" §3–§4): cổng khoá khi bản đồ chưa gần đủ; mở thì chơi bằng câu lạ, không đáp án
// trong trận, xong có khả năng qua + chữa bài; đề đã mở không dùng lại; qua cổng = Đạt trong app. Chế độ chơi thử mở cổng sớm để test.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const BANNED = /(?<![\p{L}])(thi|kiểm tra|bài dò|chẩn đoán|làm bài)(?![\p{L}])/iu;
// Chỉ quét khung màn hình (nhãn, tiêu đề, nút, lời dẫn), không quét nội dung câu học (nghĩa tiếng Việt của từ "test" là "bài kiểm tra").
const chrome = (page: Page) => page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .muted, #app .hint').allInnerTexts().then(x => x.join('\n'));

async function setup(page: Page, q = ''): Promise<void> {
  await page.goto('/' + q);
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a2', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page);
}

test('Cổng khoá khi bản đồ chưa gần đủ: thẻ 🎯 nói rõ "chưa phải kết luận", có thang khu', async ({ page, errors }) => {
  await page.evaluate(() => { try { localStorage.setItem('el-playtest', '0'); } catch { /* */ } }).catch(() => {});
  await setup(page, '?playtest=0');
  const bar = page.locator('.gbar');
  await expect(bar).toContainText('Cổng khu A2 còn khoá');
  await expect(bar).toContainText(/📍A2/);
  await expect(page.getByRole('button', { name: /Vào trận cổng/ })).toHaveCount(0);
  await page.evaluate(() => (window as any).eval("go('goal',{er:'gate'})"));
  await expect(page.getByRole('heading', { name: 'Cổng còn khoá' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Trận cổng: chơi hết bằng câu lạ, không đáp án trong trận; kết quả có khả năng qua + chữa bài; đề đã mở không mở lại', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, '?playtest=1');
  await page.getByRole('button', { name: /Vào trận cổng khu A2/ }).click();
  await expect(page.getByRole('heading', { name: 'Cổng đã mở' })).toBeVisible();
  await page.getByRole('button', { name: /▶ Vào trận cổng/ }).click();
  for (let i = 0; i < 10; i++) {
    const form = page.locator('form[data-eform="gtnext"]');
    if (!(await form.isVisible().catch(() => false))) { await page.waitForTimeout(300); if (!(await form.isVisible())) break; }
    expect(await chrome(page)).not.toMatch(BANNED);
    await expect(page.locator('.fb')).toHaveCount(0);   // không phản hồi đúng / sai trong trận
    if (i === 0) {
      const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
      await noHorizontalScroll(page);
    }
    const fs = form.locator('fieldset');
    for (let k = 0; k < await fs.count(); k++) await fs.nth(k).locator('input[type="radio"]').first().check();
    await form.getByRole('button').last().click();
  }
  await expect(page.getByRole('heading', { name: /Trận cổng xong|Cổng đã mở!/ })).toBeVisible();
  await expect(page.locator('.gres')).toContainText('khả năng qua');
  await expect(page.getByText('Xem chữa bài từng câu')).toBeVisible();
  await page.screenshot({ path: 'test-results/gate-end.png', fullPage: true });
  const gg = await page.evaluate(() => (window as any).eval('st').e.gg);
  expect(Object.keys(gg.done)).toEqual(['a2-1']); expect(gg.seen).toContain('a2-1');
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.snap.some((s: any) => s.kind === 'readiness' && /^GATE:/.test(s.dec)))).toBe(true);
  // Đề đã mở không dùng lại: lần sau là đề song song a2-2 (nếu chưa qua).
  await page.getByRole('button', { name: 'Về sảnh chơi' }).click();
  const st = await page.evaluate(() => (window as any).eval('st').e.gg.done['a2-1'].passed);
  if (!st) { await page.evaluate(() => (window as any).eval("go('goal',{er:'gate'})")); await page.getByRole('button', { name: /▶ Vào trận cổng/ }).click(); await expect(page.locator('form[data-eform="gtnext"] legend').first()).toBeVisible(); expect(await page.evaluate(() => (window as any).eval('st').e.gg.seen)).toContain('a2-2'); }
  expect(errors).toEqual([]);
});

test('Chứng chỉ tuỳ chọn ở trang mục tiêu: chỉ hiện khi bật, ghi điểm kèm dự đoán của app', async ({ page, errors }) => {
  await setup(page, '?playtest=0');
  await page.evaluate(() => (window as any).eval("go('goal',{er:'goal/cefr-a2'})"));
  await page.getByRole('button', { name: 'Tôi muốn thi lấy chứng chỉ' }).click();
  await page.getByLabel('Điểm').fill('128');
  await page.getByRole('button', { name: 'Ghi điểm' }).click();
  await expect(page.locator('#app')).toContainText(/Đề mẫu chính thức: 128 \(đạt A2\)/);
  const gg = await page.evaluate(() => (window as any).eval('st').e.gg);
  expect(gg.cert).toBe(1); expect(gg.ext[0]).toMatchObject({ score: 128, pass: true, src: 'sample' });
  expect(errors).toEqual([]);
});
