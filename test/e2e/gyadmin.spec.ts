import AxeBuilder from '@axe-core/playwright';
import { test, expect, closeModal } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v168 🔐 Quản lý góp ý (người sáng lập 19/10/2026): danh sách theo loại × trạng thái, chi tiết + ảnh, sửa / thêm / xoá (trạng thái 'xoa').
// Cần khoá quản trị ELA-… (máy chủ kiểm). Mọi lời gọi máy chủ được giả lập; chặn service worker để page.route bắt được trên WebKit.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false, serviceWorkers: 'block' });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const KEY = 'ELA-6N3G-ZX4V-WY45-ST73-VTQ7';
const ROWS = [
  { id: 7, at: '2026-10-19T03:00:00Z', kind: 'loi', txt: 'Nút Kiểm tra không bấm được', ctx: { view: 'session', h1: null, item: 'w:have:rcl', scr: '390x844' }, imgs: ['2026-10/abcdefgh12345678.jpg'], imgd: [], status: 'moi', note: null, app_v: 105 },
  { id: 8, at: '2026-10-19T04:00:00Z', kind: 'y', txt: 'Thêm nghe chậm', ctx: { view: 'nd' }, imgs: [], imgd: [], status: 'dang', note: 'để bản sau', app_v: 105 },
];

async function setup(page: Page) {
  const calls: Record<string, any[]> = {};
  const rec = (n: string, b: any) => { (calls[n] ||= []).push(b); };
  await page.route(/rest\/v1\/rpc\/el_admin_ok/, async r => { const b = JSON.parse(r.request().postData() || '{}'); rec('ok', b); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b.k === KEY) }); });
  await page.route(/rest\/v1\/rpc\/el_gopy_list/, async r => { const b = JSON.parse(r.request().postData() || '{}'); rec('list', b);
    const rows = ROWS.filter(x => (!b.kd || x.kind === b.kd) && (b.st ? x.status === b.st : x.status !== 'xoa'));
    await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b.k === KEY ? { rows, count: { 'loi:moi': 1, 'y:dang': 1, 'kho:bo': 2 } } : null) }); });
  await page.route(/rest\/v1\/rpc\/el_gopy_set/, async r => { rec('set', JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: 'true' }); });
  await page.route(/rest\/v1\/rpc\/el_gopy_add/, async r => { rec('add', JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: '9' }); });
  await page.route(/functions\/v1\/el-gopy-img/, async r => { rec('img', JSON.parse(r.request().postData() || '{}')); await r.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ urls: { '2026-10/abcdefgh12345678.jpg': 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==' } }) }); });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => { const w = window as any; w.eval('st').onboarded = true; w.eval('save()'); w.eval("go('feedback')"); });
  await closeModal(page);
  return calls;
}

test('v168 quản lý góp ý: khoá sai bị chặn; khoá đúng → danh sách theo loại × trạng thái, chi tiết + ảnh; WCAG AA, 390 px', async ({ page, errors }) => {
  const calls = await setup(page);
  await page.locator('#app [data-go="gyadmin"]').click();
  await page.locator('#gakey').fill('ELA-0000-0000-0000-0000-0000');
  await page.locator('#app [data-act="galogin"]').click();
  await expect(page.locator('#gakey')).toBeVisible();   // sai khoá: vẫn ở màn nhập
  await page.locator('#gakey').fill(KEY.toLowerCase());
  await page.locator('#app [data-act="galogin"]').click();
  await expect(page.locator('#app .gacard')).toHaveCount(2);
  expect(calls.list![0]).toMatchObject({ k: KEY, st: null, kd: null });
  await expect(page.locator('#app .gacard[data-id="7"]')).toContainText('Nút Kiểm tra không bấm được');
  await expect(page.locator('#app .gacard[data-id="7"]')).toContainText('w:have:rcl');
  await expect(page.locator('#app .gacard[data-id="7"] img')).toHaveCount(1);   // ảnh qua link có hạn
  expect(calls.img![0]).toMatchObject({ key: KEY, paths: ['2026-10/abcdefgh12345678.jpg'] });
  await expect(page.locator('#app [data-act="gakd"][data-v="loi"]')).toContainText('1');   // đếm theo loại
  await expect(page.locator('#app [data-act="gast"][data-v="bo"]')).toContainText('2');
  const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(ax.violations.map(v => v.id)).toEqual([]);
  // lọc theo loại
  await page.locator('#app [data-act="gakd"][data-v="y"]').click();
  await expect(page.locator('#app .gacard')).toHaveCount(1);
  expect(calls.list!.at(-1)).toMatchObject({ kd: 'y' });
  // tải lại trang: khoá vẫn nhớ trên máy
  await page.reload(); await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => (window as any).eval("go('gyadmin')"));
  await expect(page.locator('#app .gacard').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('v168 quản lý góp ý: đổi trạng thái nhanh, xoá (chuyển vào Đã xoá), sửa chi tiết, thêm tay, quên khoá', async ({ page, errors }) => {
  const calls = await setup(page);
  await page.evaluate(k => { localStorage.setItem('vocab-ladder-v1-admin', k); (window as any).eval("go('gyadmin')"); }, KEY);
  await expect(page.locator('#app .gacard')).toHaveCount(2);
  await page.locator('#app .gacard[data-id="7"] [data-act="gaquick"][data-v="xong"]').click();
  await expect.poll(() => (calls.set || []).length).toBe(1);
  expect(calls.set![0]).toMatchObject({ k: KEY, gid: 7, st: 'xong', nt: null, kd: null, tx: null });
  await page.locator('#app .gacard[data-id="8"] [data-act="gaquick"][data-v="xoa"]').click();
  await expect.poll(() => (calls.set || []).length).toBe(2);
  expect(calls.set![1]).toMatchObject({ gid: 8, st: 'xoa' });
  await page.locator('#app .gacard[data-id="7"] summary').click();
  await page.locator('#gatx-7').fill('Nút Kiểm tra bị che trên iPhone');
  await page.locator('#gant-7').fill('sửa ở bản 107');
  await page.locator('#gakd-7').selectOption('kho');
  await page.locator('#app [data-act="gasave"][data-id="7"]').click();
  await expect.poll(() => (calls.set || []).length).toBe(3);
  expect(calls.set![2]).toMatchObject({ gid: 7, st: 'moi', kd: 'kho', tx: 'Nút Kiểm tra bị che trên iPhone', nt: 'sửa ở bản 107' });
  await page.locator('#app [data-act="ganew"]').first().click();
  await page.locator('#ganew-kd').selectOption('y');
  await page.locator('#ganew-tx').fill('Ý tưởng: chế độ tối tự bật ban đêm');
  await page.locator('#app [data-act="gaadd"]').click();
  await expect.poll(() => (calls.add || []).length).toBe(1);
  expect(calls.add![0]).toMatchObject({ k: KEY, kd: 'y', tx: 'Ý tưởng: chế độ tối tự bật ban đêm', nt: null });
  await page.locator('#app [data-act="galogout"]').click();
  await expect(page.locator('#gakey')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('vocab-ladder-v1-admin'))).toBeNull();
  expect(errors).toEqual([]);
});
