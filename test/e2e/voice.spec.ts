import AxeBuilder from '@axe-core/playwright';
import { test, expect, play, toLobby, openAll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v122–v127 Phố Chữ nói (GAME-CRITERIA §13): động từ chơi là hành động ngôn ngữ. Test nhập bằng bàn phím (bậc lùi của micro) và giả lập
// kết quả máy nghe giọng (như speak.spec). Kiểm: luồng ván tới màn kết, số đo H được ghi, bằng chứng chỉ ghi ở chỗ được phép, WCAG.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page, setup?: () => void): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()'); w.eval("go('games')");
  });
  if (setup) await page.evaluate(setup);
  await toLobby(page);
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());
const hx = (page: Page) => page.evaluate(() => { const d = (window as any).eval('st').e.vo?.hx?.d ?? {}; const s: Record<string, number> = {}; for (const x of Object.values(d) as any[]) for (const [k, v] of Object.entries(x)) s[k] = (s[k] ?? 0) + (Array.isArray(v) ? (k === 'lat' ? v.length : (v as number[])[1]!) : (v as number)); return s; });
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
};

test('Quán Phố Chữ bằng giọng: nói / gõ câu đáp, khách hiểu thì đi tiếp; lưu như Hội thoại mở; số đo H (tự nói / gõ, hội thoại) được ghi', async ({ page, errors }) => {
  await open(page);
  await play(page, 'tkstart');
  await expect(page.locator('.vtalk')).toBeVisible();
  await page.screenshot({ path: 'test-results/voice-talk.png' });
  await axe(page);
  const end = page.getByRole('heading', { name: /Hết ca/ }), asr = await page.evaluate(() => (window as any).eval('HAS_ASR'));
  let n = 0, mic = false;
  for (let i = 0; i < 60 && !(await end.isVisible()); i++) {
    const pk = await peek(page);
    if (!pk) { await page.waitForTimeout(50); continue; }
    if (pk.run === 'talkwait') { await page.locator('[data-e="tknext"]').click(); continue; }
    if (pk.run === 'talk' || pk.run === 'talkuse') {
      if (asr && !mic) {   // một lượt bằng micro: bấm 🎙, giả kết quả máy nghe (nghe tự do) cho đúng khoá app vừa mở
        await page.evaluate(() => { (window as any).eval('st').set.asr = true; });
        await page.locator('[data-e="vmic"]').click();
        await page.evaluate(t => { const w = window as any, A = w.eval('ASR'); try { A.r && A.r.abort(); } catch { /* bỏ qua */ } A.r = null; A.on = false; A.err = ''; A.res = { free: true, heard: t, alts: [t], p: 1, k: 'ok' }; w.eval('render()'); }, pk.accept[0]);
        mic = true; n++;
        await page.waitForFunction(id => { const p = (window as any).eval('EM').peek(); return !p || p.id !== id; }, pk.id);
        continue;
      }
      const input = page.locator('form[data-eform="tksay"] input');
      await input.fill(pk.accept[0]); await input.press('Enter'); n++;
      await page.waitForFunction(id => { const p = (window as any).eval('EM').peek(); return !p || p.id !== id || p.run === 'talkwait'; }, pk.id);
      continue;
    }
    break;
  }
  await expect(end).toBeVisible();
  expect(n).toBeGreaterThan(3);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { vo: st.e.vo, conv: Object.keys(st.conv || {}).length }; });
  expect(s.vo.tk.runs).toBe(1); expect(s.conv).toBeGreaterThan(0);
  const h = await hx(page);
  expect((h.sp ?? 0) + (h.ty ?? 0)).toBeGreaterThan(2);
  if (asr) expect(h.sp ?? 0).toBeGreaterThan(0);
  expect(h.cv ?? 0).toBeGreaterThan(0);
  expect(errors).toEqual([]);
});

test('Hỏi chuyện nhân chứng: câu kể không mở manh mối, câu hỏi tự đặt thì mở; đủ manh mối chọn đúng người → phá án', async ({ page, errors }) => {
  await open(page);
  await play(page, 'akstart');
  await expect(page.locator('.vsheet')).toBeVisible();
  const input = page.locator('form[data-eform="aksay"] input');
  await input.fill('My bag is red'); await input.press('Enter');
  await expect(page.getByText(/chờ một câu hỏi/)).toBeVisible();
  for (let i = 0; i < 12; i++) {
    const pk = await peek(page);
    if (pk.run !== 'ask') break;
    await input.fill(pk.accept[0]); await input.press('Enter');
    await expect(page.locator('.vsheet li.got')).toHaveCount(Math.min(4, i + 1));
  }
  await page.screenshot({ path: 'test-results/voice-ask.png' });
  await axe(page);
  await page.locator('[data-e="akdone"]').click();
  const pk = await peek(page);
  expect(pk.run).toBe('askpick');
  await page.locator('[data-e="akpick"]').nth(pk.ans).click();
  await expect(page.getByRole('heading', { name: /Phá án/ })).toBeVisible();
  const s = await page.evaluate(() => (window as any).eval('st').e.vo.ak);
  expect(s.solved).toBe(1);
  const h = await hx(page);
  expect(h.xf).toBe(5);   // 1 câu kể + 4 câu hỏi
  expect(errors).toEqual([]);
});

