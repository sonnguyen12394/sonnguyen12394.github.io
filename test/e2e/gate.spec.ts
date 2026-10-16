import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v111 trận cổng cuối khu, v140 "Thi chuyển cấp" (Đọc + Nghe + Viết + Nói, qua thì tự lên cấp) (SPEC "Mô hình học v111" §3–§4): cổng khoá khi bản đồ chưa gần đủ; mở thì chơi bằng câu lạ, không đáp án
// trong trận, xong có khả năng qua + chữa bài; đề đã mở không dùng lại; qua cổng = Đạt trong app. Chế độ chơi thử mở cổng sớm để test.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const BANNED = /(?<![\p{L}])(thi|kiểm tra|bài dò|chẩn đoán|làm bài)(?![\p{L}])/iu;   // trừ "thi chuyển cấp" (người sáng lập, v140)
// Chỉ quét khung màn hình (nhãn, tiêu đề, nút, lời dẫn), không quét nội dung câu học (nghĩa tiếng Việt của từ "test" là "bài kiểm tra").
const chrome = (page: Page) => page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .muted, #app .hint').allInnerTexts().then(x => x.join('\n').replace(/thi chuyển cấp/gi, ''));

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

test('Thi chuyển cấp chưa mở khi bản đồ chưa gần đủ: thẻ 🎯 nói rõ "chưa phải kết luận", có thang khu', async ({ page, errors }) => {
  await page.evaluate(() => { try { localStorage.setItem('el-playtest', '0'); } catch { /* */ } }).catch(() => {});
  await setup(page, '?playtest=0');
  await expect(page.getByRole('button', { name: /Vào thi chuyển cấp/ })).toHaveCount(0);
  await page.locator('.gbar.slim').click();   // v117: chi tiết cổng nằm ở bản đầy đủ, đầu trang mục tiêu
  const bar = page.locator('.gbar');
  await expect(bar).toContainText('Thi chuyển cấp A2 chưa mở: mở khi 80%');
  await expect(bar).toContainText(/📍A2/);
  await expect(page.getByRole('button', { name: /Vào thi chuyển cấp/ })).toHaveCount(0);
  await page.evaluate(() => (window as any).eval("go('goal',{er:'gate'})"));
  await expect(page.getByRole('heading', { name: 'Chưa mở' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Thi chuyển cấp: Đọc + Nghe bằng câu lạ, rồi Viết + Nói; không đáp án trong bài; kết quả có khả năng qua + Viết / Nói + chữa bài; qua thì lên cấp; bộ đã mở không mở lại', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, '?playtest=1');
  await page.getByRole('button', { name: /Vào thi chuyển cấp A2/ }).click();
  await expect(page.getByRole('heading', { name: 'Đã mở' })).toBeVisible();
  await page.getByRole('button', { name: /▶ Vào thi chuyển cấp/ }).click();
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
  // v140 phần Viết (2 bài) + Nói (1 bài): gõ bài, tự đánh dấu ý; không chấm ngay.
  for (let k = 0; k < 3; k++) {
    const ws = page.locator('form[data-eform="gtws"]');
    await expect(ws).toBeVisible();
    expect(await chrome(page)).not.toMatch(BANNED);
    if (k === 0) { const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); expect(r.violations.map(v => v.id)).toEqual([]); await noHorizontalScroll(page); }
    await ws.locator('textarea').fill('Hi Sam! Could I borrow your bike on Saturday, because I need it to visit my grandmother in the countryside? I will give it back on Sunday evening. Thank you so much! Best wishes, Linh.');
    await ws.locator('input[type="checkbox"]').first().check();
    await ws.getByRole('button').last().click();
  }
  await expect(page.getByRole('heading', { name: /Đã làm xong bài|Lên cấp B1!/ })).toBeVisible();
  await expect(page.locator('.gres')).toContainText('khả năng qua');
  await expect(page.locator('.gres')).toContainText(/Viết: \d+% tiêu chí .*Nói: \d+% tiêu chí/);
  await expect(page.getByText('Xem chữa bài Đọc + Nghe từng câu')).toBeVisible();
  await page.screenshot({ path: 'test-results/gate-end.png', fullPage: true });
  const gg = await page.evaluate(() => (window as any).eval('st').e.gg);
  // v141 bài sinh theo tiêu chí: mã bài a2-g<hạt>, lưu hạt + số vững lúc làm; câu có sẵn đã ra ghi vào used.
  const key = Object.keys(gg.done)[0]!;
  expect(Object.keys(gg.done)).toHaveLength(1); expect(key).toMatch(/^a2-g\d+$/);
  expect(typeof gg.done[key].seed).toBe('number'); expect(typeof gg.done[key].sol).toBe('number');
  expect(gg.done[key].ws.map((w: any) => w.kind)).toEqual(['w', 'w', 's']);
  if (gg.done[key].passed) expect(await page.evaluate(() => (window as any).eval('st').e.goals[0].id)).toBe('cefr-b1');   // qua thì tự lên cấp
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.snap.some((s: any) => s.kind === 'readiness' && /^GATE:/.test(s.dec)))).toBe(true);
  // Rớt thì làm lại sau 3 ngày VÀ khi vững thêm: màn thi chuyển cấp nói rõ còn bao lâu (chế độ chơi thử tắt để thấy luật thật).
  await page.getByRole('button', { name: '⚔️ Về sảnh' }).click();
  const passed = await page.evaluate(k => (window as any).eval('st').e.gg.done[k].passed, key);
  if (!passed) { await page.evaluate(() => { try { localStorage.setItem('el-playtest', '0'); } catch { /* */ } (window as any).eval("go('goal',{er:'gate'})"); }); await expect(page.locator('#app')).toContainText(/còn 3 ngày/); }
  expect(errors).toEqual([]);
});

