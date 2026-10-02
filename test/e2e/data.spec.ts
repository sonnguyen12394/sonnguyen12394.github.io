import { test, expect, openApp, navTo } from './fixtures.ts';

// Bản lưu v17 (app v34) có tiến độ thật và phần tim/Super: cập nhật lên v35 phải giữ nguyên tiến độ, bỏ tim/Super.
const V17 = {
  v: 17, app: { seen: 34, vh: [] }, money: { h: 2, hd: 20000, ht: 0, sup: { c: 'X', exp: 99999 } }, srs: { k: 1, n: 0 },
  words: { price: { d: { rec: 1, rcl: 1, spl: null, ctx: null, col: null }, stage: 3, due: 20500, ivl: 12, ease: 2.5, learned: true } },
  units: {}, gram: {}, levels: {}, glevels: {}, stats: { a: 40, c: 31 }, days: [20000, 20001], daily: {}, xp: 777, onboarded: true,
  set: { goal: 20, newMax: 20, rate: 0.9 }, start: 20000, offset: 0, exam: [{ day: 20001, l: 6, r: 6.5 }],
};

test('nâng cấp dữ liệu v17 → v18 không mất tiến độ', async ({ page, errors }) => {
  await page.addInitScript(s => { if (!sessionStorage.getItem('seeded')) { localStorage.setItem('vocab-ladder-v1', s); sessionStorage.setItem('seeded', '1'); } }, JSON.stringify(V17));
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}'));
  expect(saved.v).toBe(18);
  expect(saved.money).toBeUndefined();
  expect(saved.xp).toBe(777);
  expect(saved.words.price.learned).toBe(true);
  expect(saved.words.price.ivl).toBe(12);
  expect(saved.exam).toEqual([{ day: 20001, l: 6, r: 6.5 }]);
  expect(saved.x).toMatchObject({ v: 3, attempts: [], resp: [] });
  expect(errors).toEqual([]);
});

test('mã sao lưu mang theo phần ôn thi và khôi phục được', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(page.getByRole('heading', { name: /Ôn VSTEP/ })).toBeVisible();
  const code = await page.evaluate(async () => {
    // @ts-expect-error hàm toàn cục của app.js
    return await makeCode();
  });
  expect(code).toMatch(/^VL[12]:/);
  const back = await page.evaluate(async c => {
    // @ts-expect-error hàm toàn cục của app.js
    return await readCode(c);
  }, code);
  expect(back.x.exam).toBe('vstep');
  expect(errors).toEqual([]);
});

// v45: đếm người dùng mỗi ngày chỉ khi đã đồng ý; lời mời đồng ý hiện trên trang Ôn thi cho tới khi người học chọn.
test('đếm ngày: không gửi khi chưa đồng ý, gửi một lần mỗi ngày khi đã đồng ý', async ({ page, errors }) => {
  const pings: string[] = [];
  page.on('request', r => { if (r.url().includes('/rpc/el_day_post')) pings.push(JSON.parse(r.postData() || '{}').kind); });
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(page.getByRole('heading', { name: 'Giúp app đo đúng hơn?' })).toBeVisible();
  expect(pings).toEqual([]);
  await page.getByRole('button', { name: 'Xem và đồng ý' }).click();
  await page.getByLabel('Từ 16 tuổi trở lên').check();
  await page.getByRole('button', { name: 'Đồng ý chia sẻ' }).click();
  await page.reload();
  await expect.poll(() => pings).toEqual(['open']);
  await page.reload();
  await expect(page.locator('#bnav button:visible, #nav button:visible').first()).toBeVisible();
  expect(pings).toEqual(['open']);
  expect(errors).toEqual([]);
});

test('lời mời chia sẻ: "Không, cảm ơn" ẩn lời mời và không gửi gì', async ({ page, errors }) => {
  const pings: string[] = [];
  page.on('request', r => { if (r.url().includes('/rpc/el_day_post')) pings.push('x'); });
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: 'Không, cảm ơn' }).click();
  await expect(page.getByRole('heading', { name: 'Giúp app đo đúng hơn?' })).toHaveCount(0);
  await page.reload();
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: /Ôn VSTEP/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Giúp app đo đúng hơn?' })).toHaveCount(0);
  expect(pings).toEqual([]);
  expect(errors).toEqual([]);
});
