import { test, expect, closeModal } from './fixtures.ts';

// v165 Nhật ký học (người sáng lập 19/10/2026): tự bật ở Cài đặt; mỗi câu trả lời (eEv), đổi màn, sự kiện app, chỉ số trong ngày
// được gửi theo lô qua el_log_post với mã đồng bộ ẩn danh. Tắt thì không ghi, hàng chờ xoá.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

test('v165 ghi dữ liệu học: mặc định tắt (không gửi gì); bật → gửi snap + câu trả lời + đổi màn theo mã đồng bộ; tắt → thôi ghi', async ({ page, errors }) => {
  const sent: any[] = [];
  await page.route(/supabase\.co\/rest\/v1\/rpc\/el_log_post/, async r => { sent.push(JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: '3' }); });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => { const w = window as any; w.eval('st').onboarded = true; w.eval('save()'); w.eval("go('settings')"); });
  await closeModal(page);
  // tắt: trả lời một câu không tạo hàng chờ, không gửi gì
  await page.evaluate(() => (window as any).eval("eEv({node:'u:a1-u1',level:3,ok:true,g:0,item:'w:breakfast:rcl',qt:'typed',ctx:'rcl',src:'vocab',given:'breakfast'})"));
  expect(await page.evaluate(() => (window as any).eval('logQ()').length)).toBe(0);
  await expect(page.locator('#app')).toContainText('Ghi dữ liệu học để phân tích');
  await page.locator('#app summary', { hasText: 'Ghi dữ liệu học để phân tích' }).click();   // Cài đặt gập từng mục
  await page.locator('#app [data-act="logon"]').click();
  await expect(page.locator('#app [data-act="logoff"]')).toBeVisible();
  const key = await page.evaluate(() => (window as any).eval('syncGet()').k as string);
  expect(key).toMatch(/^ELK-/);
  await page.evaluate(() => { const w = window as any; w.eval("eEv({node:'u:a1-u1',level:3,ok:false,g:0,item:'w:breakfast:rcl',qt:'typed',ctx:'rcl',src:'vocab',given:'brekfast',rt:4200})"); w.eval("go('nd')"); });
  await page.evaluate(() => (window as any).eval('logFlush()'));
  await expect.poll(() => sent.flatMap(b => b.evs).length).toBeGreaterThanOrEqual(4);
  const evs = sent.flatMap(b => b.evs);
  const v = await page.evaluate(() => (window as any).eval('APP_VERSION'));
  expect(sent.every(b => b.k === key && /^[a-z0-9]{6,16}$/.test(b.dev) && b.v === v)).toBe(true);
  expect(evs.map(e => e.k)).toEqual(expect.arrayContaining(['snap', 'evc', 'ans', 'go']));
  const ans = evs.find(e => e.k === 'ans');
  expect(ans).toMatchObject({ node: 'u:a1-u1', ok: 0, giv: 'brekfast', rt: 4200, item: 'w:breakfast:rcl' });
  expect(typeof ans.t).toBe('number'); expect(typeof ans.dy).toBe('number');
  expect(evs.find(e => e.k === 'go')).toMatchObject({ v: 'nd', from: 'settings' });
  expect(evs.find(e => e.k === 'snap')).toHaveProperty('fast');
  expect(await page.evaluate(() => (window as any).eval('logQ()').length)).toBe(0);   // gửi xong thì hàng chờ trống
  // tắt
  await page.evaluate(() => { const w = window as any; w.eval('ui').setOpen['Ghi dữ liệu học để phân tích'] = true; w.eval("go('settings')"); });
  await page.locator('#app [data-act="logoff"]').click();
  const n0 = sent.length;
  await page.evaluate(() => { const w = window as any; w.eval("eEv({node:'u:a1-u1',level:3,ok:true,g:0,item:'w:x',qt:'typed',ctx:'rcl',src:'vocab'})"); w.eval('logFlush()'); });
  expect(await page.evaluate(() => (window as any).eval('logQ()').length)).toBe(0);
  expect(sent.length).toBe(n0);
  expect(errors).toEqual([]);
});

test('v165 mất mạng: câu trả lời nằm trong hàng chờ, có mạng lại thì gửi bù', async ({ page, errors }) => {
  let fail = true; const sent: any[] = [];
  await page.route(/supabase\.co\/rest\/v1\/rpc\/el_log_post/, async r => { if (fail) return r.fulfill({ status: 503, body: '' }); sent.push(JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: '1' }); });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => { const w = window as any; w.eval('st').onboarded = true; w.eval('syncSet')({ k: 'ELK-0000-0000-0000-0000-0000', rev: 0, dirty: false, at: 0, log: true });
    w.eval("eEv({node:'g:g-a1-08',level:3,ok:true,g:0,item:'g:x',qt:'gty',ctx:'typ',src:'gram'})"); });
  await page.evaluate(() => (window as any).eval('logFlush()'));
  const q1 = await page.evaluate(() => (window as any).eval('logQ()').length);
  expect(q1).toBeGreaterThanOrEqual(2);   // snap + ans vẫn chờ
  fail = false;
  await page.evaluate(() => (window as any).eval('logFlush()'));
  expect(await page.evaluate(() => (window as any).eval('logQ()').length)).toBe(0);
  expect(sent.flatMap(b => b.evs).some(e => e.k === 'ans' && e.node === 'g:g-a1-08')).toBe(true);
  expect(errors.filter(e => !/503|Failed to load resource/.test(e))).toEqual([]);
});
