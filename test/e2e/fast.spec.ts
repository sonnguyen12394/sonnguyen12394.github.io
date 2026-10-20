import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v165 ⚡ Học nhanh (người sáng lập 19/10/2026): cho người học lâu năm nhưng mất gốc, không muốn học lại từ đầu.
// Vượt chặng (làm bài trước, đúng hết là qua) → câu sai vào hàng vá → vá đúng chỗ (kèm gốc A1 của điểm ngữ pháp). ▶ Hôm nay theo đường đang đi.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function open(page: Page, view = 'nd', lv = 'A2'): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(([v, l]) => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval(`ui.ndLv='${l}'`); w.eval('save()'); w.eval('emLoad()'); w.eval(`go('${v}')`); }, [view, lv] as const);
  await page.waitForFunction(() => { const w = window as any; return !!(w.eval('EM') && w.eval('EM').parts && w.eval('EM').parts('cefr-a2')); }, null, { timeout: 30000 });
  await page.evaluate(() => (window as any).eval('render()'));
}
// Trả lời hết lượt đang mở (từ hoặc ngữ pháp): bad(i) = true thì câu thứ i sai.
async function finish(page: Page, g: boolean, badIdx: number[] = []): Promise<void> {
  await page.evaluate(([gg, bad]) => { const w = window as any;
    for (let i = 0; i < 200; i++) { const s = gg ? w.eval('ui').gs : w.eval('ui').sess; if (!s || s.i >= s.q.length) break;
      const ok = !(bad as number[]).includes(s.i); if (gg) { w.eval('gAnswer')(ok, {}); w.eval('gNext')(); } else { w.eval('answer')(ok, {}); w.eval('next')(); } } }, [g, badIdx] as const);
}
const F = (page: Page) => page.evaluate(() => JSON.parse(JSON.stringify((window as any).eval('FST()'))));

