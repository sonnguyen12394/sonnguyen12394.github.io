import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v161 ▶ Hôm nay (người sáng lập 18/10/2026): một nút, một não cho cả 📘 Học bài và 🔁 Ôn luyện; não tự cân ôn / mới.
// Ôn luyện cho người có nền vượt nhanh; ôn mà dưới 50% là chưa có kiến thức → não đưa về Học bài (ndNeed).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function open(page: Page, view = 'nd'): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(v => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval("ui.ndLv='A1'"); w.eval('save()'); w.eval('emLoad()'); w.eval(`go('${v}')`); }, view);
  await page.waitForFunction(() => { const w = window as any; return !!(w.eval('EM') && w.eval('EM').parts && w.eval('EM').parts('cefr-a1')); }, null, { timeout: 30000 });
  await page.evaluate(() => (window as any).eval('render()'));
}
type Step = { k: string; side: string; t: string; at: string };
const plan = (page: Page): Promise<Step[]> => page.evaluate(() => (window as any).eval('dayPlan()').steps.map((x: any) => ({ k: x.k, side: x.side, t: x.t, at: x.at })));
// Trả lời sai hết câu hiểu bài + nghĩa từ (dưới 50%).
async function answerAllWrong(page: Page): Promise<void> {
  const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read, u = w.eval('UNITS').find((x: any) => x.id === R.uid);
    return { q: u.reading.qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)) }; });
  for (const [i, k] of R.q.entries()) await page.locator(`[data-rpick="${i}:${(k + 1) % 3}"]`).click();
  for (const [j, k] of R.v.entries()) await page.locator(`[data-ndv="${j}:${(k + 1) % 3}"]`).click();
  for (const [j, k] of R.g.entries()) await page.locator(`[data-ndg="${j}:${(k + 1) % 2}"]`).click();
  await page.locator('[data-act="rsubmit"]').click();
}

