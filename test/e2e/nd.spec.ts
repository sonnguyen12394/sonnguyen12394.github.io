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
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); w.eval("go('nd')"); });
}
const snap = (page: Page) => page.evaluate(() => { const w = window as any, st = w.eval('st'), t = w.eval('today()');
  return { led: st.e.ev.led.length, xp: st.xp, ok: (st.daily[t] || {}).ok || 0, nd: (st.nd.d[t] || {}).n || 0 }; });

for (const scheme of ['light', 'dark'] as const) {
  test(`tab 🗣 Nói & Đọc: có trên thanh điều hướng, gom đủ chức năng, bảng theo dõi riêng; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
    await expect(page.getByRole('heading', { name: 'Luyện nói và đọc to' })).toBeVisible();
    for (const sel of ['[data-act="shgo"]', '[data-act="gp"][data-kind="talk"]', '[data-go="phon"]', '[data-act="gp"][data-kind="read"]', '[data-act="paste"]', '[data-act="rago"]', '[data-go="sounds"]', '[data-act="csgo"]'])
      await expect(page.locator(`#app ${sel}`).first()).toBeVisible();
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
  await page.locator('#app [data-go="sounds"]').click();
  await page.locator('#app [data-snd]').first().click();
  await expect(page.locator('#bnav [data-go="nd"]')).toHaveAttribute('aria-current', 'page');
  await page.evaluate(() => { const w = window as any, s = w.eval('ui').snd; w.eval('sAnswer')(s.q[s.i].k); });
  const s1 = await snap(page);
  expect(s1.led).toBe(s0.led + 1); expect(s1.xp).toBe(s0.xp); expect(s1.ok).toBe(s0.ok); expect(s1.nd).toBe(s0.nd + 1);
  expect(await page.evaluate(() => { const l = (window as any).eval('st').e.ev.led; return l[l.length - 1].ctx; })).toBe('nd-pair');
  await page.evaluate(() => { const w = window as any; w.eval("go('nd')"); });
  await page.locator('#app [data-act="shgo"]').click();
  await page.evaluate(() => { const w = window as any; w.eval('ui').sh.self = 1; w.eval('shNext')(); });
  const s2 = await snap(page);
  expect(s2.led).toBe(s1.led); expect(s2.xp).toBe(s0.xp); expect(s2.nd).toBe(s1.nd + 1);
  await page.evaluate(() => (window as any).eval("go('nd')"));
  await expect(page.locator('#app')).toContainText(`Hôm nay ${s2.nd} câu`);
  expect(errors).toEqual([]);
});

test('v151 làm rồi ôn lại: đọc to bài theo cấp → làm bài từ vựng + ngữ pháp của chính bài; đúng ghi bằng chứng nguồn nd, sai vào Ôn tập ngày mai; Mục tiêu có đoạn "nhờ Nói & Đọc"', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any; w.eval('ui').gp = { lv: 'A1', tier: 2, mode: 'say', kind: 'read' }; w.eval("go('gp')"); });
  await page.locator('[data-act="gpnew"]').click();
  await expect(page.locator('#app .eyebrow').first()).toContainText('📖 Đọc to');
  const n = await page.evaluate(() => (window as any).eval('ui').ra.q.length as number);
  for (let i = 0; i < n; i++) { await page.evaluate(() => { (window as any).eval('ui').ra.self = 1; }); await page.locator('[data-act="ranext"]').click(); }
  await page.locator('[data-act="ndxgo"]').click();
  await expect(page.locator('#ndxin')).toBeVisible();
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length as number);
  const q = await page.evaluate(() => (window as any).eval('ui').ndx.q as any[]);
  expect(q.length).toBeGreaterThan(0);
  // câu 1 đúng
  await page.locator('#ndxin').fill(q[0].ans); await page.locator('[data-act="ndxok"]').click();
  await expect(page.locator('#app .fb.good')).toContainText('Đúng');
  const e1 = await page.evaluate(() => { const l = (window as any).eval('st').e.ev.led; return l[l.length - 1]; });
  expect(e1.ctx).toBe('nd'); expect(e1.ok).toBeTruthy(); expect(e1.node).toBe(q[0].node);
  // câu 2 (nếu có) sai → vào Ôn tập ngày mai
  if (q.length > 1) {
    await page.locator('[data-act="ndxnext"]').click();
    await page.locator('#ndxin').fill('zzz'); await page.locator('[data-act="ndxok"]').click();
    await expect(page.locator('#app .fb.bad')).toContainText('Ôn tập');
    const due = await page.evaluate((it: any) => { const w = window as any, s = it.k === 'w' ? w.eval('st').words[it.wid] : w.eval('st').gram[it.gid]; return s.due - w.eval('today()'); }, q[1]);
    expect(due).toBe(1);
  }
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length as number)).toBeGreaterThan(led0);
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => v.id)).toEqual([]);
  await page.evaluate(() => (window as any).eval("go('aim')"));
  await expect(page.locator('#app .cmpleg')).toContainText('nhờ Nói & Đọc');
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
  await page.addInitScript((r: string) => { if (!sessionStorage.getItem('nd-seeded')) { sessionStorage.setItem('nd-seeded', '1'); localStorage.setItem('vocab-ladder-v1', r); } }, raw);
  await page.reload();
  await page.waitForFunction(() => (window as any).ELREADY === true);
  expect(await page.evaluate((k: string) => (window as any).eval('cdActs')({ t: 'snd', v: [k] }, 'A1')[0].done, id)).toBe(true);
  expect(errors).toEqual([]);
});
