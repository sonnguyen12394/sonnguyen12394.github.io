import { test, expect, openApp, noHorizontalScroll, navTo } from './fixtures.ts';

// M6: thi thử Viết/Nói IELTS từ tab Ôn thi; biểu đồ Task 1 có tên cho trình đọc màn hình; bài mẫu band có chú thích;
// tự chấm 4 tiêu chí → band ước tính; lưu thành bằng chứng cho nút bài thi IELTS của engine.
const essay = (n: number): string => Array.from({ length: n }, (_, i) => (i % 12 === 11 ? 'However, people disagree because the results are different.\n\n' : 'The number of visitors increased steadily while costs fell slightly.')).join(' ');

test('Viết IELTS Academic: biểu đồ, nộp hai Task, bài mẫu band, tự chấm, lưu', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /Thi thử Viết IELTS/ }).click();
  await expect(page.getByRole('heading', { name: 'Thi thử Viết IELTS' })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu Task 1' }).click();
  await expect(page.getByRole('img').filter({ has: page.locator('svg') }).first()).toBeVisible();
  await noHorizontalScroll(page);
  await page.getByLabel('Bài viết').fill(essay(20));
  await page.getByRole('button', { name: 'Nộp Task 1, sang Task 2' }).click();
  await page.getByLabel('Bài viết').fill(essay(40));
  await page.getByRole('button', { name: 'Nộp bài' }).click();
  await expect(page.getByText(/^Bài mẫu band 5,0 · 6,5 · 7,5/).first()).toBeVisible();
  await page.getByText(/^Bài mẫu band/).first().click();
  await expect(page.getByRole('heading', { name: 'Band 7,5' }).first()).toBeVisible();
  for (const btn of await page.locator('[data-act="vxself"][data-v="6"]').all()) await btn.click();
  await expect(page.getByRole('heading', { name: 'Viết ≈ band 6' })).toBeVisible();
  await page.getByRole('button', { name: 'Lưu kết quả' }).click();
  const s = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}'));
  expect(s.me.vx[0]).toMatchObject({ m: 'w', ex: 'ielts-ac', b: 6 });
  expect(s.e.m['xw:ielts-t2']?.['4']).toBeTruthy();
  expect(errors).toEqual([]);
});

test('Nói IELTS: 3 phần, thẻ đề Part 2, bài mẫu, tự chấm cả bài', async ({ page, errors }) => {
  await openApp(page);
  await page.evaluate(() => (window as unknown as { startVx: (m: string, ex: string) => void }).startVx('s', 'ielts-gt'));
  await expect(page.getByRole('heading', { name: 'Thi thử Nói IELTS' })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu Part 1' }).click();
  await page.getByRole('button', { name: 'Sang Part 2' }).click();
  await expect(page.getByText('You should say:')).toBeVisible();
  await page.getByRole('button', { name: 'Sang Part 3' }).click();
  await page.getByRole('button', { name: 'Xong, xem kết quả' }).click();
  await expect(page.getByText(/^Bài mẫu band/).first()).toBeVisible();
  for (const btn of await page.locator('[data-act="vxself"][data-v="5"]').all()) await btn.click();
  await expect(page.getByRole('heading', { name: 'Nói ≈ band 5' })).toBeVisible();
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});
