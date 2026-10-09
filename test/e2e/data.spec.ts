import { test, expect, openApp, navTo } from './fixtures.ts';

// Bản lưu v17 (app v34) có tiến độ thật và phần tim/Super: cập nhật lên v35 phải giữ nguyên tiến độ, bỏ tim/Super.
const V17 = {
  v: 17, app: { seen: 34, vh: [] }, money: { h: 2, hd: 20000, ht: 0, sup: { c: 'X', exp: 99999 } }, srs: { k: 1, n: 0 },
  words: { price: { d: { rec: 1, rcl: 1, spl: null, ctx: null, col: null }, stage: 3, due: 20500, ivl: 12, ease: 2.5, learned: true } },
  units: {}, gram: {}, levels: {}, glevels: {}, stats: { a: 40, c: 31 }, days: [20000, 20001], daily: {}, xp: 777, onboarded: true,
  set: { goal: 20, newMax: 20, rate: 0.9 }, start: 20000, offset: 0, exam: [{ day: 20001, l: 6, r: 6.5 }],
};

test('nâng cấp dữ liệu v17 → v18 không mất tiến độ', async ({ page, errors }) => {
  await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('vocab-ladder-v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(V17));
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}'));
  expect(saved.v).toBe(18);
  // tim theo lỗi của v16–v17 bị bỏ khi nâng cấp; năng lượng theo lượt (v51) là bản ghi mới, đầy năng lượng
  expect(saved.money?.h).toBeUndefined();
  expect(saved.money?.e ?? 5).toBe(5);
  expect(saved.xp).toBe(777);
  expect(saved.words.price.learned).toBe(true);
  expect(saved.words.price.ivl).toBe(12);
  expect(saved.exam).toEqual([{ day: 20001, l: 6, r: 6.5 }]);
  expect(saved.x).toMatchObject({ v: 3, attempts: [], resp: [] });
  expect(errors).toEqual([]);
});

test('mã sao lưu mang theo phần ôn thi và khôi phục được', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(page.getByRole('heading', { name: /Ôn VSTEP/ })).toBeVisible();
  const code = await page.evaluate(async () => {
    // @ts-expect-error hàm toàn cục của app.js
    return await makeCode();
  });
  expect(code).toMatch(/^VL[12]:/);
  const back = await page.evaluate(async c => {
    // @ts-expect-error hàm toàn cục của app.js
    return await readCode(c);
  }, code);
  expect(back.x.exam).toBe('vstep');
  expect(errors).toEqual([]);
});

test('mã sao lưu giữ nguyên sổ bằng chứng, thống kê và snapshot; khôi phục ra đúng mastery (C193)', async ({ page, errors }) => {
  await openApp(page);
  const r = await page.evaluate(async () => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()');
    for (let i = 0; i < 6; i++) w.ELCORE.ev(st, { node: 'g:g-a1-01', level: 3, ok: i !== 2, item: 'g:bk' + i, src: 'gram', ctx: 'typ', qt: 'gty' }, t);
    w.eval('save()');
    const code = await w.eval('makeCode')(), back = await w.eval('readCode')(code), x = w.eval('sanitizeState')(back);
    const e0 = st.e, e1 = x.e;
    return { led0: e0.ev.led.map((l: any) => l.id), led1: e1.ev.led.map((l: any) => l.id), snap0: e0.ev.snap.length, snap1: e1.ev.snap.length,
      agg: JSON.stringify(e0.ev.agg) === JSON.stringify(e1.ev.agg), m0: e0.m['g:g-a1-01'][3], m1: e1.m['g:g-a1-01'][3] };
  });
  expect(r.led1).toEqual(r.led0);
  expect(r.snap1).toBe(r.snap0);
  expect(r.agg).toBe(true);
  expect(r.m1.a).toBeCloseTo(r.m0.a, 6); expect(r.m1.b).toBeCloseTo(r.m0.b, 6);
  expect(errors).toEqual([]);
});