test('v140 qua thi chuyển cấp A1 (làm đúng hết) → tự lên cấp A2: màn "Lên cấp A2!", đích chính là A2, Mục tiêu theo A2', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/?playtest=1');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }]; st.e.gf = { runs: 1, day: w.eval('today()') - 1 }; w.eval('save()'); w.eval("go('games')"); });
  await toLobby(page);
  await page.evaluate(() => (window as any).eval("go('goal',{er:'gate'})"));
  await page.getByRole('button', { name: /▶ Vào thi chuyển cấp/ }).click();
  for (let i = 0; i < 12; i++) {
    const form = page.locator('form[data-eform="gtnext"]');
    if (!(await form.isVisible().catch(() => false))) { await page.waitForTimeout(300); if (!(await form.isVisible())) break; }
    const keys = await page.evaluate(() => (window as any).eval('EM').peek()?.keys ?? {});
    for (const [id, k] of Object.entries(keys)) await form.locator(`input[name="${id}"][value="${k}"]`).check();
    await form.getByRole('button').last().click();
  }
  for (let k = 0; k < 3; k++) {
    const ws = page.locator('form[data-eform="gtws"]');
    await ws.locator('textarea').fill('Hi Ana! Can you water my plants this weekend, please? I will be back on Sunday evening. Thank you very much, you are a great neighbour! See you soon.');
    await ws.locator('input[type="checkbox"]').first().check();
    await ws.getByRole('button').last().click();
  }
  await expect(page.getByRole('heading', { name: '🎉 Lên cấp A2!' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).eval('st').e.goals[0].id)).toBe('cefr-a2');
  await page.getByRole('button', { name: /🎯 Xem mục tiêu A2/ }).click();
  await expect(page.locator('#app')).toContainText('Cần đạt để qua A2');
  await page.locator('[data-e="aimlv"][data-lv="A1"]').click();
  await expect(page.locator('#app')).toContainText('✓ Đã qua thi chuyển cấp A1');
  expect(errors).toEqual([]);
});

test('v141 bài sinh theo tiêu chí: hai lần mở ra hai bài khác nhau; đủ phần Đọc, Từ vựng + Ngữ pháp, Nghe (máy đọc)', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page, '?playtest=1');
  const run = async (): Promise<{ titles: string[]; first: string }> => {
    await page.evaluate(() => (window as any).eval("go('goal',{er:'gate'})"));
    await page.getByRole('button', { name: /▶ Vào thi chuyển cấp/ }).click();
    const titles: string[] = []; let first = '';
    for (let i = 0; i < 12; i++) {
      const form = page.locator('form[data-eform="gtnext"]');
      if (!(await form.isVisible().catch(() => false))) { await page.waitForTimeout(300); if (!(await form.isVisible())) break; }
      const t = await page.locator('#app h2').first().innerText(); titles.push(t);
      if (i === 0) first = await page.locator('#app .reading').first().innerText();
      if (t === 'Short conversations') await expect(page.locator('[data-e="gttts"]')).toBeVisible();
      const keys = await page.evaluate(() => (window as any).eval('EM').peek()?.keys ?? {});
      for (const [id, k] of Object.entries(keys)) await form.locator(`input[name="${id}"][value="${k}"]`).check();
      await form.getByRole('button').last().click();
    }
    for (let k = 0; k < 3; k++) { const ws = page.locator('form[data-eform="gtws"]'); await ws.locator('textarea').fill('I usually play football at the weekend with my friends, and last weekend we went to the park. Next month I am going to visit my aunt.'); await ws.getByRole('button').last().click(); }
    await expect(page.locator('.gres')).toBeVisible();
    await page.evaluate(() => (window as any).eval("go('play')"));
    return { titles, first };
  };
  const a = await run();
  expect(a.titles).toEqual(expect.arrayContaining(['Notices and messages', 'Words and grammar', 'Short conversations']));
  // làm lại (chế độ chơi thử bỏ qua thời gian chờ): bài mới, khác bài trước; đích có thể đã lên B1 nếu qua, nên đặt lại A2
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.e.goals = [{ id: 'cefr-a2', version: '1.0', since: w.eval('today()'), date: null }]; st.e.gg = { done: {}, used: st.e.gg?.used ?? [] }; w.eval('save()'); });
  const b = await run();
  expect(b.first).not.toEqual(a.first);
  expect(Object.keys(await page.evaluate(() => (window as any).eval('st').e.gg.done))).toHaveLength(1);
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