test('v165 tab ⚡ Học nhanh: thanh dưới, lời giới thiệu cho người mất gốc, bảng Vượt chặng; chưa chọn đường → ▶ Hôm nay theo 📘 Học bài (v171); WCAG AA, 390 px', async ({ page, errors }) => {
  await open(page);
  await expect(page.locator('#bnav [data-go="nd"]')).toContainText('Học nhanh');
  await expect(page.getByRole('heading', { name: 'Học nhanh', level: 1 })).toBeVisible();
  await expect(page.locator('#app')).toContainText('mất gốc');
  await expect(page.locator('#app .fastp')).toContainText('Đo nền');
  await expect(page.locator('#app .fastp [data-act="fastgo"]')).toContainText('Chặng từ A1 · Unit 1–10');
  const st = await page.evaluate(() => (window as any).eval('dayPlan()').steps.map((x: any) => ({ k: x.k, at: x.at, why: x.why })));
  expect(st.some((x: any) => /fastgo/.test(x.at)), 'v171 chưa chọn đường = 📘 Học bài: không đưa chặng').toBe(false);
  await expect(page.locator('#app .dayplan')).toContainText('Đường đang đi');
  await noHorizontalScroll(page);
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('v165 vượt chặng từ: unit đúng hết → qua (tạm vững, từ vào lịch ôn +3 ngày); câu sai → vá đúng từ đó; làm chặng không tự đổi đường (v171)', async ({ page, errors }) => {
  await open(page);
  await page.locator('#app .fastp [data-act="fastgo"]').click();
  const q = await page.evaluate(() => { const s = (window as any).eval('ui').sess; return { kind: s.kind, n: s.q.length, w: s.q.map((x: any) => x.wid) }; });
  expect(q.kind).toBe('fast'); expect(q.n).toBe(20);   // 10 unit × 2 câu
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  const typed = await page.evaluate(() => (window as any).eval('ui').sess.q.filter((x: any) => ['rct', 'ctt', 'fmt', 'dic', 'spl'].includes(x.type)).length);
  expect(typed, 'mỗi unit có ít nhất 1 câu tự gõ').toBeGreaterThanOrEqual(10);
  await finish(page, false, [0]);   // câu đầu sai
  await expect(page.locator('#app h1')).toContainText('Qua 9/10 unit');
  await expect(page.locator('#app')).toContainText('Vá chỗ lủng');
  const r = await page.evaluate((wid: string) => { const w = window as any, U = w.eval('U'), W = w.eval('W'), t = w.eval('today()'), UO = w.eval('UNIT_OF');
    const bad = UO[wid].id, us = w.eval('UNITS').filter((u: any) => u.level === 'A1').slice(0, 10);
    const ok = us.find((u: any) => u.id !== bad);
    return { bad: U(bad).passed, fq: U(bad).fq === t, ok: U(ok.id).passed, skipped: U(ok.id).skipped, due: W(ok.words[5].id).due - t, nPass: us.filter((u: any) => U(u.id).passed).length }; }, q.w[0]);
  expect(r).toMatchObject({ bad: false, fq: true, ok: true, skipped: true, due: 3, nPass: 9 });
  const f = await F(page);
  expect(f.path).toBeUndefined();   // v171 làm chặng không tự đổi đường expect(f.ch['w:A1:0']).toMatchObject({ ok: 9, n: 10 });
  expect(f.gap).toEqual([expect.objectContaining({ k: 'w', id: q.w[0] })]);
  // chặng kế là chặng khác
  await expect(page.locator('#app [data-act="fastgo"]')).toContainText('Unit 11–20');
  expect(errors).toEqual([]);
});

test('v170 góp ý người học: chặng ⚡ báo đúng / sai + âm thanh ngay từng câu, không có nút "Tôi chưa biết" / "Mình đang đoán"; ô gõ màn vá ≥ 16px (iPhone không tự phóng to)', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.__sfx = []; w.eval('sfx = k => { window.__sfx.push(k); }'); });
  await page.locator('#app .fastp [data-act="fastgo"]').click();
  await expect(page.locator('#app [data-act="dunno"]')).toHaveCount(0);
  await expect(page.locator('#app [data-act="guess"]')).toHaveCount(0);
  await page.evaluate(() => { const w = window as any; w.eval('answer')(false, {}); });
  await expect(page.locator('#app .fb.bad')).toContainText('Đáp án');
  await expect(page.locator('#app .fb.bad')).toContainText('Vá chỗ lủng');
  await expect(page.locator('#app .fb.bad')).not.toContainText('hỏi lại cuối lượt');
  expect(await page.evaluate(() => (window as any).__sfx)).toEqual(['bad']);
  await page.evaluate(() => { const w = window as any; w.eval('next')(); w.eval('answer')(true, {}); });
  await expect(page.locator('#app .fb.good')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__sfx)).toEqual(['bad', 'ok']);
  await page.evaluate(() => { const w = window as any; w.eval('next')(); });
  await finish(page, false);
  await page.locator('#app [data-act="fixgo"]').first().click();
  await page.locator('#app [data-act="fixq"]').click();
  const fs = await page.locator('#fixin').evaluate(e => parseFloat(getComputedStyle(e).fontSize));
  expect(fs).toBeGreaterThanOrEqual(16);
  expect(errors).toEqual([]);
});

test('v165 vá chỗ lủng: thẻ ngắn rồi một câu tự gõ; đúng → hết lủng, unit qua; sai → vá lại từ ngày mai', async ({ page, errors }) => {
  await open(page);
  const u = await page.evaluate(() => { const w = window as any, u = w.eval('UNITS').find((x: any) => x.id === 'a1-u1');
    w.eval('U')(u.id).fq = w.eval('today()'); w.eval('gapAdd')('w', u.words[0].id, u.id); w.eval('gapAdd')('w', u.words[1].id, u.id); w.eval('save()'); w.eval('render()');
    return { id: u.id, a: u.words[0].word, b: u.words[1].word }; });
  await expect(page.locator('#app')).toContainText('2 chỗ cần vá hôm nay');
  await page.locator('#app [data-act="fixgo"]').first().click();
  await expect(page.locator('#app .eyebrow').first()).toContainText('Vá chỗ lủng');
  await expect(page.locator('#app h2').first()).toContainText(u.a);   // thẻ: từ, nghĩa, câu ví dụ
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  await page.locator('#app [data-act="fixq"]').click();
  await page.locator('#fixin').fill(u.a);
  await page.locator('#app [data-act="fixok"]').click();
  await expect(page.locator('#app .fb.good')).toContainText('Đúng');
  expect(await page.evaluate((id: string) => (window as any).eval('U')(id).passed, u.id)).toBe(false);   // còn 1 chỗ lủng của unit
  await page.locator('#app [data-act="fixnext"]').click();
  await page.locator('#app [data-act="fixq"]').click();
  await page.locator('#fixin').fill('zzz');
  await page.locator('#app [data-act="fixok"]').click();
  await expect(page.locator('#app .fb.bad')).toContainText('vá lại từ ngày mai');
  await page.locator('#app [data-act="fixnext"]').click();
  await expect(page.locator('#app h1')).toContainText('Vá xong 1/2 chỗ');
  let f = await F(page);
  expect(f.gap.map((x: any) => x.d - f.gap[0].d)).toEqual([0]); expect(f.gap.length).toBe(1);
  expect(await page.evaluate(() => (window as any).eval('gapDue()').length)).toBe(0);   // sai hôm nay → mai mới vá
  // ngày mai: vá đúng chỗ còn lại → unit qua
  await page.evaluate(() => { const w = window as any; w.eval('st').fast.gap.forEach((x: any) => { x.d -= 1; }); w.eval('fixStart()'); });
  await page.locator('#app [data-act="fixq"]').click();
  await page.locator('#fixin').fill(u.b);
  await page.locator('#app [data-act="fixok"]').click();
  await page.locator('#app [data-act="fixnext"]').click();
  await expect(page.locator('#app')).toContainText('Qua thêm 1 unit');
  expect(await page.evaluate((id: string) => { const U = (window as any).eval('U')(id); return [U.passed, U.skipped]; }, u.id)).toEqual([true, true]);
  f = await F(page); expect(f.gap).toEqual([]);
  expect(errors).toEqual([]);
});

