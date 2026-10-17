import { test, expect, noHorizontalScroll, play } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v119 Người mới tinh: "Tôi chưa biết gì tiếng Anh" bỏ lượt dò, mọi cụm từ / điểm ngữ pháp được coi là chưa biết, nên câu đầu tiên
// của mỗi phần mới đi sau một thẻ dạy (tháp, Bài Câu); câu ngay sau thẻ là bằng chứng có trợ giúp (hint), như bí kíp 60 giây.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function zero(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: 'Bắt đầu', exact: true }).click();
  await expect(page.getByText(/Sương Câm/).first()).toBeVisible({ timeout: 15000 });
  // WebKit trên CI: bấm trúng lúc app vẽ lại (máy nạp xong) thì mất lượt bấm → chờ máy nạp, bấm lại nếu chưa sang màn.
  await page.waitForFunction(() => (window as any).ELREADY === true);
  const zeroBtn = page.getByRole('button', { name: 'Tôi chưa biết gì tiếng Anh' }), head = page.getByRole('heading', { name: 'Bắt đầu từ chữ cái' });
  await expect(async () => { if (await zeroBtn.isVisible()) await zeroBtn.click(); await expect(head).toBeVisible({ timeout: 3000 }); }).toPass({ timeout: 20000 });
}
const lastEv = (page: Page) => page.evaluate(() => { const l = (window as any).eval('st').e.ev.led; return l[l.length - 1]; });
async function lobby(page: Page): Promise<void> {
  await page.getByRole('button', { name: 'Vào Phố Chữ' }).click();
  await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
  await page.getByRole('heading', { name: /Hôm nay chơi gì/ }).waitFor({ timeout: 15000 });
}

test('Tôi chưa biết gì: không hỏi dò, đích A1, câu đầu của phần mới có thẻ dạy trước (trả lời sau thẻ = có trợ giúp)', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await zero(page);
  await noHorizontalScroll(page);
  await page.screenshot({ path: 'test-results/zero-result.png' });
  const e0 = await page.evaluate(() => (window as any).eval('st').e);
  expect(e0.goals.map((g: any) => g.id)).toEqual(['cefr-a1']);
  expect(e0.ev.led.filter((x: any) => x.src === 'diag')).toEqual([]);   // không câu dò nào
  // Mọi nút từ vựng / ngữ pháp có tiên nghiệm "chưa biết" từ xếp lớp.
  const pri = Object.values(e0.ev.pri) as Array<{ a: number; b: number; src: string }>;
  expect(pri.length).toBeGreaterThan(300);
  expect(pri.every(p => p.src === 'diag' && p.a < p.b)).toBe(true);

  // Tháp: câu đầu của một phần chưa gặp có thẻ dạy; trả lời ngay sau thẻ ghi là có trợ giúp.
  await lobby(page);
  await play(page, 'qstart');
  await expect(page.locator('[data-teach]')).toBeVisible({ timeout: 15000 });
  const pk = await page.evaluate(() => (window as any).eval('EM').peek());
  if (pk.opts) await page.locator(`[data-e="qans"][data-i="${pk.ans}"]`).click();
  else { await page.locator('input[name="a"]').fill(pk.accept[0]); await page.locator('input[name="a"]').press('Enter'); }
  const last = await lastEv(page);
  expect(last.src).toBe('game');
  expect(last.asst).toBe(1);
  expect(errors).toEqual([]);
});

test('Bài Câu: phần ngữ pháp xếp lớp coi là chưa biết có thẻ dạy trước lượt đầu; chưa đọc thẻ thì chưa ra bài được', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await zero(page);
  await lobby(page);
  await play(page, 'cdstart');
  await expect(page.locator('#whfx.cdfx')).toBeVisible();
  const ok = page.locator('[data-e="cdteach"]').filter({ visible: true });
  await expect(ok).toBeVisible({ timeout: 15000 });
  await expect(page.locator('#whfx [data-teach]')).toContainText('Thẻ mới');
  await page.screenshot({ path: 'test-results/zero-cards-teach.png' });
  await expect(page.locator('[data-e="cdskip"]').filter({ visible: true })).toHaveCount(0);   // chưa đọc thẻ thì chưa có nút ra bài
  const n0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await ok.click();
  await expect(ok).toHaveCount(0);
  await page.locator('[data-e="cdskip"]').filter({ visible: true }).click();
  await expect.poll(() => page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(n0 + 1);
  const last = await lastEv(page);
  expect(last.ctx).toBe('cards');
  expect(last.asst).toBe(1);
  expect(errors).toEqual([]);
});
