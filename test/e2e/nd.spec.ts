import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v149 🗣 Nói & Đọc (người sáng lập 17/10/2026): con đường thứ ba, song song ⚔️ Chơi và 📘 Học. Gom luyện nói, đọc to, phát âm;
// chỉ theo dõi riêng: không bằng chứng, không Can-Do, không mục tiêu ngày / XP. Kết quả phát âm đã có trước đó vẫn giữ (bản chụp st.ndfz).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  // v160 ▶ Ôn tiếp chọn cả loại bài: các test đọc / nghe ở đây coi như đóng vai + viết đã đạt để não đưa bài đọc.
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true;
    st.rpg = Object.fromEntries(Object.keys(w.eval('RPG')).map((k: string) => [k, { best: 1, n: 1, days: [] }])); st.wrg = Object.fromEntries(Object.keys(w.eval('WRG')).map((k: string) => [k, { best: 1, n: 1 }]));
    for (const t of w.eval('STASKS')) st.stask[t.id] = [{ day: 0, s: 1, w: 30 }];   // v162 Nói theo đề cũng coi như đạt
    w.eval('save()'); w.eval("go('nd')"); });
}
const snap = (page: Page) => page.evaluate(() => { const w = window as any, st = w.eval('st'), t = w.eval('today()');
  return { led: st.e.ev.led.length, xp: st.xp, ok: (st.daily[t] || {}).ok || 0, nd: (st.nd.d[t] || {}).n || 0 }; });

