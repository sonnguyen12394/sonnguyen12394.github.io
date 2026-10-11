import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v111 đầu vào bằng game (SPEC "Mô hình học v111" §1–§2): người mới vào chương mở đầu "Sương Câm" (không phải màn bài dò),
// thắp đèn từ vựng / ngữ pháp, rồi đèn Nghe + Đọc (bộ xếp lớp thích ứng sẵn có), chọn đích trong truyện. Không có chữ thi / kiểm tra.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const BANNED = /(?<![\p{L}])(thi|kiểm tra|bài dò|chẩn đoán|làm bài)(?![\p{L}])/iu;
// Chỉ quét khung màn hình (nhãn, tiêu đề, nút, lời dẫn), không quét nội dung câu học (nghĩa tiếng Việt của từ "test" là "bài kiểm tra").
const chrome = (page: Page) => page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .muted, #app .hint').allInnerTexts().then(x => x.join('\n'));

async function ladder(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.getByText(/Sương Câm/).first()).toBeVisible({ timeout: 15000 });
  expect(await chrome(page)).not.toMatch(BANNED);
  await page.getByRole('button', { name: 'Bắt đầu thử sức' }).click();
  const result = page.getByRole('heading', { name: 'Bạn đang ở đâu', exact: true }), dunno = page.getByRole('button', { name: 'Không biết' }).first();
  for (let i = 0; i < 40 && !(await result.isVisible()); i++) {
    await expect(page.locator('.eyebrow').first()).toContainText(/Sương Câm|Bạn đang ở đâu/);
    await expect(dunno.or(result)).toBeVisible();
    if (await result.isVisible()) break;
    await dunno.click();
  }
  await expect(result).toBeVisible();
}

test('Chương mở đầu: thắp đèn, chọn đích xa hơn trong truyện (snapshot nguồn "chọn trong truyện"); màn không có chữ thi / kiểm tra', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await ladder(page);
  expect(await chrome(page)).not.toMatch(BANNED);
  await expect(page.getByRole('heading', { name: /Bạn muốn đi xa tới đâu/ })).toBeVisible();
  const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await noHorizontalScroll(page);
  await page.screenshot({ path: 'test-results/prologue-result.png', fullPage: true });
  await page.getByRole('button', { name: /^Xa hơn: A2/ }).click();
  const e = await page.evaluate(() => (window as any).eval('st').e);
  expect(e.goals[0].id).toBe('cefr-a2');
  expect(e.ev.snap.some((s: any) => s.dec === 'goal:STORY' && s.info.goal === 'cefr-a2')).toBe(true);
  await page.getByRole('button', { name: /^▶ Giữ đích A2/ }).click();
  await page.getByRole('heading', { name: /Hôm nay chơi gì/ }).waitFor({ timeout: 15000 });
  expect(errors).toEqual([]);
});

test('Chương mở đầu: đèn Nghe + Đọc dùng bộ xếp lớp thích ứng, kết quả hiện cấp nghe / đọc', async ({ page, errors }) => {
  test.setTimeout(120_000);
  await ladder(page);
  await page.getByRole('button', { name: /Thắp đèn Nghe \+ Đọc/ }).click();
  for (let i = 0; i < 40; i++) {
    if (await page.getByRole('heading', { name: 'Bạn đang ở đâu', exact: true }).isVisible()) break;
    const form = page.locator('form[data-eform="lrnext"]');
    await expect(form).toBeVisible({ timeout: 15000 });
    expect(await chrome(page)).not.toMatch(BANNED);
    if (await page.getByRole('button', { name: /Bỏ qua đèn Nghe/ }).isVisible()) { await page.getByRole('button', { name: /Bỏ qua đèn Nghe/ }).click(); continue; }
    const radios = form.locator('fieldset');
    for (let k = 0; k < await radios.count(); k++) await radios.nth(k).locator('input[type="radio"]').first().check();
    await form.getByRole('button', { name: 'Thắp tiếp' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Bạn đang ở đâu', exact: true })).toBeVisible();
  await expect(page.locator('.me-stats')).toContainText('đọc');
  await expect(page.getByRole('button', { name: /Thắp đèn Nghe \+ Đọc/ })).toHaveCount(0);
  const x = await page.evaluate(() => (window as any).eval('st').x.attempts.filter((a: any) => a.kind === 'place').map((a: any) => a.skill));
  expect(x).toContain('R');
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.snap.some((s: any) => s.subj === 'lr'))).toBe(true);
  expect(errors).toEqual([]);
});
