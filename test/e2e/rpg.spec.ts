import AxeBuilder from '@axe-core/playwright';
import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v159 🎭 Đóng vai tình huống A1 + Nói theo đề chấm theo lời chép (người sáng lập 18/10/2026).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); });
}

test('v159 chấm lời chép: làm đúng việc (cụm chức năng + đúng món / số), không bắt y hệt câu mẫu; đánh vần; dãy số', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const ok = (window as any).eval('spkOk');
    const need = { any: ['can i have', "i'd like", 'i would like'], all: ['coffee', 'cake', '2'] };
    return [ok(need, 'I would like two coffees and a cake please'), ok(need, 'Two coffee and cake'), ok(need, 'Can I have 2 coffees and a cake?'),
      ok({ spell: 'minh' }, 'M I N H'), ok({ spell: 'minh' }, 'M N'), ok({ digits: '0912345678' }, 'oh nine one two three four five six seven eight'), ok({ all: ['25'] }, "It's twenty five dollars")]; });
  expect(r).toEqual([true, false, true, true, false, true, true]);
  expect(errors).toEqual([]);
});

test('v159 đóng vai quán cà phê: thẻ ở Học bài (Hội thoại A1); nói đúng việc từng lượt → đạt, ghi bằng chứng chức năng (ctx rp), Can-Do gọi đồ ở quán đạt; WCAG', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.eval("ui.talkLv='A1'"); w.eval("ui.talkTab='hoithoai'"); w.eval("go('talk')"); });
  await expect(page.locator('#app [aria-label="Đóng vai tình huống"] [data-act="rpggo"][data-v="cafe"]')).toBeVisible();
  await page.locator('#app [data-act="rpggo"][data-v="cafe"]').click();
  await expect(page.locator('#bnav [data-go="lib"]')).toHaveAttribute('aria-current', 'page');
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  for (let k = 0; k < 20; k++) {
    const st = await page.evaluate(() => { const w = window as any, R = w.eval('ui').rpg; if (R.done) return 'done'; const l = R.lines[R.i]; if (!l.vi) return 'other';
      if (R.res[R.i]) return 'answered'; w.eval('spkTyped')[w.eval('rpgKey')(R)] = l.t; w.eval('render()'); return 'mine'; });
    if (st === 'done') break;
    if (st === 'other' || st === 'answered') { await page.locator(`#app [data-act="${st === 'other' ? 'rpgstep' : 'rpgnext'}"]`).click(); continue; }
    await page.locator('#app [data-act="rpgcheck"]').click();
    await expect(page.locator('#app .fb.good')).toContainText('Làm được');
  }
  await expect(page.locator('#app h1')).toContainText('Làm được 4/4 lượt');
  const r = await page.evaluate(() => { const w = window as any, st = w.eval('st'), led = st.e.ev.led.filter((x: any) => x.ctx === 'rp');
    const cd = w.eval('CANDO').find((c: any) => c.id === 'a1-com1'), acts = cd.ref.flatMap((x: any) => w.eval('cdActs')(x, 'A1'));
    return { best: st.rpg.cafe.best, n: led.length, fn: [...new Set(led.map((x: any) => x.node))].sort(), rpg: acts.some((a: any) => /Đóng vai: Gọi đồ/.test(a.t) && a.done), self: cd.ref.some((x: any) => x.t === 'rp') }; });
  expect(r).toEqual({ best: 1, n: 4, fn: ['fn:a1-request', 'fn:a1-thank'], rpg: true, self: false });
  expect(errors).toEqual([]);
});

test('v159 nói sai việc → chưa đạt lượt đó; Ôn luyện đề xuất các tình huống còn thiếu cho mục tiêu A1', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("startRpg('taxi')"));
  await page.locator('#app [data-act="rpgstep"]').click();
  await page.evaluate(() => { const w = window as any, R = w.eval('ui').rpg; w.eval('spkTyped')[w.eval('rpgKey')(R)] = 'I like coffee'; w.eval('render()'); });
  await page.locator('#app [data-act="rpgcheck"]').click();
  await expect(page.locator('#app .fb.bad')).toContainText('Chưa đúng việc');
  await page.evaluate(() => { const w = window as any; w.eval("ui.ndLv='A1'"); w.eval("go('nd')"); });
  await expect(page.locator('#app [aria-label="Đóng vai còn thiếu"] [data-v="taxi"]')).toBeVisible();
  await page.locator('#app [aria-label="Đóng vai còn thiếu"] [data-v="taxi"]').click();
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

test('v159 Nói theo đề: chấm theo lời chép (đủ từ + cụm hữu ích + ý đã nói ≥ 60%) thay cho tự chấm 5 tiêu chí', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.eval("startSTask('a1-s1')"); const S = w.eval('ui').stk; S.phase = 'rate';
    w.eval('spkTyped')[S.key] = "Hello! My name is Lan and I'm twenty years old. I'm from Hue, but I live in Hanoi now. I'm a student at a university. In my free time, I like reading books."; w.eval('render()'); });
  await expect(page.locator('#app')).toContainText('Máy nghe ra');
  for (const c of await page.locator('#app [data-stck]').all()) await c.check();
  await expect(page.locator('#app')).toContainText(/Điểm: \d+%/);
  await page.locator('#app [data-act="stsave"]').click();
  expect(await page.evaluate(() => (window as any).eval("stDone('a1-s1')"))).toBe(true);
  expect(errors).toEqual([]);
});

