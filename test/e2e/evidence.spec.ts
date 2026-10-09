import { readFileSync } from 'node:fs';
import { test, expect, openApp } from './fixtures.ts';

// v53 (spec v2.4 §23–37): câu trả lời thật → quan sát L0 → sự kiện L1 có provenance → thống kê L2 → ô Beta L3.
/* eslint-disable @typescript-eslint/no-explicit-any */

test('trả lời một câu ngữ pháp: sổ bằng chứng có sự kiện kèm provenance, ô Beta tính lại khớp thống kê', async ({ page, errors }) => {
  await openApp(page);
  const r = await page.evaluate(() => {
    const w = window as any, ev = (s: string) => w.eval(s);
    const st = ev('st');
    const out = w.ELCORE.ev(st, { node: 'g:g-a1-01', level: 3, ok: true, g: 0, item: 'g:test', qt: 'gtp', ctx: 'typ', src: 'gram', ch: 'g:g-a1-01', cv: 'a53' }, ev('today()'));
    const e = st.e, before = JSON.stringify(e.m['g:g-a1-01']);
    w.ELCORE.recompute(st);
    return { v: e.v, out, led: e.ev.led.length, obs: e.ev.obs.length, same: before === JSON.stringify(st.e.m['g:g-a1-01']), dev: localStorage.getItem('el-dev') };
  });
  expect(r.v).toBe(4);
  expect(r.out).toMatchObject({ node: 'g:g-a1-01', lv: 3, ok: 1, src: 'gram', item: 'g:test', ch: 'g:g-a1-01', cv: 'a53', nov: 1 });
  expect(r.out.id.startsWith(r.dev + '.')).toBe(true);
  expect(r.out.sess).toBeTruthy();
  expect(r.led).toBeGreaterThan(0);
  expect(r.obs).toBeGreaterThan(0);
  expect(r.same).toBe(true);
  expect(errors).toEqual([]);
});

test('bản lưu engine v3 (trước v53) nâng lên v4: giữ nguyên α, β của từng ô', async ({ page, errors }) => {
  const V = {
    v: 18, app: { seen: 52, vh: [] }, srs: { k: 1, n: 0 }, x: {}, onboarded: true, xp: 10, words: {}, gram: {}, levels: {}, glevels: {},
    stats: { a: 1, c: 1 }, days: [20000], daily: {}, set: { goal: 20, newMax: 20, rate: 0.9 }, start: 20000, offset: 0, units: {},
    e: { v: 3, goals: [], r: {}, pri: 1, diag: null, m: { 'u:a1-u1': { 3: { a: 9.5, b: 2.8, n: 11, q: ['mcq'], c: ['rcl'], d: 20000 } } } },
  };
  await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('vocab-ladder-v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(V));
  await openApp(page);
  const e = await page.evaluate(() => (window as any).eval('st').e);
  expect(e.v).toBe(4);
  expect(e.m['u:a1-u1']['3']).toMatchObject({ a: 9.5, b: 2.8, n: 11 });
  expect(e.ev.agg.legacy).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Cài đặt: thấy tình trạng sổ bằng chứng, tải được dữ liệu nghiên cứu đầy đủ', async ({ page, errors }) => {
  await openApp(page);
  await page.evaluate(() => (window as any).eval("go('settings')"));
  await page.getByRole('heading', { name: 'Sao lưu tiến độ', level: 3 }).click();   // mục Cài đặt gập sẵn
  await expect(page.getByText(/Sổ bằng chứng trên máy này/)).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), page.locator('[data-act="evexport"]').click()]);
  expect(dl.suggestedFilename()).toMatch(/^english-ladder-research-.*\.json$/);
  expect(errors).toEqual([]);
});

test('v67: phiên bản nội dung TỪNG câu ghi vào sổ khớp bản đồ nội dung (từ vựng, ngữ pháp, cặp âm) (C56)', async ({ page, errors }) => {
  await openApp(page);
  const map = JSON.parse(readFileSync('content/engine/content-map.json', 'utf8')).map as Record<string, Array<[string, number[], string]>>;
  const want = (node: string, id: string) => 'h' + map[node]!.find(x => x[0] === id)![2];
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });   // băm khi nội dung đã đủ
  const got = await page.evaluate(() => {
    const w = window as any;
    w.eval("eEv({node:'u:a1-u1',level:3,ok:true,item:'w:breakfast:rcl',src:'vocab'})");
    w.eval("eEv({node:'g:g-a1-01',level:3,ok:true,item:'g:g-a1-01|typ|t0',src:'gram'})");
    const led = w.eval('st').e.ev.led;
    return { w: led.find((x: any) => x.item === 'w:breakfast:rcl').cv, g: led.find((x: any) => x.item === 'g:g-a1-01|typ|t0').cv };
  });
  expect(got.w).toBe(want('u:a1-u1', 'w:breakfast:rcl'));
  expect(got.g).toBe(want('g:g-a1-01', 'g:g-a1-01|typ|t0'));
  expect(errors).toEqual([]);
});
