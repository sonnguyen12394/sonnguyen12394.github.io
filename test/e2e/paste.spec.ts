import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v143 📋 Phân tích bài dán vào (người sáng lập 16/10/2026): dán bài nói / viết tiếng Anh → từng câu có phiên âm, cách đọc, nghĩa từng từ
// (từ điển của app, không dịch cả câu), gợi ý ngữ pháp, mẹo phát âm; đọc to cả bài. Chạy trên máy; không ghi bằng chứng.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const BANNED = /(?<![\p{L}])(thi|đề|kiểm tra)(?![\p{L}])/iu;
const TEXT = "Hi everyone! My name is Lan and I'm a student. Last summer, I went to Da Nang with my family.\nWe stayed in a small hotel next to the beach. Have you ever tried Vietnamese coffee?";

async function open(page: Page): Promise<number> {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  return page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); return st.e.ev.led.length; });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`dán bài → tách câu, phiên âm, nghĩa từng từ, ngữ pháp; đọc to cả bài; nhớ bài đã dán; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const led0 = await open(page);
    await page.evaluate(() => { const w = window as any; w.eval("ui.talkTab='doc'"); w.eval("go('talk')"); });
    await page.locator('#app [data-act="paste"]').first().click();
    await expect(page.getByRole('heading', { name: 'Phân tích bài dán vào' })).toBeVisible();
    await page.locator('#pastebox').fill(TEXT);
    await page.locator('[data-act="pastego"]').click();
    await expect(page.locator('#app h2').first()).toContainText('5 câu');
    const cards = page.locator('details.pcard');
    await expect(cards).toHaveCount(5);
    await expect(cards.first().locator('.pn')).toBeVisible();
    // câu 3: quá khứ đơn, went → go, tên riêng không phiên âm
    const c3 = cards.nth(2); await c3.locator('summary').click();
    await expect(c3.locator('.glc', { hasText: 'went' })).toContainText('go');
    await expect(c3.locator('.glc', { hasText: 'family' })).toContainText('gia đình');
    await expect(c3).toContainText('Quá khứ đơn');
    await expect(c3.locator('.pni', { hasText: 'tên riêng' }).first()).toBeVisible();
    // câu 4: cụm từ "next to" gộp; câu 5: hiện tại hoàn thành + câu hỏi ↗
    const c5 = cards.nth(3); await c5.locator('summary').click(); await expect(c5.locator('.glc', { hasText: 'next to' })).toContainText('bên cạnh');
    const c6 = cards.nth(4); await c6.locator('summary').click(); await expect(c6).toContainText('Hiện tại hoàn thành'); await expect(c6.locator('.pntune')).toHaveText('↗');
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    expect(await page.locator('#app .eyebrow, #app h1, #app h2, #app h3, #app button, #app .hint, #app summary').allInnerTexts().then(x => x.join('\n'))).not.toMatch(BANNED);
    // đọc to cả bài: tới màn kết, không lưu điểm, không ghi bằng chứng
    await page.locator('[data-act="pastera"]').click();
    await expect(page.locator('#app .eyebrow').first()).toContainText('📖 Đọc to');
    for (let i = 0; i < 5; i++) await page.locator('[data-act="ranext"]').click();
    await expect(page.locator('#app h1')).toContainText('Đã đọc xong');
    expect(await page.evaluate(() => Object.keys((window as any).eval('st').pron).filter(k => k.startsWith('ra:')))).toEqual([]);
    expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
    // quay lại: bài đã dán còn đó (nhớ trên máy)
    await page.locator('[data-act="paste"]').first().click();
    await page.evaluate(() => { const w = window as any; w.eval('ui.pasteTxt=null'); w.eval('ui.pasteRes=null'); w.eval('render()'); });
    await expect(page.locator('#pastebox')).toHaveValue(TEXT);
    expect(errors).toEqual([]);
  });
}

test('dán đoạn trống thì nhắc; Tôi có lối vào', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("go('paste')"));
  await page.locator('#pastebox').fill('   ');
  await page.locator('[data-act="pastego"]').click();
  await expect(page.locator('details.pcard')).toHaveCount(0);
  await page.evaluate(() => (window as any).eval("go('more')"));
  await expect(page.locator('#app [data-go="paste"]')).toBeVisible();
  expect(errors).toEqual([]);
});