test('v159 khuôn tình huống: 100 hạt × mọi tình huống, câu mẫu luôn qua luật chấm của chính nó; mỗi tình huống có ≥ 3 lượt nói', async ({ page, errors }) => {
  await open(page);
  const bad = await page.evaluate(() => { const w = window as any, RPG = w.eval('RPG'), rng = w.eval('rpgRng'), ok = w.eval('spkOk'), out: string[] = [];
    for (const [id, S] of Object.entries<any>(RPG)) for (let seed = 1; seed <= 100; seed++) { const ls = S.make(rng(seed * 7919)), me = ls.filter((l: any) => l.vi);
      if (me.length < 3) out.push(`${id}: ít lượt`);
      for (const l of me) if (!ok(l.need, l.t)) out.push(`${id}#${seed}: ${l.t}`); }
    return out.slice(0, 10); });
  expect(bad).toEqual([]);
  expect(errors).toEqual([]);
});

test('v160 ✍️ viết theo tình huống: đủ ý + đủ từ → đạt; thiếu ý → chưa đạt; 100 hạt × mọi khuôn, bài mẫu luôn đạt; Can-Do viết lời mời có ref máy chấm', async ({ page, errors }) => {
  await open(page);
  const bad = await page.evaluate(() => { const w = window as any, WRG = w.eval('WRG'), rng = w.eval('rpgRng'), sc = w.eval('wrgScore'), out: string[] = [];
    for (const [id, S] of Object.entries<any>(WRG)) for (let seed = 1; seed <= 100; seed++) { const t = S.make(rng(seed * 7919)), r = sc(t, t.m); if (r.s < 0.6 || r.pts.some((x: boolean) => !x)) out.push(`${id}#${seed}: ${t.m}`); }
    return out.slice(0, 5); });
  expect(bad).toEqual([]);
  await page.evaluate(() => (window as any).eval("startWrg('invite')"));
  const t = await page.evaluate(() => (window as any).eval('ui').wrg.t);
  await page.locator('#wrgin').fill('Hi! Do you want to come with me? It will be fun. See you soon, my friend. I am very happy today and I hope you are well too.');
  await page.locator('#app [data-act="wrgsubmit"]').click();
  await expect(page.locator('#app .fb.bad')).toContainText('Chưa đạt');
  await page.locator('#app [data-act="wrggo"]').click();
  const t2 = await page.evaluate(() => (window as any).eval('ui').wrg.t);
  await page.locator('#wrgin').fill(t2.m + ' I hope you can come. It will be a lot of fun!');
  await page.locator('#app [data-act="wrgsubmit"]').click();
  await expect(page.locator('#app .fb.good')).toContainText('Đạt');
  expect(t.p).toBeTruthy();
  const cd = await page.evaluate(() => { const w = window as any, c = w.eval('CANDO').find((x: any) => x.id === 'a1-ski4'); return c.ref.some((r: any) => r.t === 'wrg'); });
  expect(cd).toBe(true);
  const ax = await new (await import('@axe-core/playwright')).default({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('v160 → v163 ▶ Ôn tiếp tự chọn loại bài: bài đọc theo chỗ thiếu trước, không lặp một loại quá 2 lần liền (xen đóng vai / viết / nói theo đề chưa đạt)', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.eval("ui.ndLv='A1'"); w.eval('st').nd.lk = ['read', 'read']; w.eval("go('nd')"); });
  await expect(page.locator('#app [aria-label="Ôn tiếp"]')).toContainText('🎭 Đóng vai');
  await page.locator('#app [data-act="ndnext"]').first().click();
  expect(await page.evaluate(() => (window as any).eval('ui').view)).toBe('rpg');
  const r = await page.evaluate(() => { const w = window as any, st = w.eval('st'), plan = w.eval('ndPlan');
    st.nd.lk = []; const a = plan('A1').k;
    st.nd.lk = ['read', 'read']; const b = plan('A1').k;
    st.rpg = Object.fromEntries(Object.keys(w.eval('RPG')).map((k: string) => [k, { best: 1 }])); st.wrg = Object.fromEntries(Object.keys(w.eval('WRG')).map((k: string) => [k, { best: 1 }]));
    const c = plan('A1').k;   // v162 còn Nói theo đề chưa đạt → đưa Nói theo đề
    for (const t of w.eval('STASKS')) st.stask[t.id] = [{ day: 0, s: 1, w: 30 }];
    return { a, b, c, d: plan('A1').k }; });
  expect(r).toEqual({ a: 'read', b: 'rpg', c: 'stk', d: 'read' });
  expect(errors).toEqual([]);
});