for (const scheme of ['light', 'dark'] as const) {
  test(`tab 🗣 Nói & Đọc: có trên thanh điều hướng, gom đủ chức năng, bảng theo dõi riêng; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Học nhanh', level: 1 })).toBeVisible();
    await expect(page.locator('#app [data-act="ndnext"]')).toBeVisible();   // v157 ▶ Ôn tiếp
    // bấm thật để mở; vẽ lại màn (như khi engine tải xong) thì mục vẫn mở
    await expect(async () => { await page.locator('#app details.ndph:not([open]) summary').click({ timeout: 2000 }); }).toPass().catch(() => {});
    await page.evaluate(() => (window as any).eval('render()'));
    await expect(page.locator('#app details.ndph')).toHaveAttribute('open', '');
    for (const sel of ['[data-act="shgo"]', '[data-act="gp"][data-kind="talk"]', '[data-go="phon"]', '[data-act="gp"][data-kind="read"]', '[data-act="paste"]', '[data-act="rago"]', '[data-go="sounds"]', '[data-act="csgo"]'])
      await expect(page.locator(`#app details.ndph ${sel}`).first()).toBeVisible();
    await expect(page.locator('#app')).toContainText('làm rồi ôn lại');
    await page.locator('[data-act="ndlv"][data-v="A2"]').click();
    await expect(page.locator('#app [data-act="shgo"]')).toHaveAttribute('data-lv', 'A2');
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('chuyển hẳn: tab Nói / Đọc của 📘 Học và màn Tôi không còn các mục cũ, chỉ còn lời chỉ sang 🗣 Nói & Đọc', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.eval("ui.talkTab='noi'"); w.eval("go('talk')"); });
  await expect(page.locator('#app [data-act="rxgo"]').first()).toBeVisible();
  for (const sel of ['[data-act="shgo"]', '[data-act="csgo"]', '[data-go="sounds"]', '[data-act="paste"]', '[data-act="gp"]', '[data-act="pdxgo"]']) await expect(page.locator(`#app ${sel}`)).toHaveCount(0);
  await expect(page.locator('#app [data-go="nd"]').first()).toBeVisible();
  await page.evaluate(() => { const w = window as any; w.eval("ui.talkTab='doc'"); w.eval("go('talk')"); });
  for (const sel of ['[data-act="rago"]', '[data-act="paste"]', '[data-act="gp"]']) await expect(page.locator(`#app ${sel}`)).toHaveCount(0);
  await page.evaluate(() => (window as any).eval("go('more')"));
  for (const sel of ['[data-go="phon"]', '[data-go="paste"]']) await expect(page.locator(`#app ${sel}`)).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('v151 tính: bộ cặp âm ghi bằng chứng nguồn Nói & Đọc (nd-pair), không cộng mục tiêu ngày / XP; Nói nhại chỉ tăng theo dõi riêng', async ({ page, errors }) => {
  await open(page);
  const s0 = await snap(page);
  await page.evaluate(() => { const w = window as any; w.eval('ui').ndPh = true; w.eval('render()'); });   // v157 mở mục 🗣 Luyện phát âm
  await page.locator('#app [data-go="sounds"]').click();
  await page.locator('#app [data-snd]').first().click();
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  await page.evaluate(() => { const w = window as any, s = w.eval('ui').snd; w.eval('sAnswer')(s.q[s.i].k); });
  const s1 = await snap(page);
  expect(s1.led).toBe(s0.led + 1); expect(s1.xp).toBe(s0.xp); expect(s1.ok).toBe(s0.ok); expect(s1.nd).toBe(s0.nd + 1);
  expect(await page.evaluate(() => { const l = (window as any).eval('st').e.ev.led; return l[l.length - 1].ctx; })).toBe('nd-pair');
  await page.evaluate(() => { const w = window as any; w.eval("go('nd')"); });
  await page.evaluate(() => { const w = window as any; w.eval('ui').ndPh = true; w.eval('render()'); });   // v157 mở mục 🗣 Luyện phát âm
  await page.locator('#app [data-act="shgo"]').click();
  await page.evaluate(() => { const w = window as any; w.eval('ui').sh.self = 1; w.eval('shNext')(); });
  const s2 = await snap(page);
  expect(s2.led).toBe(s1.led); expect(s2.xp).toBe(s0.xp); expect(s2.nd).toBe(s1.nd + 1);
  await page.evaluate(() => (window as any).eval("go('nd')"));
  await expect(page.locator('#app')).toContainText(`Hôm nay ${s2.nd} câu`);
  expect(errors).toEqual([]);
});

// v157 Ôn luyện = đọc / nghe nguyên bài + câu hỏi hiểu (+ 1–2 câu ngữ pháp của bài). Đúng ≥ 80% không xem nghĩa → unit qua.
async function ndRead(page: Page, uid: string, listen = false): Promise<void> {
  await page.evaluate(([u, l]) => (window as any).eval('ndRead')(u, l), [uid, listen] as const);
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
}
// chọn đáp án qua giao diện: đúng hết, hoặc sai ở các câu hiểu có chỉ số trong `bad`
async function answer(page: Page, bad: number[] = [], gBad = false): Promise<void> {
  const R = await page.evaluate(() => { const w = window as any, R = w.eval('ui').read;
    return { q: R.rd.qs.map((q: any, i: number) => R.order[i].indexOf(q.a)), g: R.gq.map((q: any) => q.order.indexOf(q.a)), v: R.vq.map((q: any) => q.order.indexOf(q.a)) }; });
  for (const [i, k] of R.q.entries()) await page.locator(`[data-rpick="${i}:${bad.includes(i) ? (k + 1) % 3 : k}"]`).click();
  for (const [j, k] of R.v.entries()) await page.locator(`[data-ndv="${j}:${k}"]`).click();   // v158 nghĩa từ trong bài
  for (const [j, k] of R.g.entries()) await page.locator(`[data-ndg="${j}:${gBad ? (k + 1) % 2 : k}"]`).click();
  await page.locator('[data-act="rsubmit"]').click();
}
test('v157 ▶ Ôn tiếp: đọc nguyên bài, không lộ nghĩa; đúng hết → unit qua (ctx nd), từ vào lịch ôn +3 ngày; có câu ngữ pháp của bài; WCAG AA', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.eval("ui.ndLv='A1'"); w.eval('render()'); });
  await page.locator('#app [data-act="ndnext"]').click();
  await expect(page.locator('#app .eyebrow').first()).toContainText('⚡ Học nhanh');
  const uid = await page.evaluate(() => (window as any).eval('ui').read.uid as string);
  expect(uid.startsWith('a1-')).toBe(true);
  await expect(page.locator('#app .reading mark[title]')).toHaveCount(0);   // không lộ nghĩa
  await expect(page.locator('#app [data-act="ndpeek"]')).toBeVisible();
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length as number);
  const s0 = await snap(page);
  expect(await page.evaluate(() => (window as any).eval('ui').read.vq.length as number)).toBeGreaterThan(0);   // v158 có câu nghĩa từ
  await answer(page);   // v164: đạt một lượt là qua ngay (v158 cần lượt thứ hai ngày khác); xác nhận là 🔁 Nhớ sau 3 ngày
  await expect(page.locator('#app .fb.good')).toContainText('nhờ đọc hiểu');
  await expect(page.locator('#app [data-act="rago"]', { hasText: 'Đọc to bài này' })).toBeVisible();   // v158 nối sang đọc to
  const r = await page.evaluate((u: string) => { const w = window as any, st = w.eval('st'), U = w.eval('U'), W = w.eval('W'), t = w.eval('today()'), led = st.e.ev.led;
    const unit = w.eval('UNITS').find((x: any) => x.id === u); const last = led[led.length - 1];
    return { passed: U(u).passed, due: W(unit.words[0].id).due - t, ctx: last.ctx, n: led.length, nodes: [...new Set(led.slice(-8).map((x: any) => x.node.split(':')[0]))] }; }, uid);
  expect(r.passed).toBe(true); expect(r.due).toBe(3); expect(r.ctx).toBe('nd'); expect(r.n).toBeGreaterThan(led0);
  // bài kế: đã qua thì não chọn bài khác
  const s1 = await snap(page); expect(s1.xp).toBe(s0.xp); expect(s1.ok).toBe(s0.ok);   // không tính XP / mục tiêu ngày của Học bài
  // bài kế: không lặp lại bài vừa làm trong ngày
  await page.locator('#app [data-act="ndnext"]').click();
  expect(await page.evaluate(() => (window as any).eval('ui').read.uid as string)).not.toBe(uid);
  await page.evaluate(() => (window as any).eval("go('aim')"));
  await expect(page.locator('#app .cmpleg')).toContainText('nhờ Học nhanh');
  expect(errors).toEqual([]);
});

