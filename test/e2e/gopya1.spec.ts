import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v177 sửa theo góp ý thử học tới A1 (el_gopy #18–#31, 20/10/2026): luật đến hạn chung (srsDue), nút 💬 không che thanh đáy, máy chấm Viết / Nói nhận cách tự diễn đạt, câu sửa lỗi nhận cách sửa đúng khác.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
}

test('v177 #19 giai đoạn ôn: thẻ nhớ < 0,9 (chưa tới ngày hẹn) ôn đúng thì lịch được ghi, rời danh sách ôn', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const w = window as any, ev = (x: string) => w.eval(x);
    ev('st').onboarded = true; ev('learnPh2 = () => true');   // giả lập giai đoạn ôn (📘 Học ≥ 80%)
    const t = ev('today()'), id = ev('UNITS')[0].words[0].id, s = ev('W')(id);
    Object.assign(s, { learned: true, stage: 2, ivl: 30, due: t + 20, fs: 5, fd: 5, fl: t - 10 });   // hẹn còn 20 ngày nhưng khả năng nhớ đã dưới 0,9
    const before = { due: ev('dueWords()').some((x: any) => x.id === id), srs: ev('srsDue')(s, t) };
    ev('srsStep')(s, true, true);
    return { before, fl: s.fl, t, after: ev('dueWords()').some((x: any) => x.id === id), fs: s.fs };
  });
  expect(r.before).toEqual({ due: true, srs: true });
  expect(r.fl).toBe(r.t);          // trước v177: srsStep bỏ qua (due > hôm nay) nên fl không đổi
  expect(r.after).toBe(false);
  expect(r.fs).toBeGreaterThan(5);
  expect(errors).toEqual([]);
});

test('v177 #22 nút 💬 nổi không che nút ở thanh đáy (màn chào), 390 px', async ({ page, errors }) => {
  await open(page);
  const fab = page.locator('.gyfab'), bar = page.locator('#app .actbar').first();
  await expect(bar).toBeVisible();
  await expect(fab).toBeVisible();
  const f = (await fab.boundingBox())!, b = (await bar.boundingBox())!;
  expect(f.y + f.height).toBeLessThanOrEqual(b.y + 1);
  expect(errors).toEqual([]);
});

test('v177 #23 #25 máy chấm: cách sửa đúng khác; Viết / Nói tự diễn đạt vẫn nhận ý', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => {
    const w = window as any, ev = (x: string) => w.eval(x);
    const fx = ev('GPOINTS').find((p: any) => p.id === 'g-a1-13').fx.find((x: any) => x.bad === 'No smoke here.');
    const gfx = ev('gOk')('No smoking here.', [fx.good, ...(fx.alt || [])]);
    const sorry = { pts: [{ vi: 'Xin lỗi', k: [['sorry', 'apologi', "i'm afraid", 'unfortunately']] }, { vi: 'Lý do: ốm', k: [['ill', ...ev('WRG_SYN').ill]] }, { vi: 'Hẹn Chủ nhật', k: [['Sunday']] }], minW: 25 };
    const ws = ev('wrgScore')(sorry, "Hi Nam, I'm afraid I can't come to the cinema tonight. I have a bad cold and a high temperature. Can we meet on Sunday instead? Have fun!");
    const st = ev('stScore')(ev('STK')['a1-s3'], "I really love bun cha. I have it for lunch on Saturdays. My wife makes it, or we buy it from a shop near our house. It's sweet and salty and very good.", []);
    return { gfx, wsPts: ws.pts, wsOk: ws.s >= ev('WRG_OK'), st: st.s };
  });
  expect(r.gfx).toBe(true);
  expect(r.wsPts).toEqual([true, true, true]);
  expect(r.wsOk).toBe(true);
  expect(r.st).toBeGreaterThanOrEqual(0.9);   // trước v177: 0,7 vì không dùng đúng cụm mẫu
  expect(errors).toEqual([]);
});