test('Bến Cảng lệnh giọng: máy nghe ra đúng từ → cẩu nhấc đúng thùng, nghe thành từ kia → nhầm thùng; máy không nghe được → chế độ nghe phân biệt', async ({ page, errors }) => {
  await open(page);
  await play(page, 'ptstart');
  await expect(page.locator('.vport')).toBeVisible();
  const end = page.getByRole('heading', { name: /Hết ca bốc hàng/ });
  for (let i = 0; i < 20 && !(await end.isVisible()); i++) {
    const pk = await peek(page);
    if (pk.run === 'port') {
      const k = i === 1 ? 'other' : 'ok';
      await page.evaluate(([key, t, kk]) => { const w = window as any, A = w.eval('ASR'); A.key = key; A.on = false; A.err = ''; A.res = { word: true, k: kk, heard: t }; w.eval('render()'); }, [pk.id, pk.target ?? pk.prompt, k] as const);
      await page.locator('[data-e="ptsend"]').click();
      if (i === 1) { await expect(page.locator('.vcrate.wrong')).toBeVisible(); await page.screenshot({ path: 'test-results/voice-port-wrong.png' }); }
    } else await page.locator(`[data-e="pttap"][data-w="${pk.prompt}"]`).click();
    await page.locator('[data-e="ptnext"]').click();
  }
  await expect(end).toBeVisible();
  const s = await page.evaluate(() => (window as any).eval('st').e.vo.pt);
  expect(s.runs).toBe(1); expect(s.n).toBe(8);
  expect(errors).toEqual([]);
});

test('Sương quay lại: từ sắp quên thành biển hiệu mờ; gõ đúng → biển sáng, một lần ôn thật (FSRS), nhớ trễ vào Bảng đo H', async ({ page, errors }) => {
  await open(page, () => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()'), ws = w.eval('ALL_WORDS').filter((x: any) => w.eval('UNIT_OF')[x.id] && /^[a-z]{3,8}$/.test(x.word)).slice(0, 3);
    for (const x of ws) { const s = w.eval('W')(x.id); Object.assign(s, { learned: true, stage: 2, ivl: 6, due: t - 2, fs: 6, fd: 5, fl: t - 9 }); }
    w.eval('save()');
  });
  await play(page, 'sgstart');
  await expect(page.locator('.vstreet')).toBeVisible();
  await axe(page);
  const done = page.getByRole('heading', { name: /biển sáng lại/ });
  for (let i = 0; i < 6 && !(await done.isVisible()); i++) {
    const pk = await peek(page);
    if (pk?.run === 'signs') { const input = page.locator('form[data-eform="sgsay"] input'); await input.fill(pk.accept[0]); await input.press('Enter'); await expect(page.locator('.vsign.lit')).toHaveCount(i + 1); }
    await page.locator('[data-e="sgnext"]').click();
  }
  await expect(done).toBeVisible();
  const s = await page.evaluate(() => { const w = window as any, st = w.eval('st'), t = w.eval('today()'); return { lit: st.e.vo.sg.lit, fresh: Object.values(st.words).filter((x: any) => x.fl === t).length, led: st.e.ev.led.filter((x: any) => x.ctx === 'recall' && /:signs$/.test(x.item)).length }; });
  expect(s.lit).toBe(3); expect(s.fresh).toBe(3); expect(s.led).toBe(3);
  expect((await hx(page)).r7).toBe(3);
  expect(errors).toEqual([]);
});

test('Bảng đo H + Phố thật: sảnh có Phố Chữ nói; bảng 10 tiêu chí, chưa đủ số liệu thì "ước tính"; làm nhiệm vụ tuần → +30 xu, một lần mỗi tuần', async ({ page, errors }) => {
  await open(page);
  await openAll(page);
  await expect(page.getByRole('heading', { name: /Phố Chữ nói/ })).toBeVisible();
  await page.locator('[data-e="rwdone"]').click();
  await expect(page.getByText(/đã làm nhiệm vụ tuần này/)).toBeVisible();
  expect(await page.evaluate(() => (window as any).eval('st').e.vo.rw.total)).toBe(1);
  await page.locator('.vhub [data-e="hmeter"]').click();
  await expect(page.getByRole('heading', { name: /Học xong có dùng được không/ })).toBeVisible();
  await expect(page.locator('.vhlist .vhrow')).toHaveCount(10);
  await expect(page.getByText('ước tính').first()).toBeVisible();
  await page.screenshot({ path: 'test-results/voice-hmeter.png' });
  await axe(page);
  expect(errors).toEqual([]);
});
