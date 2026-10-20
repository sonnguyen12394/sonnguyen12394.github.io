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

// v161 Viết / Nói: máy tìm ý bằng từ khoá (không tự đánh dấu). Test viết bài từ chính từ khoá của bài (EM.peek().kw);
// bài Nói chọn "gõ lại" (máy test không nói được), kết quả ghi "gõ lại".
async function wsAnswer(page: Page): Promise<void> {
  const ws = page.locator('form[data-eform="gtws"]');
  const kw: string[][][] = await page.evaluate(() => (window as any).eval('EM').peek()?.kw ?? []);
  const typeBtn = ws.locator('[data-e="gttype"]');
  if (await typeBtn.count()) { await typeBtn.click(); await expect(ws.locator('textarea')).not.toHaveAttribute('readonly'); }
  const word = (g: string[]): string => g[0] === '@past' ? 'visited my aunt and walked' : /^@n\d+$/.test(g[0]!) ? g.slice(1, 1 + Number(g[0]!.slice(2))).join(', ') : (g.find(x => x !== '@num') ?? '3').replace(/\$$/, '');
  const text = kw.map(idea => `I said ${idea.map(word).join(' and ')} then.`).join(' ') + ' Then I went home because it was late. In the end I was very happy.';
  await ws.locator('textarea').fill(text);
  await ws.getByRole('button').last().click();
}

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
  await expect(bar).toContainText('Thi chuyển cấp A2 chưa mở: mở khi 📘 Học ≥ 100%');   // v176 chuẩn Học 100% · Nhớ 80%   // v154 hai thanh Học / Nhớ
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
  // v140 phần Viết (2 bài) + Nói (1 bài): gõ bài; v161 không còn ô tự đánh dấu, máy tìm ý; không chấm ngay.
  for (let k = 0; k < 3; k++) {
    const ws = page.locator('form[data-eform="gtws"]');
    await expect(ws).toBeVisible();
    expect(await chrome(page)).not.toMatch(BANNED);
    if (k === 0) { const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze(); expect(r.violations.map(v => v.id)).toEqual([]); await noHorizontalScroll(page); }
    await expect(ws.locator('input[type="checkbox"]')).toHaveCount(0);
    await wsAnswer(page);
  }
  await expect(page.getByRole('heading', { name: /Đã làm xong bài|Lên cấp B1!/ })).toBeVisible();
  await expect(page.locator('.gres')).toContainText('khả năng qua');
  await expect(page.locator('.gres')).toContainText(/Viết: \d+% tiêu chí[\s\S]*Nói \(gõ lại, chưa máy nghe\): \d+% tiêu chí/);
  await expect(page.locator('.gres')).toContainText('Ý: ✓');   // v161 ✓ / ✗ từng ý máy tìm thấy
  await expect(page.locator('.gres')).toContainText('Đọc + Nghe');   // v158 từng kỹ năng ✓ / ✗
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
  for (let k = 0; k < 3; k++) await wsAnswer(page);   // v158 Viết / Nói vào phán quyết: đủ ý mới đạt ≥ 60% (v161 máy tìm ý)
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
    for (let k = 0; k < 3; k++) await wsAnswer(page);
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