test('v157 xem bản dịch → lượt này không tính qua unit (câu ghi có trợ giúp); sai nhiều → nút 📘 Học lại bài này về đúng unit', async ({ page, errors }) => {
  await open(page);
  const uid = await page.evaluate(() => (window as any).eval('CONTENT').levels[0].units[4].id as string);
  await ndRead(page, uid);
  await page.locator('#app [data-act="ndpeek"]').click();
  await expect(page.locator('#app details .vi')).toBeVisible();
  await answer(page);
  await expect(page.locator('#app .fb')).toContainText('không tính qua unit');
  const r = await page.evaluate((u: string) => { const w = window as any, l = w.eval('st').e.ev.led; return { passed: !!w.eval('U')(u).passed, asst: l[l.length - 1].asst }; }, uid);
  expect(r).toEqual({ passed: false, asst: 1 });
  await ndRead(page, uid);
  await answer(page, [0, 1]);
  await expect(page.locator('#app .fb.bad')).toContainText('≥ 80%');
  expect(await page.evaluate((u: string) => !!(window as any).eval('U')(u).passed, uid)).toBe(false);
  await page.locator(`#app [data-unit="${uid}"]`, { hasText: 'Học lại bài này' }).click();
  await expect(page.locator('#bnav [data-go="lib"]')).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

test('v157 ngữ pháp trong bài: đúng ở 2 bài khác nhau → điểm ngữ pháp qua; đúng 2 lần cùng một bài thì chưa', async ({ page, errors }) => {
  await open(page);
  const pair = await page.evaluate(() => { const w = window as any, us = w.eval('UNITS').filter((u: any) => u.level === 'A1' && u.reading), gq = w.eval('ndGQ'), m = new Map();
    for (const u of us) for (const q of gq(u)) { const a = m.get(q.gid) || []; a.push(u.id); m.set(q.gid, a); }
    for (const [g, a] of m) if (a.length >= 2) return { g, a: a.slice(0, 2) }; return null; });
  expect(pair).not.toBeNull();
  const { g, a } = pair!;
  const go = async (uid: string) => { await page.evaluate(([u, gid]) => { const w = window as any; w.eval('ndRead')(u, false); const R = w.eval('ui').read; R.gq = R.gq.filter((q: any) => q.gid === gid); w.eval('render()'); }, [uid, g] as const); await answer(page); };
  await go(a[0]); await go(a[0]);
  expect(await page.evaluate((x: string) => !!(window as any).eval('G')(x).passed, g)).toBe(false);
  await go(a[1]);
  await expect(page.locator('#app .fb')).toContainText('đúng ở 2 bài khác nhau');
  expect(await page.evaluate((x: string) => (window as any).eval('G')(x).passed, g)).toBe(true);
  expect(errors).toEqual([]);
});

test('v151 Can-Do Nói của Nói & Đọc: máy nghe ra ≥ 80% ở 2 ngày khác nhau thì đạt; tự chấm không tính', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, st = w.eval('st'), cd = () => w.eval('cdActs')({ t: 'ndsay', v: ['A1'] }, 'A1')[0].done;
    w.eval('ndSay')('A1', [{ asr: false, p: 1 }, { asr: false, p: 1 }]); const self = cd();
    w.eval('ndSay')('A1', [{ asr: true, p: .9 }, { asr: true, p: .85 }]); const one = cd();
    st.nd.say.A1.unshift(w.eval('today()') - 1); const two = cd(); return { self, one, two }; });
  expect(r).toEqual({ self: false, one: false, two: true });
  expect(errors).toEqual([]);
});

