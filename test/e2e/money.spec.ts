import { test, expect, openApp, navTo, noHorizontalScroll } from './fixtures.ts';

// M7 (spec §11): năng lượng theo lượt, Super và quảng cáo giả lập, số liệu trên máy. Bản thử không thu tiền.
test('năng lượng: mỗi bài luyện tốn 1 lượt; hết thì chặn bài mới, mở được ôn đến hạn; Super bỏ giới hạn và ô quảng cáo', async ({ page, errors }) => {
  await openApp(page);
  await expect(page.locator('#clock')).toContainText('⚡ 5/5');
  // luyện unit đầu (bài tốn năng lượng): còn 4
  // @ts-expect-error hàm toàn cục của app.js
  await page.evaluate(() => { const u = UNITS[0]; U(u.id).learned = true; save(); startSession('practice', practiceItems(u.words), u.id); });
  await expect(page.locator('#clock')).toContainText('⚡ 4/5');
  // hết năng lượng: bài luyện bị chặn, có lối ôn miễn phí và Super giả lập
  // @ts-expect-error hàm toàn cục của app.js
  await page.evaluate(() => { const m = money(); m.e = 0; m.t = Date.now(); save(); const u = UNITS[0]; startSession('practice', practiceItems(u.words), u.id); });
  await expect(page.getByRole('heading', { name: 'Hết năng lượng' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ôn tập đến hạn (miễn phí)' })).toBeVisible();
  // ôn đến hạn không tốn năng lượng
  // @ts-expect-error hàm toàn cục của app.js
  expect(await page.evaluate(() => EN_COST.has('review'))).toBe(false);
  await page.getByRole('button', { name: 'Bật Super (giả lập)' }).click();
  await expect(page.locator('#clock')).toContainText('Super');
  const m = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').money);
  expect(m).toMatchObject({ s: true, out: 1, used: 1 });
  // Cài đặt: bảng năng lượng có số liệu và công tắc
  await page.evaluate(() => (window as unknown as { go: (v: string) => void }).go('settings'));
  await page.getByText('Năng lượng và gói Super (giả lập)').click();
  await expect(page.getByText(/hết năng lượng 1 lần/)).toBeVisible();
  await page.getByRole('button', { name: 'Đang bật · Tắt' }).click();
  await expect(page.locator('#clock')).toContainText('⚡ 0/5');
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('quảng cáo giả lập: hiện ở màn kết quả bài luyện bản miễn phí, không hiện khi bật Super', async ({ page, errors }) => {
  await openApp(page);
  const run = async (): Promise<void> => {
    // @ts-expect-error hàm toàn cục của app.js
    await page.evaluate(() => { const u = UNITS[0]; ui.summary = { kind: 'practice', uid: u.id, res: [{ correct: true, wid: u.words[0].id }], before: {}, bst: {} }; go('summary'); });
  };
  await run();
  await expect(page.getByLabel('Quảng cáo giả lập')).toBeVisible();
  // @ts-expect-error hàm toàn cục của app.js
  await page.evaluate(() => { money().s = true; save(); });
  await run();
  await expect(page.getByLabel('Quảng cáo giả lập')).toHaveCount(0);
  expect(errors).toEqual([]);
});