test('v165 chặng ngữ pháp: điểm đúng hết → qua; sai điểm A2 → vá điểm đó và hỏi lại gốc A1 trước (gốc đúng thì bỏ qua, không phải học)', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("fastStart('g:A2:0')"));
  const n = await page.evaluate(() => (window as any).eval('ui').gs.q.length);
  expect(n).toBe(14);   // 7 điểm × 2 câu
  const gid = await page.evaluate(() => (window as any).eval('ui').gs.q[0].gid as string);
  const idx = await page.evaluate((g: string) => (window as any).eval('ui').gs.q.map((x: any, i: number) => x.gid === g ? i : -1).filter((i: number) => i >= 0), gid);
  await finish(page, true, [idx[0]]);
  await expect(page.locator('#app h1')).toContainText('Qua 6/7 điểm ngữ pháp');
  const roots = await page.evaluate((g: string) => (window as any).eval('G_ROOT')[g] || [], gid);
  expect(roots.length).toBeGreaterThan(0);
  const f = await F(page);
  expect(f.gap.map((x: any) => [x.id, !!x.root])).toEqual([...roots.map((r: string) => [r, true]), [gid, false]]);
  expect(await page.evaluate((g: string) => (window as any).eval('G')(g).passed, gid)).toBe(false);
  // vá: gốc hỏi trước (không có thẻ); trả lời đúng → bỏ qua ngay
  await page.locator('#app [data-act="fixgo"]').click();
  await expect(page.locator('#app')).toContainText('Kiểm phần gốc');
  await expect(page.locator('#app [data-act="fixq"]')).toHaveCount(0);
  const a = await page.evaluate(() => (window as any).eval('ui').fix.ex.accept[0] as string);
  await page.locator('#fixin').fill(a);
  await page.locator('#app [data-act="fixok"]').click();
  await expect(page.locator('#app .fb.good')).toBeVisible();
  expect((await F(page)).gap.some((x: any) => x.id === roots[0])).toBe(false);
  // gốc sai → xem phần gốc (thẻ) rồi làm lại một lần
  if (roots.length > 1) {
    await page.locator('#app [data-act="fixnext"]').click();
    await page.locator('#fixin').fill('zzz zzz');
    await page.locator('#app [data-act="fixok"]').click();
    await page.locator('#app [data-act="fixnext"]', { hasText: 'Xem phần gốc' }).click();
    await expect(page.locator('#app')).toContainText('Phần gốc A1 của');
  }
  expect(errors).toEqual([]);
});