test('kết quả phát âm cũ vẫn giữ: bản cũ đã đạt bộ cặp âm → sau khi lên bản mới, Can-Do vẫn tính đạt', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  const id = await page.evaluate(() => Object.keys((window as any).eval('SND'))[0] as string);
  // Ghi trạng thái "bản cũ" trước khi app chạy (app tự lưu khi rời trang nên không ghi đè sau khi đã mở).
  const raw = await page.evaluate((k: string) => { const w = window as any; w.eval('save()'); const r = JSON.parse(localStorage.getItem('vocab-ladder-v1')!);
    r.onboarded = true; r.sounds = { [k]: { best: 1, n: 1, last: 1 } }; delete r.ndfz; delete r.nd; return JSON.stringify(r); }, id);
  // chờ tải xong chi tiết bài học: tải lại giữa lúc đang tải thì WebKit báo lỗi "access control checks" (lượt tải bị huỷ)
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.addInitScript((r: string) => { if (!sessionStorage.getItem('nd-seeded')) { sessionStorage.setItem('nd-seeded', '1'); localStorage.setItem('vocab-ladder-v1', r); } }, raw);
  await page.reload();
  await page.waitForFunction(() => (window as any).ELREADY === true);
  expect(await page.evaluate((k: string) => (window as any).eval('cdActs')({ t: 'snd', v: [k] }, 'A1')[0].done, id)).toBe(true);
  expect(errors).toEqual([]);
});

// v152 Nói & Đọc = ôn nhanh cho người đã học: sức khoẻ kiến thức theo cấp, não ưu tiên chỗ đang phai, chỗ quên có nút về đúng bài trong 📘 Học.
test('v158 thanh 🔁 Nhớ của unit tính theo từng từ: ≥ 70% số từ nhớ lại sau ≥ 3 ngày mới tính unit; 5/10 từ thì chưa', async ({ page, errors }) => {
  await open(page);
  await page.waitForFunction(() => { const w = window as any, EM = w.eval('EM'); return !!(EM && EM.parts && EM.parts('cefr-a1')); }, null, { timeout: 30000 });
  const r = await page.evaluate(() => { const w = window as any, st = w.eval('st'), t = w.eval('today()'), EL = w.eval('ELCORE'), EM = w.eval('EM');
    const L = w.eval('CONTENT').levels.find((l: any) => l.id === 'A1'), mem = () => EM.parts('cefr-a1').mem;
    const seed = (u: any, k: number) => { for (const x of u.words.slice(0, k)) for (const d of [t - 5, t - 1, t]) EL.ev(st, { node: 'u:' + u.id, level: 3, ok: true, g: 0, item: 'w:' + x.id + ':rcl', qt: 'typed', ctx: 'rcl', src: 'vocab', ch: 'u:' + u.id }, d); };
    const m0 = mem(); seed(L.units[1], Math.floor(L.units[1].words.length / 2)); const m1 = mem();
    seed(L.units[2], L.units[2].words.length); const m2 = mem(); return { half: m1 - m0, full: m2 - m1 }; });
  expect(r.half).toBe(0);
  expect(r.full).toBe(1);
  expect(errors).toEqual([]);
});

