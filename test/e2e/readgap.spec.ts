import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v164 (người sáng lập 18/10/2026: "não tạo bài đọc hoặc bài viết để giúp người học đạt mục tiêu"): kho bài Ôn luyện (5 bài / unit),
// não chọn bài theo chỗ thiếu; câu nghĩa từ nhắm từ đang thiếu, bằng chứng vào đúng unit của từ; viết theo chỗ thiếu = bằng chứng mức 4.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval("ui.ndLv='A1'"); w.eval('save()'); w.eval('emLoad()'); });
  await page.waitForFunction(() => { const w = window as any; return !!(w.eval('EM') && w.eval('EM').parts && w.eval('EM').parts('cefr-a1')); }, null, { timeout: 30000 });
  await page.evaluate(() => Promise.all(['A1', 'A2'].map(L => (window as any).eval('readsLoad')(L))));   // kho bài tải riêng (data/rd-<cấp>)
}
async function answerAll(page: Page): Promise<void> {
  const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read, r = R.rd;
    return { q: r.qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)) }; });
  for (const [i, k] of R.q.entries()) await page.locator(`[data-rpick="${i}:${k}"]`).click();
  for (const [j, k] of R.v.entries()) await page.locator(`[data-ndv="${j}:${k}"]`).click();
  for (const [j, k] of R.g.entries()) await page.locator(`[data-ndg="${j}:${k}"]`).click();
  await page.locator('[data-act="rsubmit"]').click();
}

test('v164 kho bài: mỗi unit A1 / A2 có 5 bài (bài cũ + 4 bài thêm), đủ 3 câu hỏi; lượt 2 của unit chưa qua là bài khác lượt 1', async ({ page, errors }) => {
  await open(page);
  const n = await page.evaluate(() => { const w = window as any; return w.eval('UNITS').filter((u: any) => (u.level === 'A1' || u.level === 'A2') && u.reading).map((u: any) => w.eval('ndTexts')(u).filter((r: any) => r.qs.length >= 3).length); });
  expect(n.length).toBe(174);
  expect(Math.min(...n)).toBe(5);
  const uid = await page.evaluate(() => (window as any).eval('UNITS').filter((u: any) => u.level === 'A1')[7].id as string);
  await page.evaluate((u: string) => (window as any).eval('ndRead')(u, false), uid);
  const a = await page.evaluate(() => (window as any).eval('ui').read.rd.id as string);
  await answerAll(page);
  await page.evaluate(() => { const st = (window as any).eval('st'); st.offset = (st.offset || 0) + 1; });
  await page.evaluate((u: string) => (window as any).eval('ndRead')(u, false), uid);
  const b = await page.evaluate(() => (window as any).eval('ui').read.rd as any);
  expect(b.id).not.toBe(a);
  expect(b.uid).toBe(uid);
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('v164 ôn theo chỗ thiếu: từ đến hạn ở nhiều unit đã qua → não chọn bài chứa chúng, hỏi nghĩa đúng các từ đó, bằng chứng vào unit của từng từ', async ({ page, errors }) => {
  await open(page);
  const setup = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), us = w.eval('UNITS').filter((u: any) => u.level === 'A1').slice(10, 16);
    for (const u of us) { w.eval('U')(u.id).passed = true; for (const x of u.words) { const s = w.eval('W')(x.id); s.learned = true; s.due = t; } }
    w.eval('st').nd.rd = {}; return us.map((u: any) => u.id); });
  await page.evaluate((u: string) => (window as any).eval('ndRead')(u, false), setup[0]!);
  const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read; return { owner: R.rd.uid, vq: R.vq.map((q: any) => ({ wid: q.wid, tg: q.tg, unit: w.eval('UNIT_OF')[q.wid].id })) }; });
  expect(R.vq.length).toBeGreaterThan(0);
  expect(R.vq.every((q: any) => q.tg)).toBe(true);   // mọi câu nghĩa từ nhắm từ đang thiếu
  expect(setup).toContain(R.owner);
  await answerAll(page);
  await expect(page.locator('#app .fb')).toContainText('Bài này nhắm từ bạn đang thiếu');
  const ev = await page.evaluate(() => (window as any).eval('st').e.ev.led.filter((x: any) => /^nd:[^:]+:rv$/.test(x.item || '')).map((x: any) => ({ wid: x.item.split(':')[1], node: x.node })));
  for (const q of R.vq) expect(ev).toContainEqual({ wid: q.wid, node: 'u:' + q.unit });
  expect(errors).toEqual([]);
});

test('v164 ✍️ viết theo chỗ thiếu: dùng đủ 3 từ trong câu + đúng cấu trúc → đạt, bằng chứng mức 4; liệt kê từ trần → không đạt; 100 hạt bài mẫu đạt', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any, t = w.eval('today()'), us = w.eval('UNITS').filter((u: any) => u.level === 'A1').slice(0, 4);
    for (const u of us) { w.eval('U')(u.id).passed = true; for (const x of u.words) { const s = w.eval('W')(x.id); s.learned = true; s.due = t; } } });
  const r = await page.evaluate(() => { const w = window as any, S = w.eval('WRG').gap, rng = w.eval('rpgRng'), sc = w.eval('wrgScore'), ok = w.eval('WRG_OK'), bad: string[] = [];
    for (let i = 1; i <= 100; i++) { const t = S.make(rng(i * 7919), 'A1'), x = sc(t, t.m); if (x.s < ok || x.pts.some((p: boolean) => !p)) bad.push(`${i}: ${x.s} ${t.m}`); }
    const t = S.make(rng(3), 'A1'), words = t.pts.filter((p: any) => p.wid).map((p: any) => w.eval('WORD')[p.wid].word), bare = sc(t, words.join(', ') + '.');
    return { bad, bare: bare.s, barePts: bare.pts.filter(Boolean).length }; });
  expect(r.bad).toEqual([]);
  expect(r.bare).toBeLessThan(0.6); expect(r.barePts).toBe(0);
  await page.evaluate(() => (window as any).eval('startWrg')('gap', true));
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  const m = await page.evaluate(() => (window as any).eval('ui').wrg.t.m as string);
  await page.locator('#wrgin').fill(m);
  await page.locator('[data-act="wrgsubmit"]').click();
  await expect(page.locator('#app .fb.good')).toContainText('Đạt');
  const ev = await page.evaluate(() => (window as any).eval('st').e.ev.led.filter((x: any) => /^ndw:/.test(x.item || '')).map((x: any) => ({ lv: x.lv ?? x.level, ok: x.ok, n: x.node })));
  expect(ev.length).toBe(4);
  expect(ev.every((x: any) => x.ok)).toBe(true);
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('v164 kho bài tải riêng: lần mở app đầu chưa đọc data/rd-* (không thêm việc cho luồng chính); vào Ôn luyện thì tải, ndTexts có đủ 5 bài', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  // service worker có thể tải sẵn tệp để dùng khi mất mạng (detailWarm), nhưng app chưa đọc tệp
  expect(await page.evaluate(() => (window as any).eval('READS').ready.size)).toBe(0);
  await page.evaluate(() => { const w = window as any; w.eval('st').onboarded = true; w.eval("ui.ndLv='A1'"); w.eval('save()'); w.eval("go('nd')"); });
  await page.waitForFunction(() => (window as any).eval("readsOk('A1')"), null, { timeout: 30000 });
  const n = await page.evaluate(() => { const w = window as any, u = w.eval('UNITS').find((x: any) => x.level === 'A1' && x.reading); return w.eval('ndTexts')(u).length; });
  expect(n).toBe(5);
  expect(errors).toEqual([]);
});
