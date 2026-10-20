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
  const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read;
    return { q: R.rd.qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)) }; });
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
    await expect(box.locator('.btn.primary.big')).toHaveCount(1);
    const a = await plan(page);
    expect(a.length).toBeGreaterThanOrEqual(2);
    for (const s of a) expect(['📘 Học bài', '⚡ Học nhanh']).toContain(s.side);
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

test('v172 → v176 giai đoạn học: bài mới trước rồi ôn (tới 5 lượt / ngày); nợ ôn ≥ 40 thì ôn đứng trước nhưng vẫn có bài mới', async ({ page, errors }) => {
  await open(page, 'nd');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W'), ws = w.eval('ALL_WORDS').filter((x: any) => w.eval('UNIT_OF')[x.id].level === 'A2').slice(0, 45);
    for (const x of ws) { const s = W(x.id); s.learned = true; s.due = t - 1; } w.eval('save()');
    const p = w.eval('dayPlan()'); return { lq: p.lq, steps: p.steps.map((s: any) => ({ k: s.k, t: s.t, side: s.side, at: s.at })), cur: w.eval('currentUnit()').id }; });
  expect(r.lq).toBeLessThan(80);
  expect(r.steps[0]!.k).toBe('due');   // v176 nợ ôn 45 ≥ 40: ôn trước
  expect(r.steps.some((s: any) => s.at === `data-unit="${r.cur}"`)).toBe(true);   // vẫn có bài mới
  const due = r.steps.find((s: any) => s.k === 'due')!;
  expect(due.side).toBe('📘 Học bài'); expect(due.t).toContain('Ôn 12 từ đến hạn (còn 45 từ)');
  // dưới 40 từ đến hạn: bài mới đứng đầu, ôn đứng sau có nút riêng
  await page.evaluate(() => { const w = window as any, t = w.eval('today()'); for (const x of w.eval('ALL_WORDS').filter((x: any) => w.eval('UNIT_OF')[x.id].level === 'A2').slice(0, 20)) w.eval('W')(x.id).due = t + 9; w.eval('render()'); });
  await expect(page.locator('#app .dayplan .btn.primary.big')).toHaveAttribute('data-unit', r.cur);
  await expect(page.locator('#app .dayplan li [data-act="dayreview"]')).toHaveText('Làm');   // v175 bước nào cũng có nút
  expect(errors).toEqual([]);
});

test('v173 lịch ôn theo giai đoạn: giai đoạn học giãn × 3,3 (mức nhớ 0,75); giai đoạn ôn lịch thường và từ đã phai dưới 0,9 cũng đến hạn', async ({ page, errors }) => {
  await open(page, 'lib');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W'), step = w.eval('srsStep'), LPH = w.eval('LPH');
    const [a, b, c] = w.eval('ALL_WORDS').slice(0, 3).map((x: any) => x.id);
    const s1 = W(a); s1.learned = true; s1.due = null; step(s1, true, true);
    w.dayParts = () => ({ learn: 100, mem: 10, total: 100, miss: [] }); LPH.k = '';   // giả lập 📘 Học 100% (v176 giai đoạn ôn)
    const s2 = W(b); s2.learned = true; s2.due = null; step(s2, true, true);
    const s3 = W(c); Object.assign(s3, { learned: true, due: t + 20, fs: 3, fl: t - 10 });   // lịch còn xa nhưng đã phai
    return { learnIvl: s1.ivl, revIvl: s2.ivl, faded: w.eval('dueWords()').some((x: any) => x.id === c), ph2: w.eval('learnPh2()') }; });
  expect(r.revIvl).toBe(3);
  expect(r.learnIvl).toBe(10);
  expect(r).toMatchObject({ faded: true, ph2: true });
  expect(errors).toEqual([]);
});