test('v141 🎲 Thử sức từng kỹ năng ở 🎯 Mục tiêu: bài ngắn sinh mới, ra "Đúng x/y", không vào mức thuộc / thi chuyển cấp, làm lại là bài khác', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  const ledBefore = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  const tryLis = async (): Promise<string> => {
    const form = page.locator('form[data-eform="gtnext"]');
    await expect(page.locator('#app .eyebrow').first()).toContainText('🎲 Thử sức Nghe A2');
    await expect(page.locator('[data-e="gttts"]')).toBeVisible();
    const keys = await page.evaluate(() => (window as any).eval('EM').peek()?.keys ?? {});
    const ids = Object.keys(keys).sort().join(',');
    for (const [id, k] of Object.entries(keys)) await form.locator(`input[name="${id}"][value="${k}"]`).check();
    await form.getByRole('button').last().click();
    return ids + JSON.stringify(Object.values(keys));
  };
  await page.evaluate(() => (window as any).eval("go('aim')"));
  await page.locator('#app [data-e="trystart"][data-sk="lis"]').click();
  await expect(page.locator('form[data-eform="gtnext"]')).toBeVisible();
  let ans = '';
  for (let i = 0; i < 3 && (await page.locator('form[data-eform="gtnext"]').count()); i++) ans += await tryLis();
  await expect(page.locator('#app h1')).toHaveText(/^Đúng (\d+)\/\1 \(100%\)$/);
  expect(await chrome(page)).not.toMatch(BANNED);
  await noHorizontalScroll(page);
  const st = await page.evaluate(() => { const e = (window as any).eval('st').e; return { tries: e.gg.tries, done: Object.keys(e.gg.done ?? {}), led: e.ev.led.length }; });
  expect(st.tries).toHaveLength(1); expect(st.tries[0]).toMatchObject({ lv: 'A2', sk: 'lis' }); expect(st.tries[0].ok).toBe(st.tries[0].n);
  expect(st.done).toEqual([]); expect(st.led).toBe(ledBefore);   // chỉ là phép đo: không ghi bằng chứng, không vào thi chuyển cấp
  // Thử bài mới: câu khác (hạt mới)
  const first = await page.evaluate(() => (window as any).eval('st').e.gg.tries.length);
  await page.getByRole('button', { name: /🎲 Thử bài mới/ }).click();
  await expect(page.locator('form[data-eform="gtnext"]')).toBeVisible();
  const script = await page.locator('#app').innerText();
  let ans2 = '';
  for (let i = 0; i < 3 && (await page.locator('form[data-eform="gtnext"]').count()); i++) ans2 += await tryLis();
  expect(first).toBe(1); expect(script.length).toBeGreaterThan(0); expect(ans2).not.toEqual(ans);
  // Viết: một bài ngắn, có % tiêu chí
  await page.evaluate(() => (window as any).eval("go('aim')"));
  await page.locator('#app [data-e="trystart"][data-sk="wr"]').click();
  const ws = page.locator('form[data-eform="gtws"]');
  await expect(ws).toBeVisible();
  await ws.locator('textarea').fill('Hi Ana! Can you water my plants this weekend, please? I will be back on Sunday evening. Thank you very much!');
  await ws.getByRole('button').last().click();
  await expect(page.locator('#app')).toContainText(/✍️ Viết: \d+% tiêu chí/);
  expect(await page.evaluate(() => (window as any).eval('st').e.gg.tries.length)).toBe(3);
  // Từ vựng / Phát âm: câu theo nút của đúng kỹ năng đó
  for (const [sk, h] of [['voc', 'Words and grammar'], ['pro', 'Sounds']]) {
    await page.evaluate(() => (window as any).eval("go('aim')"));
    await page.locator(`#app [data-e="trystart"][data-sk="${sk}"]`).click();
    await expect(page.locator('#app h2').first()).toHaveText(h!);
  }
  expect(errors).toEqual([]);
});

test('v158 So với bài mẫu Cambridge luôn hiện ở trang mục tiêu: ghi số câu đúng Đọc / Nghe + điểm thang, so với app; soát câu: đánh dấu lỗi được đếm, câu có sẵn bị lỗi không ra nữa', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await setup(page, '?playtest=0');
  await page.evaluate(() => (window as any).eval("go('goal',{er:'goal/cefr-a2'})"));
  const box = page.locator('#app [aria-label="So với bài mẫu Cambridge"]');
  await expect(box).toBeVisible();
  await box.getByLabel('Đọc đúng / 30').fill('22');
  await box.getByLabel('Nghe đúng / 25').fill('18');
  await box.getByLabel('Điểm thang Cambridge (nếu có)').fill('128');
  await box.getByRole('button', { name: 'Ghi', exact: true }).click();
  await expect(box).toContainText(/Bài mẫu chính thức: 128 điểm thang Cambridge \(đạt A2\)/);
  await expect(box).toContainText('Đọc: bài mẫu 22/30');
  const gg = await page.evaluate(() => (window as any).eval('st').e.gg);
  expect(gg.ext[0]).toMatchObject({ score: 128, pass: true, src: 'sample', rr: 22, lr: 18 });
  // Soát câu: bài mẫu có đáp án; đánh dấu câu đầu có lỗi kèm ghi chú
  await box.getByRole('button', { name: /Soát câu Thi chuyển cấp/ }).click();
  await expect(page.getByRole('heading', { name: 'Soát câu', level: 1 })).toBeVisible({ timeout: 30000 });
  const first = page.locator('#app [data-e="gtrevmark"][data-v="bad"]').first(), id = (await first.getAttribute('data-id'))!;
  await page.locator(`#rvn-${id}`).fill('Hai đáp án cùng đúng');
  await first.click();
  await expect(page.locator('#app')).toContainText('Đã soát 1 câu, 1 câu có lỗi');
  const rv = await page.evaluate((k: string) => (window as any).eval('st').e.gg.rev[k], id);
  expect(rv).toMatchObject({ ok: false, note: 'Hai đáp án cùng đúng' });
  const ax = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

