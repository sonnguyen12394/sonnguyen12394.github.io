import AxeBuilder from '@axe-core/playwright';
import { test, expect, closeModal } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v167 💬 Góp ý mọi màn (người sáng lập 19/10/2026): nút trên thanh đầu trang, tấm nổi đè lên màn đang học (không mất câu đang làm),
// loại + chữ + tối đa 3 ảnh (nén ở máy), tự kèm bối cảnh; ảnh lên kho el-gopy, nội dung qua el_gopy_post; mất mạng thì gửi bù.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
// ảnh PNG 2×2 hợp lệ
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAYAAABytg0kAAAAFklEQVR4nGP8z8DwnwEIGBkZGBgYGAAiqgMBWOYYkwAAAABJRU5ErkJggg==', 'base64');

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(() => { const w = window as any; w.eval('st').onboarded = true; w.eval('save()'); w.eval("go('nd')"); });
  await closeModal(page);
}

test('v167 góp ý giữa lượt: tấm nổi không mất câu đang làm; loại + chữ + ảnh; kèm bối cảnh; ảnh lên kho, nội dung qua el_gopy_post; WCAG AA, 390 px', async ({ page, errors }) => {
  const rpc: any[] = [], up: string[] = [];
  await page.route(/\/storage\/v1\/object\/el-gopy\//, async r => { up.push(r.request().url()); await r.fulfill({ status: 200, contentType: 'application/json', body: '{"Key":"x"}' }); });
  await page.route(/rest\/v1\/rpc\/el_gopy_post/, async r => { rpc.push(JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: '42' }); });
  await open(page);
  await page.evaluate(() => (window as any).eval("fastStart('w:A1:0')"));
  const before = await page.evaluate(() => { const s = (window as any).eval('ui').sess; return { i: s.i, item: 'w:' + s.q[s.i].wid + ':' + s.q[s.i].dim }; });
  await expect(page.locator('header .gybtn')).toBeHidden();   // làm bài: thanh đầu trang ẩn → nút nổi
  await page.locator('.gyfab').click();
  await expect(page.locator('#gysheet [role="dialog"]')).toBeVisible();
  await expect(page.locator('#gysheet')).toContainText(before.item);   // bối cảnh: câu đang làm
  const ax = await new AxeBuilder({ page }).include('#gysheet').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  await page.locator('#gysheet [data-act="gykind"][data-v="kho"]').click();
  await page.locator('#gytxt').fill('Câu này nghĩa tiếng Việt khó hiểu');
  await page.locator('#gyfile').setInputFiles({ name: 'man-hinh.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#gysheet .gyth img')).toHaveCount(1);
  await expect(page.locator('#gytxt')).toHaveValue('Câu này nghĩa tiếng Việt khó hiểu');   // vẽ lại không mất chữ
  await page.locator('#gysheet [data-act="gysend"]').click();
  await expect(page.locator('#gysheet')).toHaveCount(0);
  expect(up.length).toBe(1); expect(up[0]).toMatch(/el-gopy\/\d{4}-\d{2}\/[a-z0-9]{8,40}\.jpg$/);
  expect(rpc.length).toBe(1);
  expect(rpc[0]).toMatchObject({ kind: 'kho', txt: 'Câu này nghĩa tiếng Việt khó hiểu', imgd: [] });
  expect(rpc[0].imgs[0]).toMatch(/^\d{4}-\d{2}\/[a-z0-9]+\.jpg$/);
  expect(rpc[0].ctx).toMatchObject({ view: 'session', sk: 'fast', item: before.item });
  // vẫn ở đúng câu đang làm
  expect(await page.evaluate(() => { const w = window as any; return [w.eval('ui').view, w.eval('ui').sess.i]; })).toEqual(['session', before.i]);
  expect(await page.evaluate(() => (window as any).eval('gyLS(GY_LS)').length)).toBe(0);
  // danh sách đã gửi ở màn Góp ý
  await page.evaluate(() => (window as any).eval("go('feedback')"));
  await expect(page.locator('#app')).toContainText('#42');
  expect(errors).toEqual([]);
});

test('v167 kho ảnh lỗi → ảnh gửi kèm dạng data URL; mất mạng → lưu trên máy, có mạng gửi bù; thiếu chữ thì nhắc', async ({ page, errors }) => {
  let down = true; const rpc: any[] = [];
  await page.route(/\/storage\/v1\/object\/el-gopy\//, r => r.fulfill({ status: 403, body: '{}' }));
  await page.route(/rest\/v1\/rpc\/el_gopy_post/, async r => { if (down) return r.fulfill({ status: 503, body: '' }); rpc.push(JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: '7' }); });
  await open(page);
  await page.locator('header .gybtn').click();
  await page.locator('#gysheet [data-act="gysend"]').click();
  await expect(page.locator('#gysheet')).toContainText('Gõ vài chữ');
  await page.locator('#gytxt').fill('Nút này không bấm được');
  await page.locator('#gyfile').setInputFiles({ name: 'a.png', mimeType: 'image/png', buffer: PNG });
  await expect(page.locator('#gysheet .gyth img')).toHaveCount(1);
  await page.locator('#gysheet [data-act="gysend"]').click();
  await expect(page.locator('#gysheet')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).eval('gyLS(GY_LS)').length)).toBe(1);
  down = false;
  await page.evaluate(() => (window as any).eval('gyFlush()'));
  expect(await page.evaluate(() => (window as any).eval('gyLS(GY_LS)').length)).toBe(0);
  expect(rpc[0]).toMatchObject({ kind: 'loi', txt: 'Nút này không bấm được', imgs: [] });
  expect(rpc[0].imgd[0]).toMatch(/^data:image\/jpeg;base64,/);
  expect(errors.filter(e => !/40[0-9]|503|Failed to load resource/.test(e))).toEqual([]);
});