test('v172 → v176 giai đoạn ôn (📘 Học 100%): ôn đứng đầu, lặp tới 5 lượt / ngày; nợ ôn ≥ 40 từ (BACKLOG) thì chưa mở unit mới mà luyện lại unit cũ', async ({ page, errors }) => {
  await open(page, 'lib');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W'), ws = w.eval('ALL_WORDS').filter((x: any) => w.eval('UNIT_OF')[x.id].level === 'A2').slice(0, 40);
    w.dayParts = () => ({ learn: 100, mem: 10, total: 100, miss: [] });   // giả lập 📘 Học 100% (v176 giai đoạn ôn)
    for (const x of ws) { const s = W(x.id); s.learned = true; s.due = t - 1; }
    const a = w.eval('dayPlan()').steps.map((s: any) => s.k + '|' + s.t + '|' + s.at);
    for (const x of ws.slice(0, 10)) W(x.id).due = t + 3;
    const b = w.eval('dayPlan()').steps.map((s: any) => s.k + '|' + s.at);
    w.eval('TRK()').rd[t] = [60, 50, 54];   // v175 đã ôn đủ 5 lượt × 12 câu hôm nay → thôi đưa ôn
    const c = w.eval('dayPlan()').steps.map((s: any) => s.k);
    return { a, b, c, cur: w.eval('currentUnit()').id }; });
  expect(r.a[0]).toContain('due|Ôn 12 từ đến hạn (còn 40 từ)');
  expect(r.a.some((s: string) => s.includes(`data-unit="${r.cur}"`))).toBe(false);
  expect(r.b.some((s: string) => s.includes(`data-unit="${r.cur}"`))).toBe(true);
  expect(r.c).not.toContain('due');
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
  await page.evaluate(() => (window as any).eval("go('nd')"));
  await page.locator(`#app .dayplan [data-unit="${uid}"]`).first().click();
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
  expect(yes).toMatchObject({ base: 'yes', side: '📘 Học bài' });   // v171 chưa chọn đường = 📘 Học bài (người sáng lập 20/10/2026: học chính thống trước)
  const no = await gap([{ d: 1, s: 0.3 }, { d: 2, s: 0.1 }]);
  expect(no).toMatchObject({ base: 'no', side: '📘 Học bài' });
  const zero = await gap([], true);
  expect(zero).toMatchObject({ base: 'no', side: '📘 Học bài' });
  const unknown = await gap([]);
  expect(unknown).toMatchObject({ base: null, side: '📘 Học bài' });
  // v165 đi đường ⚡ mà hết chặng → đọc / nghe nguyên bài để vượt unit còn lại
  const rd = await page.evaluate(() => { const w = window as any; w.eval('st').fast = { path: 'fast', ch: Object.fromEntries(['A1', 'A2'].flatMap(l => w.eval('fastChunks')(l).map((c: any) => [c.key, { d: 1, ok: 0, n: 0 }]))), gap: [] };
    const g = w.eval('dayPlan()').steps.find((s: any) => s.k === 'gap'); return { side: g.side, t: g.t }; });
  expect(rd.side).toBe('⚡ Học nhanh'); expect(rd.t).toContain('Vượt nhanh');
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
  expect(b.side).toBe('⚡ Học nhanh');
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

test('v162 → v165 hai đường: lời giới thiệu (người mới → Học bài; học lâu mà mất gốc → ⚡ Học nhanh); không còn dòng gợi ý đường cũ', async ({ page, errors }) => {
  await open(page, 'nd');
  await expect(page.locator('#app')).toContainText('mất gốc, không muốn học lại từ đầu');   // v165 ⚡ Học nhanh
  await expect(page.locator('#app .dayplan')).toContainText('Đang ở giai đoạn');
  await expect(page.locator('#app .pathfit')).toHaveCount(0);
  expect(await page.evaluate(() => typeof (window as any).pathFit)).toBe('undefined');
  await page.evaluate(() => (window as any).eval("go('lib')"));
  await expect(page.locator('#app')).toContainText('Làm theo ▶ Hôm nay là đi tới Thi chuyển cấp');
  const ax = await new AxeBuilder({ page }).include('#app .dayplan').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('v163 một não, ba cách nhìn: từ đến hạn → bước đầu của cả ▶ Hôm nay và ▶ Ôn tiếp là ôn; bài chưa biết → Học bài đưa đúng bài đó trước bài mới', async ({ page, errors }) => {
  await open(page, 'nd');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W'), U = w.eval('U');
    for (const x of w.eval('ALL_WORDS').slice(0, 5)) { const s = W(x.id); s.learned = true; s.due = t - 1; }
    const a = { day: w.eval('dayPlan()').steps.some((x: any) => x.k === 'due') ? 'due' : '', nd: w.eval('ndPlan')('A1').k };   // v172 giai đoạn học: ôn sau bài mới
    for (const x of w.eval('ALL_WORDS').slice(0, 5)) W(x.id).due = t + 9;
    const u = w.eval('UNITS').filter((x: any) => x.level === 'A1')[6]; U(u.id).ndNeed = t;
    const m = w.eval('mainAction')({ learn: true }), d = w.eval('dayPlan()').steps.find((s: any) => s.k === 'need');
    return { a, h: m.h, btn: m.btn, need: d && d.at, uid: u.id, pick: w.eval('ndPick')('A1').u.id }; });
  expect(r.a).toEqual({ day: 'due', nd: 'due' });
  expect(r.btn).toContain(`data-unit="${r.uid}"`); expect(r.h).toContain('Học');
  expect(r.need).toBe(`data-unit="${r.uid}"`);
  expect(r.pick).not.toBe(r.uid);   // Ôn luyện thôi đưa bài chưa biết
  expect(errors).toEqual([]);
});