for (const scheme of ['light', 'dark'] as const) {
  test(`v161 ▶ Hôm nay có ở cả Học bài và Ôn luyện, cùng một kế hoạch; mỗi bước ghi phần + lý do; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page, 'nd');
    const box = page.locator('#app .dayplan');
    await expect(box).toContainText('▶ Hôm nay · mục tiêu A1');
    await expect(box.locator('[data-day]')).toHaveCount(1);
    const a = await plan(page);
    expect(a.length).toBeGreaterThanOrEqual(2);
    for (const s of a) expect(['📘 Học bài', '🔁 Ôn luyện']).toContain(s.side);
    const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(ax.violations.map(v => v.id)).toEqual([]);
    await noHorizontalScroll(page);
    await page.evaluate(() => (window as any).eval("go('lib')"));
    await expect(page.locator('#app .dayplan')).toBeVisible();
    expect(await plan(page)).toEqual(a);
    const ax2 = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(ax2.violations.map(v => v.id)).toEqual([]);
    await noHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
}

test('v161 có từ đến hạn → bước 1 là ôn (tối đa 12 từ); bấm ▶ thì ô đó đánh dấu đã làm, bước kế sáng lên', async ({ page, errors }) => {
  await open(page, 'nd');
  await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W'), ws = w.eval('ALL_WORDS').slice(0, 15);
    for (const x of ws) { const s = W(x.id); s.learned = true; s.due = t - 1; } w.eval('save()'); w.eval('render()'); });
  const a = await plan(page);
  expect(a[0]!.k).toBe('due'); expect(a[0]!.side).toBe('🔁 Ôn luyện'); expect(a[0]!.t).toContain('Ôn 12 từ');
  await page.locator('#app .dayplan [data-day="due"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').nd.day.done)).toEqual(['due']);
  expect(await page.evaluate(() => (window as any).eval('ui').view)).not.toBe('nd');
  await page.evaluate(() => (window as any).eval("go('nd')"));
  await expect(page.locator('#app .dayplan [data-day]')).not.toHaveAttribute('data-day', 'due');
  expect(errors).toEqual([]);
});

test('v161 Ôn luyện dưới 50% ở unit chưa học → "cần học trước", Ôn tiếp bỏ unit đó, ▶ Hôm nay đưa về Học bài unit đó; qua bài cuối unit thì hết', async ({ page, errors }) => {
  await open(page, 'nd');
  const uid = await page.evaluate(() => (window as any).eval('UNITS').filter((u: any) => u.level === 'A1' && u.reading)[3].id as string);
  await page.evaluate((u: string) => (window as any).eval('ndRead')(u, false), uid);
  await answerAllWrong(page);
  await expect(page.locator('#app .fb.bad')).toContainText('Bài này bạn cần học trước');
  await expect(page.locator(`#app [data-unit="${uid}"]`, { hasText: 'Học lại bài này' })).toBeVisible();
  expect(await page.evaluate((u: string) => (window as any).eval('U')(u).ndNeed, uid)).toBe(await page.evaluate(() => (window as any).eval('today()')));
  const a = await plan(page);
  expect(a.find(x => x.k === 'need')).toMatchObject({ side: '📘 Học bài', at: `data-unit="${uid}"` });
  // ngày sau: Ôn luyện không đưa lại unit này
  await page.evaluate(() => { const w = window as any; w.eval('st').nd.seen = {}; });
  for (let i = 0; i < 5; i++) expect(await page.evaluate(() => { const p = (window as any).eval('ndPick')('A1'); return p.u.id; })).not.toBe(uid);
  // vượt nhanh rớt được ghi để não biết người học có nền hay chưa
  expect(await page.evaluate(() => (window as any).eval('st').nd.to.length)).toBe(1);
  // bấm ▶ ở bước "cần học" → mở đúng unit ở Học bài
  await page.evaluate(() => { const w = window as any; w.eval('st').nd.day = { d: w.eval('today()'), done: ['due', 'gap', 'use'].filter(k => k !== 'need') }; w.eval("go('nd')"); });
  await page.locator('#app .dayplan [data-day="need"]').click();
  expect(await page.evaluate(() => (window as any).eval('ui').unitId)).toBe(uid);
  // qua bài cuối unit ở Học bài → hết "cần học trước", unit quay lại vòng ôn
  const cleared = await page.evaluate((u: string) => { const w = window as any;
    w.eval('ui').sess = { kind: 'test', uid: u, q: [{}], i: 1, res: Array.from({ length: 10 }, () => ({ correct: true, dim: 'mean' })), easy: 0 };
    try { w.eval('next')(); } catch { /* màn kết quả vẽ sau */ } return { need: w.eval('U')(u).ndNeed, passed: w.eval('U')(u).passed }; }, uid);
  expect(cleared).toEqual({ need: undefined, passed: true });
  await page.evaluate((u: string) => { (window as any).eval('U')(u).ndNeed = 5; }, uid);
  // lưu / tải lại vẫn giữ cờ (sanitize)
  expect(await page.evaluate((u: string) => { const w = window as any, x = w.eval('sanitizeState')(JSON.parse(JSON.stringify(w.eval('st')))); return x.units[u].ndNeed; }, uid)).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('v161 có nền hay chưa: 2 / 3 lượt vượt nhanh đạt → bài mới đưa từ Ôn luyện; 2 lượt dưới 50% → bài mới từ Học bài; chọn "chưa biết gì" → Học bài', async ({ page, errors }) => {
  await open(page, 'nd');
  const gap = async (to: Array<{ d: number; s: number }>, zero = false) => page.evaluate(([x, z]) => { const w = window as any, st = w.eval('st'); st.nd.to = x; st.nd.day = null;
    if (z) st.e.diag = { day: w.eval('today()'), u: 0, g: 0, n: 0 }; else delete st.e.diag;
    const g = w.eval('dayPlan()').steps.find((s: any) => s.k === 'gap'); return { base: w.eval('ndBase()'), side: g.side, t: g.t }; }, [to, zero] as const);
  const yes = await gap([{ d: 1, s: 0.9 }, { d: 2, s: 0.7 }, { d: 3, s: 0.2 }]);
  expect(yes).toMatchObject({ base: 'yes', side: '🔁 Ôn luyện' }); expect(yes.t).toContain('Vượt nhanh');
  const no = await gap([{ d: 1, s: 0.3 }, { d: 2, s: 0.1 }]);
  expect(no).toMatchObject({ base: 'no', side: '📘 Học bài' });
  const zero = await gap([], true);
  expect(zero).toMatchObject({ base: 'no', side: '📘 Học bài' });
  const unknown = await gap([]);
  expect(unknown).toMatchObject({ base: null, side: '🔁 Ôn luyện' });   // chưa biết: thử vượt nhanh một lần
  expect(errors).toEqual([]);
});

test('v161 còn cặp âm / chức năng giao tiếp chưa qua mà thanh 📘 Học < 80% → bước dùng thật đưa bài đó (Ôn luyện không qua được hai loại này)', async ({ page, errors }) => {
  await open(page, 'nd');
  const a = await plan(page);
  const use = a.find(x => x.k === 'use')!;
  expect(use.side).toBe('📘 Học bài');
  expect(use.at).toMatch(/^data-(snd|fn)="/);
  // qua hết cặp âm + chức năng của A1 → bước dùng thật là đóng vai / viết
  await page.evaluate(() => { const w = window as any, st = w.eval('st'), miss = w.eval('EM').parts('cefr-a1').miss;
    for (const n of miss) { const [k, id] = [n.slice(0, n.indexOf(':')), n.slice(n.indexOf(':') + 1)]; if (k === 'ph') st.sounds[id] = { best: 1 }; if (k === 'fn') st.fn[id] = { best: 1 }; } w.eval('save()'); });
  const b = (await plan(page)).find(x => x.k === 'use')!;
  expect(b.side).toBe('🔁 Ôn luyện');
  expect(b.at).toMatch(/data-act="day(rpg|wrg|stk)"/);   // v162 thêm Nói theo đề
  expect(errors).toEqual([]);
});

test('v161 Nói theo đề A1 / A2 ở Học bài: ý tìm bằng từ khoá trong lời chép (không tự đánh dấu); câu trả lời mẫu đạt đủ ý, lạc đề thì không', async ({ page, errors }) => {
  await open(page, 'nd');
  const r = await page.evaluate(() => { const w = window as any, K = w.eval('STK_K'), hits = w.eval('kwHits'), ts = w.eval('STASKS').filter((t: any) => K[t.id]);
    return { n: ts.length, bad: ts.filter((t: any) => K[t.id].length !== t.c.length || hits(K[t.id], t.m).some((x: boolean) => !x)).map((t: any) => t.id),
      off: ts.filter((t: any) => hits(K[t.id], 'Yes. No. Maybe. I do not know.').filter(Boolean).length > 1).map((t: any) => t.id),
      a1: w.eval('STASKS').filter((t: any) => t.lv === 'A1' || t.lv === 'A2').length }; });
  expect(r.n).toBe(r.a1);
  expect(r.bad).toEqual([]);
  expect(r.off).toEqual([]);
  expect(errors).toEqual([]);
});

test('v162 ba đường: người mới → Học bài nhanh nhất; có nền → Ôn luyện nhanh nhất; có kiến thức nhưng lủng → ▶ Hôm nay (não gợi ý theo lượt vượt nhanh)', async ({ page, errors }) => {
  await open(page, 'nd');
  await expect(page.locator('#app')).toContainText('Người đã có nền: đây là đường nhanh nhất');
  await expect(page.locator('#app .dayplan')).toContainText('Dành cho người đã có kiến thức nhưng còn lủng');
  const fit = (to: Array<{ d: number; s: number }>, zero = false) => page.evaluate(([x, z]) => { const w = window as any, st = w.eval('st'); st.nd.to = x;
    if (z) st.e.diag = { day: 0, u: 0, g: 0, n: 0 }; else delete st.e.diag; return w.eval('pathFit()'); }, [to, zero] as const);
  expect(await fit([], true)).toBe('lib');
  expect(await fit([])).toBe(null);
  expect(await fit([{ d: 1, s: 0.9 }, { d: 2, s: 0.85 }])).toBe('nd');
  expect(await fit([{ d: 1, s: 0.2 }, { d: 2, s: 0.3 }])).toBe('lib');
  expect(await fit([{ d: 1, s: 0.9 }, { d: 2, s: 0.3 }, { d: 3, s: 0.8 }])).toBe('day');
  await page.evaluate(() => (window as any).eval('render()'));
  await expect(page.locator('#app .pathfit')).toContainText('▶ Hôm nay');
  await page.evaluate(() => (window as any).eval("go('lib')"));
  await expect(page.locator('#app')).toContainText('Người mới hoàn toàn: đây là đường nhanh nhất');
  const ax = await new AxeBuilder({ page }).include('#app .dayplan').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});
