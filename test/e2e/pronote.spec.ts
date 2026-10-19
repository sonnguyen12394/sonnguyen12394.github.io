import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v142 hướng dẫn phát âm từng câu (người sáng lập 16/10/2026): Nói nhại và Đọc to hiện câu dạng dòng đôi (chữ / phiên âm), từ nhấn,
// từ đọc nhẹ, âm cuối, nối âm, ↗ / ↘ và mẹo; từ máy nghe chưa ra có mẹo đúng âm. Chỉ để luyện: không ghi bằng chứng.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BANNED = /(?<![\p{L}])(thi|đề|kiểm tra)(?![\p{L}])/iu;

async function open(page: Page): Promise<number> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  return page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); return st.e.ev.led.length; });
}
// Máy nghe "nghe ra" mọi từ trừ từ thứ `skip` của câu đang luyện (khoá `key`).
const fakeMiss = (page: Page, key: string, target: string, skip: number) => page.evaluate(([k, t, s]) => {
  const w = window as any, A = w.eval('ASR'), words = w.eval('gsent')(t).split(' ').filter(Boolean), hit = words.map((_: string, i: number) => i).filter((i: number) => i !== s);
  A.key = k; A.on = false; A.err = ''; A.res = { words, hit, heard: words.filter((_: string, i: number) => i !== s).join(' '), p: hit.length / words.length }; w.eval('render()');
}, [key, target, skip] as const);

test('Nói nhại: câu có phiên âm từng từ, ↗ / ↘, mẹo; ẩn / hiện phiên âm; từ máy chưa nghe ra có mẹo; không ghi bằng chứng', async ({ page, errors }) => {
  const led0 = await open(page);
  // câu cố định: startShadow bốc ngẫu nhiên, câu nhiều tên riêng / số chỉ có 1 từ có phiên âm (.pnw) nên test từng chập chờn
  await page.evaluate(() => { const w = window as any; w.eval("startShadow('A1')"); w.eval('ui').sh.q[0] = { t: 'I would like a cup of coffee, please.', vi: 'Tôi muốn một tách cà phê.', v: 0 }; w.eval('render()'); });
  const pn = page.locator('#app .pn');
  await expect(pn).toBeVisible();
  expect(await pn.locator('.pnw').count()).toBeGreaterThan(2);
  expect(await pn.locator('.pni').first().innerText()).toMatch(/^\/.+\/|tên riêng|số/);
  await expect(pn.locator('.pntune')).toHaveText(/↗|↘/);
  await noHorizontalScroll(page);
  // Ẩn phiên âm: nhớ theo người dùng
  await page.locator('[data-act="pnhide"]').click();
  await expect(page.locator('#app .pn.pnoff')).toHaveCount(1);
  expect(await page.evaluate(() => (window as any).eval('st').set.pnHide)).toBe(true);
  await page.locator('[data-act="pnhide"]').click();
  await expect(page.locator('#app .pn.pnoff')).toHaveCount(0);
  // Máy nghe thiếu một từ → khung "Từ máy chưa nghe ra" có mẹo cho đúng từ đó
  const t = await page.evaluate(() => (window as any).eval('ui').sh.q[0].t as string);
  const words = await page.evaluate(x => (window as any).eval('gsent')(x).split(' ').filter(Boolean), t);
  const k = words.findIndex((w: string) => w.length > 3) >= 0 ? words.findIndex((w: string) => w.length > 3) : 0;
  await fakeMiss(page, 'sh0', t, k);
  const miss = page.locator('#app section', { hasText: 'Từ máy chưa nghe ra' });
  await expect(miss).toBeVisible();
  await expect(miss.locator('li').first()).toContainText(new RegExp(words[k]!, 'i'));
  // đi hết lượt: màn kết có "Từ cần luyện thêm"
  await page.locator('[data-act="shnext"]').click();
  for (let i = 1; i < 12; i++) { const b = page.locator('[data-act="shnext"]'); if (!(await b.count())) break; await b.click(); }
  await expect(page.locator('#app')).toContainText('Từ cần luyện thêm');
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`📖 Đọc to bài đọc A1: từng câu có hướng dẫn phát âm, tới màn kết, lưu luyện tập (không bằng chứng); WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const led0 = await open(page);
    await page.evaluate(() => (window as any).eval("startRA('a1-u1')"));
    await expect(page.locator('#app .eyebrow').first()).toContainText('📖 Đọc to');
    await expect(page.locator('#app .pn')).toBeVisible();
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    expect(await page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .hint, #app summary').allInnerTexts().then(x => x.join('\n'))).not.toMatch(BANNED);
    const n = await page.evaluate(() => (window as any).eval('ui').ra.q.length as number);
    expect(n).toBeGreaterThan(3);
    for (let i = 0; i < n; i++) {
      const t = await page.evaluate(() => { const R = (window as any).eval('ui').ra; return R.q[R.i] as string; });
      await fakeMiss(page, `ra${i}`, t, i === 0 ? 0 : -1);
      await page.locator('[data-act="ranext"]').click();
    }
    await expect(page.locator('#app h1')).toContainText('từ được nghe ra');
    const saved = await page.evaluate(() => (window as any).eval('st').pron['ra:a1-u1']);
    expect(saved.n).toBe(1); expect(saved.best).toBeGreaterThan(0.8);
    expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
    const r2 = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r2.violations.map(v => v.id)).toEqual([]);
    expect(errors).toEqual([]);
  });
}

test('📖 Đọc to có lối vào ở bài đọc của unit A1 và ở 🗣 Nói & Đọc', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("startRead('a1-u1')"));
  await page.locator('[data-act="rago"][data-uid="a1-u1"]').click();
  await expect(page.locator('#app .pn')).toBeVisible();
  await page.evaluate(() => (window as any).eval("go('nd')"));
  await page.evaluate(() => { const w = window as any; w.eval('ui').ndPh = true; w.eval('render()'); });   // v157 mở mục 🗣 Luyện phát âm
  await expect(page.locator('#app [data-act="rago"]').first()).toBeVisible();
  expect(errors).toEqual([]);
});