test('v165 "gần được" (50–80%): không còn đếm 2 lần → Học bài (bỏ ND_MID); unit đánh dấu đã đo nhanh (vá hết chỗ lủng là qua)', async ({ page, errors }) => {
  await open(page, 'nd');
  const uid = await page.evaluate(() => (window as any).eval('UNITS').filter((u: any) => u.level === 'A1' && u.reading)[5].id as string);
  const mid = async () => {
    await page.evaluate((u: string) => (window as any).eval('ndRead')(u, false), uid);
    const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read;
      return { q: R.rd.qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)) }; });
    const n = R.q.length + R.v.length, wrong = Math.ceil(n * 0.3);   // ≈ 70% đúng
    let k0 = 0;
    for (const [i, k] of R.q.entries()) await page.locator(`[data-rpick="${i}:${k0++ < wrong ? (k + 1) % 3 : k}"]`).click();
    for (const [j, k] of R.v.entries()) await page.locator(`[data-ndv="${j}:${k}"]`).click();
    for (const [j, k] of R.g.entries()) await page.locator(`[data-ndg="${j}:${k}"]`).click();
    await page.locator('[data-act="rsubmit"]').click();
    return page.evaluate(() => { const r = (window as any).eval('ui').read.res; return r.n / r.of; });
  };
  const s1 = await mid(); expect(s1).toBeGreaterThanOrEqual(0.5); expect(s1).toBeLessThan(0.8);
  const r = await page.evaluate((u: string) => { const w = window as any, U = w.eval('U')(u); return { ndMid: U.ndMid || 0, need: !!U.ndNeed, fq: U.fq === w.eval('today()'), passed: !!U.passed }; }, uid);
  expect(r).toEqual({ ndMid: 0, need: false, fq: true, passed: false });
  await page.evaluate(() => { const st = (window as any).eval('st'); st.offset = (st.offset || 0) + 1; });
  await mid();
  expect(await page.evaluate((u: string) => !!(window as any).eval('U')(u).ndNeed, uid)).toBe(false);   // 2 lần gần được vẫn không đẩy về Học bài
  expect(errors).toEqual([]);
});

test('v175 học thử: bấm mở bước không tính là xong; học xong unit thì unit kế hiện ngay (nhiều unit / ngày); có lượt dở → bước "Làm tiếp" đứng đầu; không còn năng lượng', async ({ page, errors }) => {
  await open(page, 'lib');
  const cur = await page.evaluate(() => (window as any).eval('currentUnit()').id as string);
  await page.locator('#app .dayplan .btn.primary.big').click();   // mở unit rồi quay lại
  expect(await page.evaluate(() => (window as any).eval('ui').unitId)).toBe(cur);
  await page.evaluate(() => (window as any).eval("go('lib')"));
  await expect(page.locator('#app .dayplan .btn.primary.big')).toHaveAttribute('data-unit', cur);
  await expect(page.locator('#app .dayplan')).not.toContainText('Xong các bước hôm nay');
  // qua unit → unit kế là bước đầu; dòng "Đã làm hôm nay" ghi số unit qua
  const nx = await page.evaluate((u: string) => { const w = window as any, t = w.eval('today()'); Object.assign(w.eval('U')(u), { learned: true, passed: true, pd: t }); w.eval('TRK()').d[t] = { m: 600, mr: 0, q: 30 }; w.eval('render()'); return w.eval('currentUnit()').id as string; }, cur);
  expect(nx).not.toBe(cur);
  await expect(page.locator(`#app .dayplan [data-unit="${nx}"]`).first()).toBeVisible();   // v175 bài ngữ pháp có thể đứng trước (đi đều cùng unit)
  await expect(page.locator('#app .dayplan')).toContainText('Đã làm hôm nay: 30 câu · qua 1 unit');
  // lượt dở → "Làm tiếp" đứng đầu
  await page.evaluate(() => { const w = window as any, u = w.eval('UNITS')[0]; w.eval('U')(u.id).learned = true; w.eval('startSession')('practice', w.eval('practiceItems')(u.words), u.id); w.eval('answer')(true, {}); w.eval('next')(); w.eval("go('lib')"); });
  await expect(page.locator('#app .dayplan .btn.primary.big')).toHaveAttribute('data-act', 'resume');
  // không còn năng lượng: luyện nhiều lượt liền không bị chặn
  const blocked = await page.evaluate(() => { const w = window as any, u = w.eval('UNITS')[0], m = w.eval('money()'); m.e = 0; m.t = Date.now();
    for (let i = 0; i < 8; i++) w.eval('startSession')('practice', w.eval('practiceItems')(u.words), u.id);
    const u2 = w.eval('UNITS').find((x: any) => !w.eval('U')(x.id).learned); w.eval('go')('learn', { learn: { uid: u2.id, i: 0 } });   // học thẻ unit mới cũng không bị chặn
    return !document.getElementById('modal')!.hidden || w.eval('ui').view !== 'learn'; });
  expect(blocked).toBe(false);
  expect(await page.evaluate(() => (window as any).eval('EN_COST').size)).toBe(0);
  expect(errors).toEqual([]);
});

