import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v134 Sân tập trước cổng (src/engine/drill.ts): 10 kiểu bài A2 Key bằng câu riêng; chữa ngay sau mỗi bài; lần làm đầu là số đo của
// phần, làm lại không đổi số đo. Không dùng chữ thi / kiểm tra trên khung màn hình.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const BANNED = /(?<![\p{L}])(thi|kiểm tra|bài dò|chẩn đoán|làm bài)(?![\p{L}])/iu;
const chrome = (page: Page) => page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .muted, #app .hint').allInnerTexts().then(x => x.join('\n'));

async function setup(page: Page): Promise<void> {
  await page.goto('/?playtest=0');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a2', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page);
  await page.evaluate(() => (window as any).eval("go('goal',{er:'gate'})"));
}

test('Sân tập: cổng khoá vẫn vào được sân tập; 10 phần; làm một bài Đọc, chữa ngay, ghi số đo lần đầu', async ({ page, errors }) => {
  test.setTimeout(90_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await setup(page);
  await expect(page.getByRole('heading', { name: 'Cổng còn khoá' })).toBeVisible();
  await page.getByRole('button', { name: 'Vào sân tập' }).click();
  await expect(page.getByRole('heading', { name: 'Sân tập' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Luyện' })).toHaveCount(10);
  expect(await chrome(page)).not.toMatch(BANNED);
  await noHorizontalScroll(page);

  await page.locator('[data-e="drpart"][data-q="k-r1"]').click();
  const form = page.locator('form[data-eform="drmark"]');
  await expect(form).toBeVisible();
  const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  const fs = form.locator('fieldset');
  const n = await fs.count();
  expect(n).toBe(6);
  for (let k = 0; k < n; k++) await fs.nth(k).locator('input[type="radio"]').first().check();
  await form.getByRole('button', { name: 'Chấm bài' }).click();
  await expect(page.getByText(/^Đúng \d\/6$/)).toBeVisible();
  await expect(page.getByText('Lần làm đầu: đã ghi vào số đo của phần này.')).toBeVisible();
  const rec = await page.evaluate(() => (window as any).eval('st').e.gg?.dr?.['k-r1-01']);
  expect(rec?.n).toBe(6);
  expect(await chrome(page)).not.toMatch(BANNED);

  // Bài tiếp theo của phần là bài chưa làm.
  await page.getByRole('button', { name: 'Bài tiếp' }).click();
  await expect(page.locator('.eyebrow').first()).toContainText('bài 2/');
  await page.getByRole('button', { name: 'Về sân tập' }).click();
  await expect(page.getByText(/1\/5 bài · lần đầu đúng \d+%/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('Sân tập: phần điền từ nhận đáp án gõ tay; bài nghe có trình phát nghe lại được', async ({ page, errors }) => {
  test.setTimeout(90_000);
  await setup(page);
  await page.getByRole('button', { name: 'Vào sân tập' }).click();
  await page.locator('[data-e="drpart"][data-q="k-r5"]').click();
  const form = page.locator('form[data-eform="drmark"]');
  const inputs = form.locator('input.field');
  await expect(inputs).toHaveCount(6);
  await inputs.first().fill('to');   // k-r5-01-1: "write to you"
  await form.getByRole('button', { name: 'Chấm bài' }).click();
  await expect(page.getByText(/^Đúng [1-6]\/6$/)).toBeVisible();
  await page.getByRole('button', { name: 'Về sân tập' }).click();
  await page.locator('[data-e="drpart"][data-q="k-l1"]').click();
  await expect(page.locator('audio[controls]').first()).toBeVisible();
  expect(errors).toEqual([]);
});
