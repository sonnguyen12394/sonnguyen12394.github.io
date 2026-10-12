import AxeBuilder from '@axe-core/playwright';
import { test, expect, toLobby, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';
import { MORPH, SENT, COLLOC } from '../../src/engine/bag.ts';
import { CHAPTERS } from '../../src/engine/story.ts';

// v128 (GAME-CRITERIA §14–§15): truyện có lựa chọn + câu bạn tự nói; Túi chữ · Xưởng của Tí · Chỉ số thật.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function lobby(page: Page, patch: Record<string, unknown> = {}): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate((p) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    Object.assign(st.e, p);
    w.eval('save()'); w.eval("go('games')");
  }, patch);
  await toLobby(page);
}
const axe = async (page: Page, sel: string) => {
  const r = await new AxeBuilder({ page }).include(sel).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
};

test('v128 truyện: tự gõ câu cho cư dân (ghi nhật ký H), lựa chọn đổi lời thoại, kỷ vật hiện ở thẻ truyện', async ({ page, errors }) => {
  const k = CHAPTERS.findIndex(c => c.scene.some(l => l.pick?.f === 'f1'));
  await lobby(page, { sy: { ch: k, prog: { dig: 99, light: 99, voice: 99 } } });
  // Thẻ truyện có kỷ vật của các chương đã qua.
  await expect(page.locator('.stcard')).toContainText(`Kỷ vật ${k}/`);
  // Mở cảnh qua nút thêm (chương cuối khu cần kỹ năng vững: test chỉ xem cảnh, không cần sang chương).
  await page.evaluate((n) => (document.querySelector('.stcard') as HTMLElement).insertAdjacentHTML('beforeend', `<button data-e="stscene" data-ch="${n}" id="go8">x</button>`), k);
  await page.locator('#go8').click();
  const fx = page.locator('#stfx');
  await expect(fx).toBeVisible();
  const ty0 = await page.evaluate(() => Object.values((window as any).eval('st').e.vo?.hx?.d ?? {}).reduce((a: number, d: any) => a + (d.ty ?? 0), 0));
  for (let i = 0; i < 40; i++) {
    if (await fx.locator('.stme').count()) {
      const en = await fx.locator('.sten').innerText();
      await fx.locator('input[name="t"]').fill(en); await fx.locator('input[name="t"]').press('Enter');
      await expect(fx.locator('.stok')).toBeVisible();
      await axe(page, '#stfx');
    }
    if (await fx.locator('[data-st="pick"]').count()) { await fx.locator('[data-st="pick"][data-v="secret"]').click(); continue; }
    if (!(await fx.count())) break;
    await fx.locator('[data-st="next"]').click();
    if (!(await fx.count())) break;
  }
  await expect(fx).toHaveCount(0);
  const st = await page.evaluate(() => { const e = (window as any).eval('st').e; return { f: e.sy.f, ty: Object.values(e.vo?.hx?.d ?? {}).reduce((a: number, d: any) => a + (d.ty ?? 0), 0) }; });
  expect(st.f.f1).toBe('secret');
  expect(st.ty).toBeGreaterThan(ty0 as number);
  expect(errors).toEqual([]);
});

