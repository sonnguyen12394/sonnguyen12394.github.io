import { test, expect, openApp, noHorizontalScroll } from './fixtures.ts';

// M7 (spec §11) năng lượng / Super / quảng cáo giả lập. v175 (người sáng lập 20/10/2026, sau buổi học thử: "tự chỉnh sửa lại hết"):
// bỏ năng lượng ở mọi lượt học (chặn học ngay ngày đầu, trái luật "không ưu đãi ép giờ"). Không còn ô quảng cáo Super.
test('v175 không còn năng lượng: luyện nhiều lượt liền không bị chặn, thanh đầu không hiện ⚡, màn kết quả không có quảng cáo', async ({ page, errors }) => {
  await openApp(page);
  // @ts-expect-error hàm toàn cục của app.js
  await page.evaluate(() => { const u = UNITS[0]; U(u.id).learned = true; const m = money(); m.e = 0; m.t = Date.now(); save(); for (let i = 0; i < 6; i++) startSession('practice', practiceItems(u.words), u.id); });
  await expect(page.getByRole('heading', { name: 'Hết năng lượng' })).toHaveCount(0);
  await expect(page.locator('#clock')).not.toContainText('⚡');
  // @ts-expect-error hàm toàn cục của app.js
  await page.evaluate(() => { const u = UNITS[0]; ui.summary = { kind: 'practice', uid: u.id, res: [{ correct: true, wid: u.words[0].id }], before: {}, bst: {} }; go('summary'); });
  await expect(page.getByLabel('Quảng cáo giả lập')).toHaveCount(0);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});
