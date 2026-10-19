import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v162 (người sáng lập 18/10/2026): "Người học có đủ kiến thức thì chỉ dùng Ôn luyện vẫn phải đạt được mục tiêu; chỉ dùng Học thì vẫn đạt được."
// Học bài: ôn lồng (từ đến hạn của unit cũ xen vào lượt luyện) để có 🔁 Nhớ. Ôn luyện: đủ ngữ pháp (điểm mỏng), Nói theo đề, viết chuyện 3 cảnh.
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
}
// Trả lời đúng hết một lượt luyện bằng hàm của app (không qua giao diện), trả về mã từ đã xen.
const runPractice = (page: Page, uid: string) => page.evaluate((id: string) => { const w = window as any, u = w.eval('UNITS').find((x: any) => x.id === id);
  w.eval('money')().e = 99;   // năng lượng đủ cho nhiều lượt luyện liền (mô phỏng nhiều ngày)
  w.eval('startSession')('practice', w.eval('mixDue')(u, w.eval('practiceItems')(u.words)), u.id);
  const s = w.eval('ui').sess, mix = s.q.filter((x: any) => x.mix).map((x: any) => x.wid);
  for (let i = 0; i < s.q.length; i++) { w.eval('answer')(true); w.eval('next')(); }
  return mix; }, uid);

test('v162 Học bài một mình: lượt luyện unit mới xen ≤ 4 từ đến hạn của unit cũ (có nhãn), bằng chứng vào unit cũ, thanh 🔁 Nhớ lên', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await open(page);
  const us = await page.evaluate(() => (window as any).eval('UNITS').filter((u: any) => u.level === 'A1').slice(0, 8).map((u: any) => u.id) as string[]);
  const mem0 = await page.evaluate(() => (window as any).eval('EM').parts('cefr-a1').mem as number);
  // Ngày 0: học và luyện 3 unit đầu (chưa có từ đến hạn nên chưa xen)
  for (const u of us.slice(0, 3)) {
    await page.evaluate((id: string) => { const w = window as any; for (const x of w.eval('UNITS').find((y: any) => y.id === id).words) { const s = w.eval('W')(x.id); s.learned = true; } }, u);
    expect(await runPractice(page, u)).toEqual([]);
  }
  // 4 ngày sau: mọi từ của 3 unit đó đến hạn; chỉ dùng lượt luyện của unit MỚI ở Học bài
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.offset = (st.offset || 0) + 4; w.eval('save()'); });
  await page.evaluate((ids: string[]) => { const w = window as any, t = w.eval('today()'); for (const id of ids) for (const x of w.eval('UNITS').find((y: any) => y.id === id).words) w.eval('W')(x.id).due = t; }, us.slice(0, 3));
  const own = await page.evaluate((ids: string[]) => { const w = window as any, m: Record<string, string> = {}; for (const id of ids) for (const x of w.eval('UNITS').find((y: any) => y.id === id).words) m[x.id] = id; return m; }, us.slice(0, 3));
  // nhãn trên màn câu xen
  await page.evaluate((id: string) => { const w = window as any, u = w.eval('UNITS').find((x: any) => x.id === id);
    w.eval('money')().e = 99; w.eval('startSession')('practice', w.eval('mixDue')(u, w.eval('practiceItems')(u.words)), u.id); const s = w.eval('ui').sess; s.i = s.q.findIndex((x: any) => x.mix); w.eval('render()'); }, us[3]!);
  await expect(page.locator('#app .q .hint').first()).toContainText('🔁 Ôn lại từ A1 · Unit');
  // nhãn mới đạt WCAG AA (màn câu có hiệu ứng hiện dần nên chờ hết hiệu ứng; nhãn ⚡ XP của màn câu là phần cũ, ngoài phạm vi bản này)
  await expect(async () => { const ax = await new AxeBuilder({ page }).include('#app .q .hint').withTags(AXE).analyze(); expect(ax.violations.map(v => v.id)).toEqual([]); }).toPass({ timeout: 10000 });
  await noHorizontalScroll(page);
  await page.evaluate(() => { (window as any).eval('ui').sess = null; });
  let mixed: string[] = [];
  for (const u of us.slice(3, 8)) { const m = await runPractice(page, u); expect(m.length).toBeLessThanOrEqual(4); mixed = mixed.concat(m); }
  expect(mixed.length).toBeGreaterThanOrEqual(15);
  for (const wid of mixed) expect(own[wid]).toBeTruthy();   // chỉ từ của unit khác
  const ev = await page.evaluate((wid: string) => (window as any).eval('st').e.ev.led.filter((x: any) => x.item?.startsWith('w:' + wid + ':')).map((x: any) => x.node), mixed[0]!);
  expect(ev.every((n: string) => n === 'u:' + own[mixed[0]!])).toBe(true);
  const mem1 = await page.evaluate(() => (window as any).eval('EM').parts('cefr-a1').mem as number);
  expect(mem1).toBeGreaterThan(mem0);
  expect(errors).toEqual([]);
});

test('v162 Học bài: hết unit mới mà còn từ đến hạn → "Luyện lại" unit cũ (bài Học bài, không phải tab Ôn luyện)', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), U = w.eval('U');
    for (const u of w.eval('UNITS')) U(u.id).passed = true;
    const u0 = w.eval('UNITS')[2]; for (const x of u0.words) { const s = w.eval('W')(x.id); s.learned = true; s.due = t; }
    const m = w.eval('mainAction')({ learn: true }); return { h: m.h, btn: m.btn, id: u0.id }; });
  expect(r.h).toContain('Luyện lại');
  expect(r.btn).toContain(`data-act="practice" data-u="${r.id}"`);
  expect(errors).toEqual([]);
});