test('v128 Xưởng của Tí: ghép từ (tự gõ), ghép cụm, đúc câu + thổi hồn → Lời vàng; tặng cư dân +10 xu; trang bị; WCAG ở 390px', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, { sy: { ch: 1, prog: { dig: 0, light: 0, voice: 0 } }, gn: { lv: 3, stars: 0, words: 30, runs: 2, best: 0, day: 0, daily: { day: 0, done: false, streak: 0 } } });
  const hub = page.locator('.bghub');
  await expect(hub).toContainText('Túi chữ');
  await hub.locator('[data-e="bgopen"][data-t="craft"]').click();
  await expect(page.locator('.bgroot')).toContainText('Xưởng của Tí');
  await axe(page, '.bgroot');
  await noHorizontalScroll(page);
  // Ghép từ: chọn đúng phụ tố rồi tự gõ.
  await page.locator('[data-e="bgmk"][data-k="morph"]').click();
  const base = await page.locator('.bgword').innerText(), vi = (await page.locator('.bgroot p b').first().innerText()).replace(/[“”]/g, '');
  const m = MORPH.find(x => x[0] === base && x[3] === vi)!;
  await page.locator(`[data-e="bgaff"][data-v="${m[1]}"]`).click();
  await page.locator('#bgin').fill(m[2]); await page.locator('#bgin').press('Enter');
  await expect(page.locator('.bgok')).toContainText(m[2]);
  // Ghép cụm: chọn sai trước (không mất gì), rồi đúng.
  await page.locator('[data-e="bgdone"]').click();
  await page.locator('[data-e="bgmk"][data-k="col"]').click();
  const rest = (await page.locator('.bgbig').innerText()).replace('___', '').trim(), c = COLLOC.find(x => x[1] === rest)!;
  const wrong = await page.locator('[data-e="bgverb"]').evaluateAll((bs, v) => bs.map(b => (b as HTMLElement).dataset.v).find(x => x !== v), c[0]);
  await page.locator(`[data-e="bgverb"][data-v="${wrong}"]`).click();
  await expect(page.locator('.bgno')).toBeVisible();
  await page.locator(`[data-e="bgverb"][data-v="${c[0]}"]`).click();
  await expect(page.locator('.bgok')).toContainText(`${c[0]} ${c[1]}`);
  // Đúc câu: xếp lá theo thứ tự, rồi gõ lại không nhìn → 🌟 Lời vàng.
  await page.locator('[data-e="bgdone"]').click();
  await page.locator('[data-e="bgmk"][data-k="sent"]').click();
  const svi = (await page.locator('.bgroot p b').first().innerText()).replace(/[“”]/g, ''), s = SENT.find(x => x[2] === svi)!;
  for (const w of s[1].split(' ')) {
    const i = await page.locator('[data-e="bgtile"]').evaluateAll((bs, t) => bs.findIndex(b => !(b as HTMLButtonElement).disabled && b.textContent === t), w);
    await page.locator('[data-e="bgtile"]').nth(i).click();
  }
  await expect(page.locator('#bgsoul')).toBeVisible();
  await page.locator('#bgsoul').fill(s[1]); await page.locator('#bgsoul').press('Enter');
  await expect(page.locator('.bgok')).toContainText('Lời vàng');
  const bag = await page.evaluate(() => (window as any).eval('st').e.bg);
  expect(bag.it).toMatchObject({ tu: 1, cum: 1, loiv: 1, loi: 0 });
  expect(bag.sp.chu).toBe(7);   // 2 + 2 + 3 viên chữ
  // Tặng Bà Lan (cư dân chương 1): +10 xu một lần.
  const c0 = await page.evaluate(() => (window as any).eval('st').e.q?.coins ?? 0);
  await page.locator('[data-e="bgtab"][data-t="bag"]').click();
  await page.locator('[data-e="bggift"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').e.q.coins)).toBe(c0 + 10);
  expect(await page.evaluate(() => (window as any).eval('st').e.sy.side.gift)).toBe(1);
  // Rèn Cuốc Bạc khi đủ đồ; chưa đủ chỉ số thật thì "chưa phát huy".
  await page.evaluate(() => { const e = (window as any).eval('st').e; e.bg.it.tu = 3; e.bg.it.cum = 2; (window as any).eval('render()'); });
  await page.locator('[data-e="bgtab"][data-t="craft"]').click();
  await page.locator('[data-e="bgforge"][data-id="pick1"]').click();
  expect(await page.evaluate(() => (window as any).eval('st').e.bg.gear)).toEqual(['pick1']);
  await page.locator('[data-e="bgtab"][data-t="bag"]').click();
  await expect(page.locator('.bgcell', { hasText: 'Cuốc Bạc' })).toBeVisible();
  // Chỉ số thật + album + kỷ vật: hiện, đạt WCAG.
  for (const t of ['stat', 'alb', 'clue']) { await page.locator(`[data-e="bgtab"][data-t="${t}"]`).click(); await axe(page, '.bgroot'); }
  await expect(page.locator('.bgroot')).toContainText('Kỷ vật');
  await page.locator('[data-e="qhome"]').first().click();
  await expect(page.locator('.bgroot')).toHaveCount(0);
  expect(errors).toEqual([]);
});
