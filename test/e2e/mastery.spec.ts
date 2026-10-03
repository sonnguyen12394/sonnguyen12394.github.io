import { test, expect, openApp } from './fixtures.ts';

// M2: bằng chứng mastery, một hệ FSRS, Can-Do theo chất lượng bằng chứng, tiến độ cũ thành tiên nghiệm.
/* eslint-disable @typescript-eslint/no-explicit-any */

const V18 = {
  v: 18, app: { seen: 44, vh: [] }, srs: { k: 1, n: 0 }, x: {}, onboarded: true, xp: 100,
  words: {}, gram: {}, levels: {}, glevels: {}, stats: { a: 10, c: 9 }, days: [20000], daily: {},
  set: { goal: 20, newMax: 20, rate: 0.9 }, start: 20000, offset: 0,
  units: { 'a1-u1': { learned: true, practiced: 3, best: 0.95, passed: true, skipped: true, speak: 0, written: false } },
};

test('tiến độ cũ thành tiên nghiệm một lần: unit đã qua coi như đạt mức 3', async ({ page, errors }) => {
  await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('vocab-ladder-v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(V18));
  await openApp(page);
  const e = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').e);
  expect(e.pri).toBe(1);
  expect(e.m['u:a1-u1']['3']).toMatchObject({ a: 7, b: 1.5, n: 0 });
  const st = await page.evaluate(() => (window as any).ELCORE.stat((window as any).eval('st'), 'u:a1-u1', 3));
  expect(st.pass).toBe(true);
  expect(errors).toEqual([]);
});

test('trả lời từ vựng ghi bằng chứng và lịch ôn FSRS; thẻ kiểu cũ chuyển sang FSRS khi ôn', async ({ page, errors }) => {
  await openApp(page);
  const r = await page.evaluate(() => {
    const w = window as any, ev = (s: string) => w.eval(s);
    const u = ev('UNITS[0]'), wid = u.words[0].id, t = ev('today()');
    // thẻ kiểu SM-2 cũ đến hạn hôm nay: khoảng 7 ngày, hệ số 2,5
    Object.assign(ev('W')(wid), { learned: true, stage: 2, ivl: 7, ease: 2.5, due: t });
    ev('grade')({ wid, dim: 'rcl', type: ev('TYPED')[0], opts: null }, true);
    const card = ev('W')(wid), cell = ev('st').e.m['u:' + u.id];
    return { fs: card.fs, fd: card.fd, fl: card.fl, ivl: card.ivl, due: card.due - t, stage: card.stage, cell3: cell && cell['3'], cell4: cell && cell['4'] };
  });
  expect(r.fs).toBeGreaterThan(7);          // nhớ đúng hạn → độ bền tăng so với khoảng cũ
  expect(r.fd).toBeGreaterThanOrEqual(1);
  expect(r.ivl).toBeGreaterThan(7);
  expect(r.due).toBe(r.ivl);
  expect(r.stage).toBe(3);
  expect(r.cell3).toMatchObject({ a: 2, n: 1, q: ['typed'], c: ['rcl'] });   // tự gõ: g = 0
  expect(r.cell4).toBeUndefined();                                         // nhớ ra (mức 3) không chứng minh mức 4
  expect(errors).toEqual([]);
});

test('Can-Do theo chất lượng: làm đủ bài nhưng điểm thấp thì chưa đạt; chưa có bằng chứng thì 0%', async ({ page, errors }) => {
  await openApp(page);
  const r = await page.evaluate(() => {
    const w = window as any, ev = (s: string) => w.eval(s);
    // a1-fun1: 2 bài chức năng giao tiếp + 3 hội thoại
    const c = ev('CANDO').find((x: any) => x.id === 'a1-fun1');
    const set = (v: number) => { for (const r of c.ref) for (const id of r.v) (r.t === 'f' ? ev('st').fn : ev('st').dlg)[id] = { best: v, n: 1 }; ev('save')(); };   // save() làm mới bộ nhớ đệm cdProg
    const before = ev('cdProg')(c);
    set(0.6);
    const low = ev('cdProg')(c);
    set(1);
    const high = ev('cdProg')(c);
    return { before: before.p, low: low.p, lowDone: low.rs.reduce((n: number, x: any) => n + x.done, 0), high: high.p };
  });
  expect(r.before).toBe(0);
  expect(r.lowDone).toBe(0);                // điểm 60% không tính là xong
  expect(r.low).toBeLessThan(0.8);
  expect(r.high).toBe(1);
  expect(errors).toEqual([]);
});
