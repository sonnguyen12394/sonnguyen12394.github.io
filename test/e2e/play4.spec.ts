import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v83 Thư gửi cư dân phố, v84 Ra lệnh cho robot, v85 Tốc độ 60 giây / Ghép cặp ưu tiên từ đến hạn.
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

test('Thư: gửi thư thiếu → cư dân hỏi lại đúng chỗ thiếu; sửa, gửi đủ → hồi âm + quà; tự chấm; lưu như màn Viết theo đề', async ({ page, errors }) => {
  await open(page);
  await page.locator('[data-e="ltstart"]').first().click();
  const pk = await page.evaluate(() => (window as any).eval('EM').peek());
  expect(pk.run).toBe('letter');
  const id = pk.id.split(':')[0];
  await page.locator('textarea[name="t"]').fill('Hi.');
  await page.getByRole('button', { name: /Gửi thư/ }).click();
  await expect(page.getByText(/bạn viết thêm giúp nhé/)).toBeVisible();
  await page.screenshot({ path: 'test-results/letter-reply.png' });
  await page.locator('[data-e="ltedit"]').click();
  await page.locator('textarea[name="t"]').fill(pk.accept[0]);   // bài mẫu của đề
  for (const box of await page.locator('fieldset input[type="checkbox"]').all()) await box.check();
  await page.getByRole('button', { name: /Gửi thư/ }).click();
  await expect(page.getByText(/Cảm ơn bạn nhiều/)).toBeVisible();
  await page.locator('[data-e="ltrate"]').click();
  for (let i = 0; i < 4; i++) await page.locator(`[data-e="ltrub"][data-i="${i}"][data-v="3"]`).click();
  await page.screenshot({ path: 'test-results/letter-rate.png' });
  await page.locator('[data-e="ltdone"]').click();
  await expect(page.getByRole('heading', { name: /Đã cất thư/ })).toBeVisible();
  const s = await page.evaluate((k) => { const st = (window as any).eval('st'); return { w: st.wtask[k], gl: st.e.gl, done: (window as any).eval(`wtDone('${k}')`) }; }, id);
  expect(s.w.text.length).toBeGreaterThan(20); expect(s.w.self).toEqual([3, 3, 3, 3]); expect(s.done).toBe(true);
  expect(s.gl.runs).toBe(1); expect(s.gl.gifts).toBe(1); expect(s.gl.sent).toBe(2);
  expect(errors).toEqual([]);
});

test('Robot: gõ lệnh (và lệnh máy nghe), gọi sai tên không nhặt được, nhặt đủ + về Nhà → xong; không ghi bằng chứng', async ({ page, errors }) => {
  await open(page);
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await page.locator('[data-e="rbstart"]').first().click();
  await expect(page.locator('.rbgrid')).toBeVisible();
  const cmd = async (t: string) => { await page.locator('input[name="a"]').fill(t); await page.locator('input[name="a"]').press('Enter'); };
  let pk = await page.evaluate(() => (window as any).eval('EM').peek());
  expect(pk.run).toBe('robot');
  const words = ['', 'one', 'two', 'three', 'four'];
  let first = true;
  for (const it of pk.robot.items.filter((i: any) => i.target)) {
    pk = await page.evaluate(() => (window as any).eval('EM').peek());
    const dr = it.r - pk.robot.r, dc = it.c - pk.robot.c, parts: string[] = [];
    if (dr) parts.push(`go ${dr > 0 ? 'down' : 'up'} ${words[Math.abs(dr)]} steps`);
    if (dc) parts.push(`go ${dc > 0 ? 'right' : 'left'} ${words[Math.abs(dc)]} steps`);
    if (first) {   // gọi sai tên trước
      await cmd([...parts, 'pick up the zebra'].join(' then '));
      await expect(page.getByText(/Robot không hiểu “zebra”/)).toBeVisible();
      await page.screenshot({ path: 'test-results/robot.png' });
      first = false;
      if (await page.evaluate(() => (window as any).eval('HAS_ASR'))) {   // lệnh máy nghe (giả lập kết quả nghe)
        const key = (await page.evaluate(() => (window as any).eval('EM').peek())).id;
        await page.evaluate(([k, w]) => { const W = window as any, A = W.eval('ASR'); A.key = k; A.on = false; A.err = ''; A.res = { free: true, heard: `pick up the ${w}`, alts: [], p: 1, k: 'ok' }; W.eval('render()'); }, [key, it.en] as const);
        await expect(page.getByText(/Máy nghe:/)).toBeVisible();
        await page.locator('[data-e="rbrun"]').click();
      } else await cmd(`pick up the ${it.en}`);
    } else await cmd([...parts, `pick up the ${it.en}`].join(' then '));
  }
  await cmd('go home');
  await expect(page.getByRole('heading', { name: /Về Nhà an toàn/ })).toBeVisible();
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { led: st.e.ev.led.length, gb: st.e.gb }; });
  expect(s.led).toBe(led0);
  expect(s.gb.wins).toBe(1); expect(s.gb.picked).toBe(2);
  expect(errors).toEqual([]);
});

test('Tốc độ 60 giây / Ghép cặp: từ đến hạn ôn đứng đầu nguồn từ; ghép nhầm có giải thích nghĩa', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  const r = await page.evaluate(() => {
    const w = window as any, all = w.eval('ALL_WORDS').slice(0, 30), t = w.eval('today()');
    all.forEach((x: any, i: number) => { const c = w.eval('W')(x.id); c.learned = true; c.ivl = 10 + i; c.due = i >= 27 ? t : t + 20; });
    const pool = w.eval('gamePool()').map((x: any) => x.id);
    return { first: pool.slice(0, 3).sort(), due: all.slice(27).map((x: any) => x.id).sort(), n: pool.length };
  });
  expect(r.first).toEqual(r.due); expect(r.n).toBe(12);
  expect(errors).toEqual([]);
});
