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
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: 'Ôn IELTS Academic' })).toBeVisible();
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

test('miễn phí 100%: không tim, không quảng cáo, không gói trả phí', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  const body = await page.locator('#app').innerText();
  expect(body).not.toMatch(/Super|quảng cáo|❤️/i);
  await expect(page.getByRole('button', { name: /Thử thách/ })).toBeVisible();
  expect(errors).toEqual([]);
});
