import { test, expect, openApp, noHorizontalScroll, navTo } from './fixtures.ts';

test('tab Ôn thi: chọn kỳ thi, xem cách tính điểm có nguồn', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(page.getByRole('heading', { name: 'Ôn IELTS Academic' })).toBeVisible();
  await page.getByRole('button', { name: /Cách tính điểm và nguồn/ }).click();
  await expect(page.getByRole('heading', { name: 'Cách tính điểm và nguồn' })).toBeVisible();
  // bảng có dòng chính thức và dòng ước tính, có đường dẫn nguồn
  await expect(page.getByText('Ước tính của app').first()).toBeVisible();
  await expect(page.locator('a[href*="ielts"]').first()).toBeVisible();
  await noHorizontalScroll(page);
  // lựa chọn được lưu: mở lại vẫn nhớ kỳ thi
  await page.reload();
  // Chờ app khởi động xong và bấm lại nếu cú bấm rơi vào lúc màn đang vẽ lại (WebKit).
  await page.waitForFunction(() => (window as unknown as { ELREADY?: boolean }).ELREADY === true);
  const examHead = page.getByRole('heading', { name: 'Ôn IELTS Academic' });
  await expect(async () => {
    if (!(await examHead.isVisible())) await navTo(page, 'Ôn thi');
    await expect(examHead).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20000 });
  // nút Quay lại của trình duyệt về đúng màn trước
  await page.getByRole('button', { name: /Cách tính điểm và nguồn/ }).click();
  await page.goBack();
  await expect(page.getByRole('heading', { name: 'Ôn IELTS Academic' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('VSTEP: đề thi thử đầy đủ và bài thi nhanh có sẵn trong tab Ôn thi, không bị khoá', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /^Đề thi thử đầy đủ/ }).click();
  await expect(page.getByRole('heading', { name: 'Đề thi thử đầy đủ' })).toBeVisible();
  await expect(page.getByText('VSTEP – Đề 1')).toBeVisible();
  await page.getByRole('button', { name: 'Về trang Ôn thi' }).click();
  await page.getByRole('button', { name: /Thi nhanh Nghe \+ Đọc/ }).click();
  await expect(page.getByRole('heading', { name: /Thi thử VSTEP/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('ôn thi không tốn năng lượng: hết năng lượng vẫn mở đề thi thử đầy đủ (spec §11)', async ({ page, errors }) => {
  await openApp(page);
  // @ts-expect-error biến toàn cục của app.js
  await page.evaluate(() => { const m = money(); m.e = 0; m.t = Date.now(); save(); render(); });
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /VSTEP/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /Đề thi thử đầy đủ/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Hết năng lượng' })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Đề thi thử/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