test('v152 sức khoẻ kiến thức: engine chia vững / đang phai / đã quên / chưa học; bảng A1 · A2 hiện ở đầu tab; WCAG AA', async ({ page, errors }) => {
  await open(page);
  await page.waitForFunction(() => { const w = window as any, EM = w.eval('EM'); return !!(EM && EM.health && EM.health('cefr-a1')); }, null, { timeout: 30000 });
  const h = await page.evaluate(() => { const r = (window as any).eval('EM').health('cefr-a1'); return { n: r.solid.length + r.fading.length + r.lost.length + r.open.length, u: r.open.some((x: string) => x.startsWith('u:')) }; });
  expect(h.n).toBeGreaterThan(100); expect(h.u).toBe(true);
  await page.evaluate(() => (window as any).eval('render()'));
  await expect(page.locator('#app [aria-label="Sức khoẻ kiến thức"]')).toContainText('chưa học');
  await expect(page.locator('#app [data-act="ndquick"][data-v="A2"]')).toBeVisible();
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('v152 → v157 não ưu tiên chỗ đang phai: unit chứa "rice" đang phai → ▶ Ôn tiếp A1 chọn bài của unit đó (lý do: đang phai)', async ({ page, errors }) => {
  await open(page);
  await page.waitForFunction(() => { const w = window as any, EM = w.eval('EM'); return !!(EM && EM.health && EM.health('cefr-a1')); }, null, { timeout: 30000 });
  const uid = await page.evaluate(() => { const w = window as any, u = w.eval('UNIT_OF')['rice']; const EM = w.eval('EM'), real = EM.health.bind(EM), n = 'u:' + u.id;
    EM.health = (g: string) => { const r = real(g); if (!r) return r; for (const k of ['solid', 'lost', 'open']) r[k] = r[k].filter((x: string) => x !== n); r.fading = [n, ...r.fading.filter((x: string) => x !== n)]; return r; };
    w.eval("ui.ndLv='A1'"); w.eval('render()'); return u.id as string; });
  await expect(page.locator('#app [aria-label="Ôn tiếp"]')).toContainText('đang phai');
  await page.locator('#app [data-act="ndshow"][data-v="A1"]').click();
  await expect(page.locator(`#app [aria-label="Sức khoẻ kiến thức"] [data-unit="${uid}"]`)).toBeVisible();
  await page.locator('#app [data-act="ndquick"][data-v="A1"]').click();
  expect(await page.evaluate(() => (window as any).eval('ui').read.uid as string)).toBe(uid);
  expect(errors).toEqual([]);
});

// v153 Học bài · Ôn luyện · Mục tiêu: mọi việc ôn về Ôn luyện; não ở Học bài điều phối theo học (không đẩy ôn lên đầu).
test('v153 đổi tên + Ôn tập về Ôn luyện: Học bài không còn nút Ôn tập (chỉ nhắc), Ôn luyện có "Ôn thẻ đến hạn" + chấm đỏ; Việc nên làm ở Học bài vẫn là học tiếp', async ({ page, errors }) => {
  await open(page);
  // một từ đã học đến hạn ôn
  await page.evaluate(() => { const w = window as any, st = w.eval('st'), id = w.eval('UNITS')[0].words[0].id, t = w.eval('today()');
    Object.assign(w.eval('W')(id), { learned: true, due: t, ivl: 1, stage: 1 }); w.eval('save()'); w.eval('render()'); });
  await expect(page.locator('#bnav [data-go="nd"] .badge')).toBeVisible();
  await expect(page.locator('#bnav [data-go="lib"] .badge')).toHaveCount(0);
  await expect(page.locator('#app [aria-label="Ôn thẻ đến hạn"]')).toContainText('1');
  await expect(page.locator('#app [aria-label="Ôn thẻ đến hạn"] [data-act="review"]')).toBeVisible();
  await page.locator('#bnav [data-go="lib"]').click();
  await expect(page.getByRole('heading', { name: '📘 Học bài', level: 1 })).toBeVisible();
  await expect(page.locator('#app .lnext [data-go="review"]')).toHaveCount(0);
  await expect(page.locator('#app .lnext')).toContainText('mục đến hạn ôn');
  await expect(page.locator('#app .lnext b').first()).not.toContainText('đến hạn ôn');
  await page.locator('#app .lnext [data-go="nd"]').click();
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  await page.evaluate(() => (window as any).eval("go('review')"));
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  expect(errors).toEqual([]);
});

// v154 Mục tiêu hai thanh: 📘 Học (đã qua bài cuối) và 🔁 Nhớ (nhớ ra sau ≥ 3 ngày, chưa phai); mở thi khi Học ≥ 80% VÀ Nhớ ≥ 70%.
test('v154 Mục tiêu có hai thanh Học / Nhớ; qua bài cuối unit làm thanh Học tăng; dòng thi chuyển cấp nói luật mới', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("go('aim')"));
  await expect(page.locator('#app [aria-label="Học và Nhớ"]')).toBeVisible({ timeout: 30000 });
  const learn0 = await page.locator('#app [aria-label="Học và Nhớ"] [role="progressbar"]').first().getAttribute('aria-valuenow');
  await page.evaluate(() => { const w = window as any; w.eval('U')(w.eval('UNITS')[0].id).passed = true; w.eval('save()'); w.eval('render()'); });
  await expect(page.locator('#app [aria-label="Học và Nhớ"] [role="progressbar"]').first()).not.toHaveAttribute('aria-valuenow', learn0!);
  await expect(page.locator('#app [aria-label="Học và Nhớ"]')).toContainText('cần 50%');
  await expect(page.locator('#app')).toContainText('Mở khi 📘 Học ≥ 80% và 🔁 Nhớ ≥ 50%');
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

// v157 Học bài cũng có hai thanh Học / Nhớ (người sáng lập 17/10/2026); Ôn luyện không còn danh sách vượt dài và bài lẻ.
test('v157 Học bài hiện hai thanh Học / Nhớ; Ôn luyện gọn: không còn ⚡ Vượt bài đã biết, công cụ phát âm trong mục đóng sẵn', async ({ page, errors }) => {
  await open(page);
  await page.waitForFunction(() => { const w = window as any, EM = w.eval('EM'); return !!(EM && EM.parts && EM.parts('cefr-a1')); }, null, { timeout: 30000 });
  await page.evaluate(() => (window as any).eval('render()'));
  await expect(page.locator('#app [aria-label="Vượt bài đã biết"]')).toHaveCount(0);
  await expect(page.locator('#app details.ndph')).not.toHaveAttribute('open', '');
  await page.locator('#bnav [data-go="lib"]').click();
  const box = page.locator('#app [aria-label^="Học và Nhớ"]');
  await expect(box).toContainText('cần 80%');
  await expect(box.locator('[role="progressbar"]')).toHaveCount(2);
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

// v156 Người chỉ dùng Ôn luyện: hai thanh ngay trong Ôn luyện; vượt cả cấp chỉ đánh dấu unit được hỏi và đúng hết; qua bài → vào lịch ôn sau 3 ngày.
test('v156 vượt cả từ vựng A1: chỉ unit được hỏi và đúng hết được đánh dấu; từ của unit đó vào lịch ôn +3 ngày; Ôn luyện có hai thanh, thẻ chức năng giao tiếp', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, L = w.eval('CONTENT').levels.find((l: any) => l.id === 'A1'), [a, b, c] = L.units.slice(1, 4);
    const res = [{ wid: a.words[0].id, dim: 'rec', correct: true }, { wid: a.words[1].id, dim: 'rcl', correct: true }, { wid: b.words[0].id, dim: 'rec', correct: false },
      ...Array.from({ length: 12 }, (_, i) => ({ wid: a.words[i % a.words.length].id, dim: ['rec', 'rcl', 'spl', 'ctx', 'col'][i % 5], correct: true }))];
    w.eval('ui').sess = { kind: 'place', lvl: 'A1', q: res.map(() => ({})), i: res.length - 1, res, before: {}, ans: null, ord: [] };
    w.eval('ui').view = 'session'; w.eval('next')();
    const U = w.eval('U'), W = w.eval('W'), t = w.eval('today()');
    return { a: U(a.id).passed, b: U(b.id).passed, c: U(c.id).passed, due: W(a.words[0].id).due - t, learned: W(a.words[0].id).learned }; });
  expect(r).toEqual({ a: true, b: false, c: false, due: 3, learned: true });
  await expect(page.locator('#app')).toContainText('chưa được hỏi');
  await page.evaluate(() => { const w = window as any; w.eval("ui.ndLv='A1'"); w.eval("go('nd')"); });
  await page.waitForFunction(() => { const w = window as any, EM = w.eval('EM'); return !!(EM && EM.parts && EM.parts('cefr-a1')); }, null, { timeout: 30000 });
  await page.evaluate(() => (window as any).eval('render()'));
  await expect(page.locator('#app [aria-label="Học và Nhớ A1"]')).toContainText('cần 80%');
  await expect(page.locator('#app details.ndph [data-act="ndfn"]')).toBeAttached();
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});