test('v165 ▶ Hôm nay theo đường: 📘 → không đưa chặng; ⚡ → chặng trước học mới; có chỗ lủng → bước vá; đổi đường bằng nút', async ({ page, errors }) => {
  await open(page, 'lib');
  const steps = () => page.evaluate(() => (window as any).eval('dayPlan()').steps.map((x: any) => x.k + '|' + x.at));
  await page.evaluate(() => { const w = window as any; w.eval('FST()').path = 'normal'; w.eval('render()'); });
  expect((await steps()).some((s: string) => s.includes('fastgo'))).toBe(false);
  await page.locator('#app .dayplan [data-act="fastpath"][data-v="fast"]').click();
  expect(await page.evaluate(() => (window as any).eval('FST()').path)).toBe('fast');
  const s1 = await steps();
  expect(s1.find((s: string) => s.startsWith('gap|'))).toContain('fastgo');
  await page.evaluate(() => { const w = window as any; w.eval('gapAdd')('w', 'breakfast', 'a1-u1'); });
  const s2 = await steps();
  expect(s2.findIndex((s: string) => s.startsWith('fix|'))).toBeLessThan(s2.findIndex((s: string) => s.startsWith('gap|')));
  // chặng sai nhiều ở lần đầu → gợi ý Học bài; bấm thì đường thành 📘
  await page.evaluate(() => { const w = window as any; w.eval('st').fast = {}; w.eval("fastStart('w:A1:0')"); });
  await finish(page, false, Array.from({ length: 20 }, (_, i) => i));
  await expect(page.locator('#app h1')).toContainText('Qua 0/10 unit');
  await page.locator('#app [data-act="fastpath"][data-v="normal"]').click();
  await expect(page.locator('#bnav [data-go="lib"]')).toHaveAttribute('aria-current', 'page');
  expect(await page.evaluate(() => (window as any).eval('FST()').path)).toBe('normal');
  expect(errors).toEqual([]);
});

test('v165 đọc / nghe nguyên bài: đạt ≥ 80% là qua ngay (không cần ngày thứ hai); nghĩa từ sai → vào hàng vá', async ({ page, errors }) => {
  await open(page, 'nd', 'A1');
  const uid = 'a1-u2';
  await page.evaluate((u: string) => (window as any).eval('ndRead')(u, false), uid);
  const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read, u = w.eval('UNITS').find((x: any) => x.id === R.uid);
    return { uid: R.uid, q: (R.rd || u.reading).qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)), wid: R.vq[0] && R.vq[0].wid }; });   // v164 kho bài: bài có thể thuộc unit khác
  for (const [i, k] of R.q.entries()) await page.locator(`[data-rpick="${i}:${k}"]`).click();
  for (const [j, k] of R.v.entries()) await page.locator(`[data-ndv="${j}:${j === 0 && R.v.length >= 4 ? (k + 1) % 3 : k}"]`).click();
  for (const [j, k] of R.g.entries()) await page.locator(`[data-ndg="${j}:${k}"]`).click();
  await page.locator('[data-act="rsubmit"]').click();
  const r = await page.evaluate((u: string) => { const w = window as any; return { passed: w.eval('U')(u).passed, gap: w.eval('FST()').gap.map((x: any) => x.id) }; }, R.uid);
  if (R.v.length >= 4) { expect(r.gap).toContain(R.wid); }
  expect(r.passed).toBe(true);
  await expect(page.locator('#app .fb.good')).toContainText('nhờ đọc hiểu');
  expect(errors).toEqual([]);
});

test('v165 dữ liệu: st.fast qua tải lại (làm sạch) và gộp hai máy giữ chặng + hàng vá', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, mig = w.eval('migrate'), merge = w.eval('mergeState'), st = w.eval('st');
    const a = JSON.parse(JSON.stringify(st)), b = JSON.parse(JSON.stringify(st));
    a.fast = { path: 'fast', ch: { 'w:A1:0': { d: 1, ok: 9, n: 10 } }, gap: [{ k: 'w', id: 'breakfast', u: 'a1-u1', d: 5 }] };
    b.fast = { path: null, ch: { 'g:A1:0': { d: 2, ok: 7, n: 7 } }, gap: [{ k: 'w', id: 'breakfast', u: 'a1-u1', d: 5 }, { k: 'g', id: 'g-a1-08', d: 6, root: true, of: 'g-a2-05' }] };
    const m = merge(a, b), x = mig(JSON.parse(JSON.stringify({ ...a, fast: { path: 'bad', ch: [], gap: [{ k: 'w', id: 'breakfast', d: 'x' }, null, { k: 'z', id: 1 }] } })));
    return { m: m.fast, x: x.fast }; });
  expect(r.m.path).toBe('fast'); expect(Object.keys(r.m.ch).sort()).toEqual(['g:A1:0', 'w:A1:0']); expect(r.m.gap.length).toBe(2);
  expect(r.x).toEqual({ path: null, ch: {}, gap: [{ k: 'w', id: 'breakfast', u: null, d: 0 }] });
  expect(errors).toEqual([]);
});
