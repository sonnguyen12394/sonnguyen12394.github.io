import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v145 máy nghe hiện chữ ngay khi nói (kiểu ELSA) và không bỏ chữ đã nghe: WebKit iPhone hay không trả kết quả cuối (onend tới trước) →
// app chấm bằng chữ tạm cuối cùng thay vì báo "chưa nghe thấy gì". Test thay máy nghe của trình duyệt bằng lớp giả phát sự kiện.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function open(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const w = window as any; w.__asr = [];
    w.webkitSpeechRecognition = class { constructor() { w.__asr.push(this); } start() { (this as any).started = true; } stop() { (this as any).stopped = true; } abort() {} };
    w.SpeechRecognition = undefined;
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; st.set.asr = true; w.eval('save()'); w.eval("go('paste')"); });
  await page.locator('#pastebox').fill('Hanoi has four seasons. I like summer.');
  await page.locator('[data-act="pastego"]').click();
  await page.locator('[data-act="pastera"]').click();
}
// Phát sự kiện từ máy nghe giả đang chạy: kết quả (tạm / cuối) hoặc kết thúc.
const emit = (page: Page, texts: string[], final: boolean) => page.evaluate(([t, f]) => {
  const w = window as any, r = w.__asr[w.__asr.length - 1];
  r.onresult({ results: (t as string[]).map(x => Object.assign([{ transcript: x }], { isFinal: f })) });
}, [texts, final] as const);
const end = (page: Page) => page.evaluate(() => { const w = window as any, r = w.__asr[w.__asr.length - 1]; r.onend(); });

test('đang nói: chữ máy nghe hiện ngay; kết thúc mà không có kết quả cuối → vẫn chấm bằng chữ tạm, tô từ thiếu + mẹo', async ({ page, errors }) => {
  await open(page);
  await page.locator('[data-act="asr"]').click();
  await expect(page.locator('#asrlive')).toHaveText('…');
  await emit(page, ['hanoi has'], false);
  await expect(page.locator('#asrlive')).toHaveText('hanoi has');
  await emit(page, ['hanoi has four'], false);
  await expect(page.locator('#asrlive')).toHaveText('hanoi has four');
  await page.locator('[data-act="asrstop"]').click();
  expect(await page.evaluate(() => { const w = window as any; return w.__asr[w.__asr.length - 1].stopped; })).toBe(true);
  await end(page);
  await expect(page.locator('#app .fb strong').first()).toHaveText('Máy nghe ra 3/4 từ');
  await expect(page.locator('#app .fb .asr-miss')).toHaveText('seasons');
  await expect(page.locator('#app section', { hasText: 'Từ máy chưa nghe ra' })).toContainText('seasons');
  await noHorizontalScroll(page);
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('có kết quả cuối thì chấm ngay; từ nghe nhầm (không có trong câu mẫu) gạch nhạt; không nghe được gì thì báo rõ cách bật micro', async ({ page, errors }) => {
  await open(page);
  await page.locator('[data-act="asr"]').click();
  await emit(page, ['hanoi has four seasons'], true);
  await expect(page.locator('#app .fb strong').first()).toHaveText('Máy nghe ra 4/4 từ');
  await page.locator('[data-act="asr"]').click();
  await emit(page, ['hanoi has for reasons'], true);
  await expect(page.locator('#app .fb .asr-x')).toHaveText(['for', 'reasons']);
  await page.locator('[data-act="asr"]').click();
  await end(page);
  await expect(page.locator('#app [role="status"]').first()).toContainText('chưa nghe thấy gì');
  expect(errors).toEqual([]);
});
