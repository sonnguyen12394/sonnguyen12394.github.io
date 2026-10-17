import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v144 📝 Bài luyện theo cấp (người sáng lập 16/10/2026): bài mới mỗi lần (sinh từ khuôn song song Anh – Việt hoặc bài có sẵn đã có nghĩa
// từng câu), A1 / A2 × Dễ / Vừa / Khó; luyện phát âm (màn Đọc to), dịch Anh → Việt (tự chấm), Việt → Anh (máy so từng từ). Không ghi bằng chứng.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BANNED = /(?<![\p{L}])(thi|đề|kiểm tra)(?![\p{L}])/iu;

async function open(page: Page, gp: Record<string, unknown>): Promise<number> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  return page.evaluate(g => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); w.eval('ui').gp = g; w.eval("go('gp')"); return st.e.ev.led.length; }, gp);
}
const lines = (page: Page) => page.evaluate(() => (window as any).eval('ui').gp.text.lines as Array<{ en: string; vi: string }>);

test('Phát âm: bài mới chạy trên màn Đọc to (có nghĩa từng câu), tới màn kết, lưu điểm theo cấp × bậc; không ghi bằng chứng', async ({ page, errors }) => {
  const led0 = await open(page, { lv: 'A1', tier: 1, mode: 'say', kind: 'read' });
  await page.locator('[data-act="gpnew"]').click();
  await expect(page.locator('#app .eyebrow').first()).toContainText('📖 Đọc to');
  await expect(page.locator('#app .pn')).toBeVisible();
  await expect(page.locator('#app details summary', { hasText: 'Nghĩa' })).toBeVisible();
  const n = await page.evaluate(() => (window as any).eval('ui').ra.q.length as number);
  for (let i = 0; i < n; i++) { await page.evaluate(() => { const w = window as any; w.eval('ui').ra.self = 1; }); await page.locator('[data-act="ranext"]').click(); }
  await expect(page.locator('#app h1')).toContainText('từ được nghe ra');
  expect((await page.evaluate(() => (window as any).eval('st').pron['gp:A1:1:say'])).n).toBe(1);
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
  await page.locator('[data-act="gp"]').first().click();
  await expect(page.getByRole('heading', { name: /Bài mới mỗi lần/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('Anh → Việt: xem nghĩa + nghĩa từng từ, tự chấm từng câu, tới kết quả 100%; bài mới khác bài cũ', async ({ page, errors }) => {
  await open(page, { lv: 'A2', tier: 2, mode: 'e2v', kind: 'read' });
  await page.locator('[data-act="gpnew"]').click();
  const a = await lines(page);
  for (let i = 0; i < a.length; i++) {
    await expect(page.locator('#app .pn')).toBeVisible();
    await page.locator('[data-act="gpshow"]').click();
    await expect(page.locator('#app .fb')).toContainText(a[i]!.vi);
    await page.locator('[data-gpself="1"]').click();
    await page.locator('[data-act="gpnext"]').click();
  }
  await expect(page.locator('#app h1')).toHaveText('100%');
  await expect(page.locator('#app')).toContainText('Thử bậc Khó');
  let other = false;
  for (let k = 0; k < 4 && !other; k++) { await page.locator('[data-act="gpnew"]').first().click(); other = JSON.stringify(await lines(page)) !== JSON.stringify(a); }
  expect(other).toBe(true);
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`Việt → Anh: gõ đúng câu gốc → 100%, gõ thiếu → tô từ thiếu; màn chọn và màn làm bài WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const led0 = await open(page, { lv: 'A1', tier: 1, mode: 'v2e', kind: 'talk' });
    await noHorizontalScroll(page);
    const r0 = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r0.violations.map(v => v.id)).toEqual([]);
    await page.locator('[data-act="gpnew"]').click();
    const a = await lines(page);
    await expect(page.locator('#app .prompt')).toHaveText(a[0]!.vi);
    await page.locator('#gptyped').fill(a[0]!.en);
    await page.locator('[data-act="gpcheck"]').click();
    await expect(page.locator('#app .fb strong')).toContainText('(100%)');
    await page.locator('[data-act="gpnext"]').click();
    const words = a[1]!.en.split(/\s+/);
    await page.locator('#gptyped').fill(words.slice(0, Math.max(1, words.length - 2)).join(' '));
    await page.locator('[data-act="gpcheck"]').click();
    await expect(page.locator('#app .fb .asr-miss').first()).toBeVisible();
    await expect(page.locator('#app .pn')).toBeVisible();
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(x => x.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    expect(await page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .hint').allInnerTexts().then(x => x.join('\n'))).not.toMatch(BANNED);
    await page.locator('[data-act="gpnext"]').click();
    for (let i = 2; i < a.length; i++) { await page.locator('[data-act="gpskip"]').click(); await page.locator('[data-act="gpnext"]').click(); }
    await expect(page.locator('#app h1')).toHaveText(/%$/);
    expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
    expect(errors).toEqual([]);
  });
}

test('Lối vào: tab 🗣 Nói & Đọc (v149) và dòng Phát âm ở 🎯 Mục tiêu', async ({ page, errors }) => {
  await open(page, { lv: 'A1', tier: 1, mode: 'say', kind: 'read' });
  await page.evaluate(() => (window as any).eval("go('nd')"));
  await page.evaluate(() => { const w = window as any; w.eval('ui').ndPh = true; w.eval('render()'); });   // v157 mở mục 🗣 Luyện phát âm
  await page.locator('#app [data-act="gp"]').first().click();
  await expect(page.locator('[data-act="gpmode"][data-v="say"]')).toHaveAttribute('aria-pressed', 'true');
  await page.evaluate(() => (window as any).eval("go('aim')"));
  await expect(page.locator('#app [data-act="gp"][data-mode="say"]').first()).toBeAttached();
  expect(errors).toEqual([]);
});
