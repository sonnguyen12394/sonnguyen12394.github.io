import { test, expect, play } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v80–v82: nói (Karaoke, nói thử ở Bắt Âm) và Xưởng sửa câu. Máy nghe giọng là của trình duyệt: test đặt sẵn kết quả máy nghe (ASR)
// thay cho giọng thật. Nói chỉ là phản hồi (không vào mức thuộc); kết quả Karaoke lưu như màn Đóng vai. Xưởng: tự gõ = bằng chứng mức 4.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()'); w.eval("go('games')");
  });
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
}
// Đặt kết quả máy nghe cho khoá `key` (như khi người học vừa nói), rồi vẽ lại.
const fakeAsr = (page: Page, key: string, p: number) => page.evaluate(([k, v]) => { const w = window as any, A = w.eval('ASR'); A.key = k; A.on = false; A.err = ''; A.res = { words: ['x'], hit: v >= 1 ? [0] : [], heard: 'x', p: v }; w.eval('render()'); }, [key, p] as const);

test('Karaoke: đóng vai B, máy đọc vai A, nói theo từng câu; kết quả lưu như Đóng vai, không ghi bằng chứng vào nút', async ({ page, errors }) => {
  await open(page);
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await play(page, 'krstart');
  await expect(page.locator('.krlyric')).toBeVisible();
  const asr = await page.evaluate(() => (window as any).eval('HAS_ASR'));
  const end = page.getByRole('heading', { name: /Hết bài/ });
  let mine = 0, id = '';
  for (let i = 0; i < 40 && !(await end.isVisible()); i++) {
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    if (pk?.run === 'krwait') { await page.locator('[data-e="krnext"]').click(); continue; }
    if (pk?.run === 'karaoke') {
      if (mine === 0) await page.screenshot({ path: 'test-results/karaoke.png' });
      if (asr) { await fakeAsr(page, pk.id, 1); await expect(page.getByText(/Máy nghe ra \d+\/\d+ từ/)).toBeVisible(); await page.locator('[data-e="krnext"]').click(); }
      else await page.locator('[data-e="krself"][data-v="1"]').click();
      mine++; continue;
    }
    break;
  }
  await expect(end).toBeVisible();
  expect(mine).toBeGreaterThan(0);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { led: st.e.ev.led.length, gk: st.e.gk, dlg: Object.entries(st.dlg).filter(([, v]: any) => v && v.rp) }; });
  expect(s.led).toBe(led0);   // nói không vào mức thuộc
  expect(s.gk.runs).toBe(1); expect(s.gk.lastId).toBeTruthy(); id = s.gk.lastId;
  expect(s.dlg.find(([k]) => k === id)?.[1]).toMatchObject({ rp: 'easy' });
  await expect(page.getByText(/lưu như màn Đóng vai/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Xưởng sửa câu: 6 đơn, tự gõ lại câu đúng = bằng chứng ngữ pháp mức 4 (g = 0); sai thì tô chỗ sửa + vì sao', async ({ page, errors }) => {
  await open(page);
  await play(page, 'wsstart');
  const end = page.getByRole('heading', { name: /Hết ca/ });
  let n = 0;
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const pk = await page.evaluate(() => (window as any).eval('EM').peek());
    if (pk?.run === 'shop') {
      const input = page.locator('input[name="a"]');
      await expect(input).toHaveValue(pk.prompt);   // câu hỏng điền sẵn để sửa
      if (n === 1) { await page.locator('[data-e="wsskip"]').click(); }
      else if (n === 2) { await input.fill(pk.prompt); await input.press('Enter'); await expect(page.locator('.wsfix').first()).toBeVisible(); await page.screenshot({ path: 'test-results/shop-wrong.png' }); }
      else { await input.fill(pk.accept[0]); await input.press('Enter'); }
      n++; continue;
    }
    await page.locator('[data-e="wsnext"]').click();
  }
  await expect(end).toBeVisible();
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:w1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, g: xs.every((x: any) => x.node.startsWith('g:') && x.lv === 4), gw: st.e.gw }; });
  expect(s.n).toBe(6); expect(s.ok).toBe(4); expect(s.g).toBe(true); expect(s.gw.packed).toBe(4);
  expect(errors).toEqual([]);
});

test('Bắt Âm: nói thử đúng từ → +5 điểm (telemetry), không thêm bằng chứng', async ({ page, errors }) => {
  await open(page);
  const asr = await page.evaluate(() => (window as any).eval('HAS_ASR'));
  test.skip(!asr, 'trình duyệt không có nhận diện giọng');
  await play(page, 'bbstart');
  const pk = await page.evaluate(() => (window as any).eval('EM').peek());
  test.skip(!pk || pk.run !== 'bubbles', 'máy không có giọng đọc');
  await page.locator(`[data-e="bbans"][data-i="${pk.ans}"]`).click();
  await expect(page.getByRole('button', { name: /Nói thử từ này/ })).toBeVisible();
  const before = await page.evaluate(() => { const st = (window as any).eval('st'); return st.e.ev.led.length; });
  const score = async () => Number(await page.locator('section .spread > span b').first().textContent());
  const s0 = await score();
  await fakeAsr(page, 'bb:1:1', 1);
  await page.screenshot({ path: 'test-results/bubbles-speak.png' });
  await page.locator('[data-e="bbnext"]').click();
  const after = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  expect(after).toBe(before);
  expect(await score()).toBe(s0 + 5);
  expect(errors).toEqual([]);
});
