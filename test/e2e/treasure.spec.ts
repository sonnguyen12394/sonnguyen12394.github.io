import { test, expect, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v111 Kho báu ẩn (SPEC "Game hoá mọi chức năng"): bộ đo hiệu quả 12 câu giữ riêng hiện ở sảnh như một kho báu; mở rương không hiện
// đúng / sai; xu theo số rương đã mở; kết quả ghi như lần đo (ctx measure, snapshot measure:pre). Không có chữ thi / kiểm tra.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const BANNED = /(?<![\p{L}])(thi|kiểm tra|bài dò|chẩn đoán|làm bài)(?![\p{L}])/iu;
// Chỉ quét khung màn hình (nhãn, tiêu đề, nút, lời dẫn), không quét nội dung câu học (nghĩa tiếng Việt của từ "test" là "bài kiểm tra").
const chrome = (page: Page) => page.locator('#app .eyebrow, #app h1, #app h3, #app button, #app .muted, #app .hint').allInnerTexts().then(x => x.join('\n'));

async function lobby(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page);
}

test('Kho báu ẩn: thẻ ở sảnh → mở 12 rương không hiện đúng / sai → xu theo số rương → ghi lần đo đầu', async ({ page, errors }) => {
  test.setTimeout(90_000);
  await lobby(page);
  await expect(page.locator('.tcard')).toContainText('Kho báu ẩn');
  const coins0 = await page.evaluate(() => (window as any).eval('st').e.q?.coins ?? 0);
  await page.getByRole('button', { name: /Mở kho báu/ }).click();
  await page.getByRole('button', { name: /Mở rương đầu tiên/ }).click();
  const done = page.getByRole('heading', { name: /Đã mở hết \d+ rương/ });
  for (let i = 0; i < 20 && !(await done.isVisible()); i++) {
    await expect(page.locator('.eyebrow').first()).toContainText('Kho báu ẩn · rương');
    expect(await chrome(page)).not.toMatch(BANNED);
    await expect(page.locator('.fb')).toHaveCount(0);
    await page.getByRole('button', { name: 'Không biết' }).first().click();
  }
  await expect(done).toBeVisible();
  const r = await page.evaluate(() => { const e = (window as any).eval('st').e; return { n: e.ms.set.length, pre: e.ms.checks[0]?.phase, snap: e.ev.snap.some((s: any) => s.dec === 'measure:pre'), coins: e.q?.coins ?? 0 }; });
  expect(r.pre).toBe('pre'); expect(r.snap).toBe(true);
  expect(r.coins - coins0).toBe(3 * r.n);
  await page.getByRole('button', { name: 'Về sảnh chơi' }).click();
  await expect(page.locator('.tcard')).toHaveCount(0);   // lần đo sau chưa tới hạn
  expect(errors).toEqual([]);
});
