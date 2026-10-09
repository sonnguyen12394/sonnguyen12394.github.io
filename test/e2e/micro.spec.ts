import { test, expect } from './fixtures.ts';

// v61 (spec v2.4 §51–53): sai lặp lại trong lượt ngữ pháp → mời "Bí kíp 60 giây" → đọc → 3 câu kiểm tra → quay lại đúng câu đang làm.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('Bí kíp 60 giây: mời sau lỗi lặp lại, ghi bằng chứng có trợ giúp và snapshot trước/sau, quay lại bài đang làm', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()');
    st.onboarded = true;
    for (let i = 0; i < 4; i++) w.ELCORE.ev(st, { node: 'g:g-a1-01', level: 3, ok: i === 0, item: 'g:seed' + i, src: 'gram', ctx: 'typ', qt: 'gty' }, t);
    w.eval('save()');
    w.eval("gStart('practice',gPracticeItems(GPT['g-a1-01']),'g-a1-01')");
  });
  await page.evaluate(() => (window as any).eval('gAnswer(false,{dunno:true}); render()'));
  const offer = page.getByRole('button', { name: /Bí kíp 60 giây/ });
  await expect(offer).toBeVisible({ timeout: 10000 });
  await offer.click();
  await expect(page.getByRole('heading', { name: /Động từ to be/ })).toBeVisible({ timeout: 15000 });
  await expect(page.getByText(/Vì sao app dừng lại ở đây/)).toBeVisible();
  await page.getByRole('button', { name: /Đã hiểu/ }).click();
  const done = page.getByRole('heading', { name: /Đã mở chiêu mới|Đã ghi nhận/ }), dunno = page.getByRole('button', { name: 'Không biết' }).first();
  for (let i = 0; i < 6 && !(await done.isVisible()); i++) {
    await expect(dunno.or(done)).toBeVisible();
    if (await done.isVisible()) break;
    await dunno.click();
  }
  await expect(done).toBeVisible();
  const e = await page.evaluate(() => (window as any).eval('st').e);
  const mic = e.ev.led.filter((x: any) => x.src === 'micro');
  expect(mic.length).toBeGreaterThanOrEqual(2);
  expect(mic.every((x: any) => x.asst === 1)).toBe(true);
  const snap = e.ev.snap.find((s: any) => s.kind === 'diag' && String(s.dec).startsWith('micro:'));
  expect(snap.info.m0).toBeDefined(); expect(snap.info.m1).toBeDefined();
  await page.getByRole('button', { name: 'Quay lại bài đang làm' }).click();
  await expect(page.locator('#gnextbtn')).toBeVisible();
  // Đã học bí kíp hôm nay: không mời lại cho cùng phần này.
  await expect(page.getByRole('button', { name: /Bí kíp 60 giây/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Bí kíp từ vựng: nhắm đúng những từ vừa sai trong unit, có 3 câu kiểm tra', async ({ page, errors }) => {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  const r = await page.evaluate(() => {
    const w = window as any, st = w.eval('st'), t = w.eval('today()'), u = w.eval("UNIT_BY_ID['a1-u1']"), wd = u.words[2];
    for (let i = 0; i < 3; i++) w.ELCORE.ev(st, { node: 'u:a1-u1', level: 3, ok: false, item: 'w:' + wd.id + ':rcl', src: 'vocab', ctx: 'rcl', qt: 'typed' }, t);
    const x = w.eval('eMicroCard')('u:a1-u1');
    return { word: wd.word, concept: x.card.concept, n: x.qs.length, ids: x.qs.map((q: any) => q.id) };
  });
  expect(r.concept[0]).toContain(r.word);
  expect(r.n).toBe(3);
  expect(errors).toEqual([]);
});
