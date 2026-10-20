import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v174 📊 Theo dõi học (người sáng lập 20/10/2026): mục riêng ở Mục tiêu, 12 chỉ số trong 4 nhóm; ít dữ liệu thì "chưa đủ dữ liệu".
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function open(page: Page): Promise<void> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(() => { const w = window as any; w.eval('st').onboarded = true; w.eval("ui.ndLv='A1'"); w.eval('save()'); w.eval('emLoad()'); });
  await page.waitForFunction(() => { const w = window as any; return !!(w.eval('EM') && w.eval('EM').parts && w.eval('EM').parts('cefr-a1')); }, null, { timeout: 30000 });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`v174 Mục tiêu → 📊 Theo dõi học: 4 nhóm, 12 chỉ số; mới bắt đầu thì "chưa đủ dữ liệu"; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await open(page);
    await page.evaluate(() => (window as any).eval("go('aim')"));
    const btn = page.locator('#app [data-go="track"]');
    await expect(btn).toBeVisible({ timeout: 30000 });
    await btn.click();
    await expect(page.getByRole('heading', { name: '📊 Theo dõi học', level: 1 })).toBeVisible();
    await expect(page.locator('#bnav [data-go="aim"]')).toHaveAttribute('aria-current', 'page');
    for (const h of ['A. Đích', 'B. Công sức', 'C. Học bài mới', 'D. Nhớ và chỗ yếu']) await expect(page.locator('#app h2', { hasText: h })).toBeVisible();
    const txt = await page.locator('#app').innerText();
    for (let i = 1; i <= 12; i++) expect(txt, `chỉ số ${i}`).toMatch(new RegExp(`(^|\\n|\\s)${i}(\\.|\\s)`));
    await expect(page.locator('#app')).toContainText('chưa đủ dữ liệu');
    await expect(page.locator('#app svg[role="img"]')).toBeVisible();
    const ax = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(ax.violations.map(v => v.id)).toEqual([]);
    await noHorizontalScroll(page);
    await page.locator('#app [data-go="aim"]').first().click();
    await expect(page.locator('#app [data-go="track"]')).toBeVisible({ timeout: 30000 });
    expect(errors).toEqual([]);
  });
}

test('v174 ghi số: trả lời câu → câu / từ sai / kỹ năng; ôn đến hạn → nhớ thật so với dự đoán; bài cuối unit → lần đầu qua / trượt; thời gian chạm', async ({ page, errors }) => {
  await open(page);
  const r = await page.evaluate(() => { const w = window as any, t = w.eval('today()'), W = w.eval('W'), u = w.eval('UNITS')[0], wid = u.words[0].id;
    w.eval('eEv')({ node: 'u:' + u.id, level: 3, ok: false, item: 'w:' + wid + ':rcl', qt: 'typed' });
    w.eval('eEv')({ node: 'u:' + u.id, level: 3, ok: true, item: 'w:' + wid + ':rcl', qt: 'typed' });
    const s = W(u.words[1].id); Object.assign(s, { learned: true, due: t, fs: 3, fl: t - 3, ivl: 3, stage: 1 }); w.eval('srsStep')(s, true, true);
    w.eval('trkTest')(u.id, false); w.eval('trkTest')(u.id, true);
    w.eval('ui').view = 'learn'; w.eval('ui').learn = { uid: u.id, i: 0 };
    const T0 = w.eval('TRKT'); T0.at = Date.now() - 30000; w.eval('trkTick')();
    const T = JSON.parse(JSON.stringify(w.eval('TRK()'))); return { T, t, wid, uid: u.id }; });
  expect(r.T.d[r.t].q).toBe(2);
  expect(r.T.w[r.wid]).toEqual([2, 1]);
  expect(r.T.dim.rcl).toEqual([2, 1]);
  expect(r.T.rd[r.t][0]).toBe(1); expect(r.T.rd[r.t][1]).toBe(1); expect(r.T.rd[r.t][2]).toBeGreaterThan(0.8);
  expect(r.T.u[r.uid][2]).toBe(2); expect(r.T.u[r.uid][3]).toBe(0);   // lần đầu trượt
  expect(r.T.d[r.t].m).toBeGreaterThanOrEqual(29); expect(r.T.u[r.uid][1]).toBeGreaterThanOrEqual(29);
  // lưu / tải lại giữ số (sanitizeState)
  const kept = await page.evaluate(() => { const w = window as any; return w.eval('sanitizeState')(JSON.parse(JSON.stringify(w.eval('st')))).trk; });
  expect(kept.w[r.wid]).toEqual([2, 1]); expect(kept.u[r.uid]).toEqual(r.T.u[r.uid]);
  expect(errors).toEqual([]);
});

test('v174 đủ dữ liệu: ngày dự kiến theo tốc độ 14 ngày; nhớ thật thấp hơn dự đoán → báo quên nhanh; top từ sai; kỹ năng yếu nhất', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => { const w = window as any, t = w.eval('today()'), T = w.eval('TRK()'), words = w.eval('ALL_WORDS');
    for (let i = 0; i < 10; i++) T.d[t - 10 + i] = { m: 1800, mr: 600, q: 60, l: 26 + 2 * i, me: 5 + i, tot: 130, lv: 'A1', due: 30 + i };
    T.rd[t - 1] = [40, 24, 34];   // nhớ 60%, máy dự đoán 85%
    T.w[words[0].id] = [5, 4]; T.w[words[1].id] = [6, 2];
    T.dim = { rec: [20, 19], rcl: [20, 9], spl: [12, 10] };
    w.dayParts = () => ({ learn: 46, mem: 15, total: 130, miss: [] });   // số hôm nay khớp đường đã có
    w.eval("go('track')"); });
  const app = page.locator('#app');
  await expect(app).toContainText('📘 Học đạt 80% khoảng');
  await expect(app).toContainText('Bạn quên nhanh hơn dự đoán');
  await expect(app.locator('ol li').first()).toContainText('sai 4/5');
  await expect(app).toContainText('Nhớ ra từ 45% (yếu nhất)');
  await expect(app).toContainText('Phút học / ngày');
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});