test('v176 chuẩn Học 100% · Nhớ 80%: thanh ghi "cần 100%" / "cần 80%"; cặp âm / chức năng đã học, đến lúc ôn → bước 🔁 Ôn trong ▶ Hôm nay; Học 90% vẫn là giai đoạn học', async ({ page, errors }) => {
  await open(page, 'lib');
  await expect(page.locator('#app [aria-label="Học và Nhớ A1"]')).toContainText('cần 100%');
  await expect(page.locator('#app [aria-label="Học và Nhớ A1"]')).toContainText('cần 80%');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()');
    const parts = w.eval('EM').parts('cefr-a1'), ph = parts.miss.find((n: string) => n.startsWith('ph:'));
    w.eval('st').sounds[ph.slice(3)] = { best: 1 };   // đã qua bài âm
    w.eval('eEv')({ node: ph, level: 2, ok: true, item: 'snd:' + ph, qt: 'mcq' });
    w.eval('st').offset = (w.eval('st').offset || 0) + 4; w.eval('LPH').k = '';   // 4 ngày sau
    const steps = w.eval('dayPlan()').steps.map((s: any) => s.k + '|' + s.at);
    w.dayParts = () => ({ learn: 90, mem: 10, total: 100, miss: [], rv: [] }); w.eval('LPH').k = '';
    return { ph, steps, ph2: w.eval('learnPh2()'), t }; });
  expect(r.steps.some((s: string) => s === `rv|data-snd="${r.ph.slice(3)}"`)).toBe(true);
  expect(r.ph2).toBe(false);   // v176 giai đoạn ôn chỉ khi Học đủ 100%
  expect(errors).toEqual([]);
});

test('v176 giai đoạn học: nợ ôn nhiều (loadHigh) không chặn bài mới; chỉ giới hạn số từ mới / ngày; giai đoạn ôn thì chặn', async ({ page, errors }) => {
  await open(page, 'lib');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W');
    for (const x of w.eval('ALL_WORDS').filter((x: any) => w.eval('UNIT_OF')[x.id].level === 'A2').slice(0, 80)) { const s = W(x.id); s.learned = true; s.due = t - 1; }
    const a = { load: w.eval('loadHigh()'), cap: w.eval('newCapHit()'), unit: w.eval('dayPlan()').steps.some((s: any) => s.at === `data-unit="${w.eval('currentUnit()').id}"`) };
    w.dayParts = () => ({ learn: 100, mem: 10, total: 100, miss: [], rv: [] }); w.eval('LPH').k = '';
    return { a, capPh2: w.eval('newCapHit()') }; });
  expect(r.a.load).toBe(true);
  expect(r.a.cap).toBe(false);
  expect(r.a.unit).toBe(true);
  expect(r.capPh2).toBe(true);
  expect(errors).toEqual([]);
});

test('v176 học hết unit A1 mà chưa qua Thi chuyển cấp A1 → vẫn ở A1, không đưa unit A2; giai đoạn học nợ ôn ≥ 40 → ôn trước bài mới', async ({ page, errors }) => {
  await open(page, 'lib');
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), U = w.eval('U');
    w.eval('ui').ndLv = null;
    for (const u of w.eval('UNITS').filter((x: any) => x.level === 'A1')) Object.assign(U(u.id), { learned: true, passed: true, pd: t - 5 });
    w.eval('LPH').k = '';
    const a = { lv: w.eval('ndLv()'), cur: w.eval('currentUnit()').level, steps: w.eval('dayPlan()').steps.map((s: any) => s.k + '|' + s.at) };
    for (const x of w.eval('ALL_WORDS').filter((x: any) => w.eval('UNIT_OF')[x.id].level === 'A2').slice(0, 45)) { const s = w.eval('W')(x.id); s.learned = true; s.due = t - 1; }
    for (const u of w.eval('UNITS').filter((x: any) => x.level === 'A1').slice(40)) U(u.id).passed = false;   // còn unit A1 chưa qua
    const b = w.eval('dayPlan()').steps.map((s: any) => s.k);
    return { a, b }; });
  expect(r.a.lv).toBe('A1'); expect(r.a.cur).toBe('A2');
  expect(r.a.steps.some((s: string) => /data-unit="a2-/.test(s))).toBe(false);
  expect(r.b.indexOf('due')).toBeLessThan(r.b.indexOf('gap'));
  expect(errors).toEqual([]);
});