test('v162 Ôn luyện một mình: mọi điểm ngữ pháp A1 / A2 có mặt ở ≥ 2 bài đọc (kể cả điểm mỏng); a / an qua được sau 2 bài khác nhau', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, out: any = {};
    for (const L of ['A1', 'A2']) { const us = w.eval('UNITS').filter((u: any) => u.level === L && u.reading), gl = w.eval('GRAMMAR').levels.find((x: any) => x.id === L), n = new Map();
      for (const u of us) for (const q of w.eval('ndGQ')(u)) if (w.eval('GPT')[q.gid].level === L) n.set(q.gid, (n.get(q.gid) || 0) + 1);
      out[L] = gl.points.filter((p: any) => (p.mc || []).length && (n.get(p.id) || 0) < 2).map((p: any) => p.id); }
    out.thin = w.eval('ndThin')('A1').map((p: any) => p.id); return out; });
  expect(r.thin).toEqual(expect.arrayContaining(['g-a1-03', 'g-a1-26']));
  expect(r.A1).toEqual([]);
  expect(r.A2).toEqual([]);
  // a / an: đúng ở 2 bài khác nhau → qua
  const units = await page.evaluate(() => { const w = window as any; return w.eval('UNITS').filter((u: any) => u.level === 'A1' && u.reading && w.eval('ndGQ')(u).some((q: any) => q.gid === 'g-a1-03')).slice(0, 2).map((u: any) => u.id); });
  expect(units).toHaveLength(2);
  for (const uid of units) {
    await page.evaluate((u: string) => { const w = window as any; w.eval('ndRead')(u, false); const R = w.eval('ui').read; R.gq = R.gq.filter((q: any) => q.gid === 'g-a1-03'); w.eval('render()'); }, uid);
    const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read;
      return { q: R.rd.qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)) }; });
    for (const [i, k] of R.q.entries()) await page.locator(`[data-rpick="${i}:${k}"]`).click();
    for (const [j, k] of R.v.entries()) await page.locator(`[data-ndv="${j}:${k}"]`).click();
    for (const [j, k] of R.g.entries()) await page.locator(`[data-ndg="${j}:${k}"]`).click();
    await page.locator('[data-act="rsubmit"]').click();
  }
  expect(await page.evaluate(() => (window as any).eval('G')('g-a1-03').passed)).toBe(true);
  expect(errors).toEqual([]);
});

test('v162 ✍️ viết chuyện 3 cảnh: 100 hạt × A1 / A2, bài mẫu đạt; lạc đề hoặc không dùng quá khứ thì chưa đủ ý', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, S = w.eval('WRG').story, rng = w.eval('rpgRng'), sc = w.eval('wrgScore'), ok = w.eval('WRG_OK'), bad: string[] = [];
    for (let i = 1; i <= 100; i++) for (const L of ['A1', 'A2']) { const t = S.make(rng(i * 7919), L), x = sc(t, t.m);
      if (x.s < ok || x.pts.some((p: boolean) => !p) || t.minW !== (L === 'A2' ? 35 : 25)) bad.push(`${i}/${L}: ${x.s} ${t.m}`); }
    const t = S.make(rng(5), 'A2'), off = sc(t, 'I like music. My house is big. I have a cat and a dog. I go to school every day. It is nice.'), now = sc(t, t.m.replace(/ was | were | saw | read | called | arrived | made | fell | went | bought | loved | got | phoned | came | found | gave | thanked | helped | swam | felt | had | blew | ate | laughed | talked | shared | started | waited/g, ' is '));
    return { bad, off: off.pts.filter(Boolean).length, now: now.pts[3] }; });
  expect(r.bad).toEqual([]);
  expect(r.off).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]);
});

test('v162 Ôn luyện có 🗣️ Nói theo đề: đóng vai + viết đã đạt → ▶ Ôn tiếp đưa Nói theo đề, mở trong tab Ôn luyện, nút về Ôn luyện; WCAG', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any, st = w.eval('st');
    st.rpg = Object.fromEntries(Object.keys(w.eval('RPG')).map((k: string) => [k, { best: 1 }])); st.wrg = Object.fromEntries(Object.keys(w.eval('WRG')).map((k: string) => [k, { best: 1 }]));
    st.nd.lk = ['read', 'read']; w.eval('save()'); w.eval("go('nd')"); });   // v163 bài đọc đi trước; vừa đọc 2 bài liền thì xen bài khác loại
  expect(await page.evaluate(() => (window as any).eval('ndPlan')('A1').k)).toBe('stk');
  await expect(page.locator('#app [aria-label="Ôn tiếp"]')).toContainText('🗣️ Nói theo đề');
  await page.locator('#app [data-act="ndnext"]').click();
  expect(await page.evaluate(() => (window as any).eval('ui').view)).toBe('stask');
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('#app .back')).toHaveText('← Học nhanh');
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  await noHorizontalScroll(page);
  // ▶ Hôm nay cũng có bước Nói theo đề (khi bài âm / chức năng không chặn)
  const at = await page.evaluate(() => { const w = window as any, st = w.eval('st'), miss = w.eval('EM').parts('cefr-a1').miss;
    for (const n of miss) { const i = n.indexOf(':'), k = n.slice(0, i), id = n.slice(i + 1); if (k === 'ph') st.sounds[id] = { best: 1 }; if (k === 'fn') st.fn[id] = { best: 1 }; }
    return w.eval('dayPlan()').steps.find((s: any) => s.k === 'use')?.at; });
  expect(at).toMatch(/data-act="daystk"/);
  expect(errors).toEqual([]);
});
