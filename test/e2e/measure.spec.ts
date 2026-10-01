import { test, expect, openApp } from './fixtures.ts';

async function toIelts(page: import('@playwright/test').Page) {
  await openApp(page);
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await expect(page.getByRole('heading', { name: 'Ôn IELTS Academic' })).toBeVisible();
}

test('band ước tính: chưa đủ dữ liệu thì nói rõ, không bịa số', async ({ page, errors }) => {
  await toIelts(page);
  await expect(page.getByRole('heading', { name: 'Band IELTS ước tính' })).toBeVisible();
  await expect(page.getByText(/Chưa đủ dữ liệu/).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('cài đặt ôn thi lưu mục tiêu, ngày thi, phút mỗi ngày', async ({ page, errors }) => {
  await toIelts(page);
  await page.getByRole('button', { name: 'Đổi mục tiêu, ngày thi, thời gian' }).click();
  await page.getByLabel('Mục tiêu').selectOption('6.5');
  const d = new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10);
  await page.getByLabel('Ngày thi').fill(d);
  await page.getByLabel('Số phút học mỗi ngày').fill('45');
  await page.getByRole('button', { name: 'Lưu', exact: true }).click();
  await expect(page.getByText(/mục tiêu band 6,5/)).toBeVisible();
  await expect(page.getByText(/còn (59|60) ngày/)).toBeVisible();
  await expect(page.getByText(/45 phút\/ngày/)).toBeVisible();
  expect(errors).toEqual([]);
});

test('đồng ý chia sẻ: dưới 16 tuổi cần cha mẹ đồng ý; tắt được', async ({ page, errors }) => {
  await toIelts(page);
  await page.getByRole('button', { name: /Cài đặt ôn thi/ }).click();
  await page.getByLabel('Dưới 16 tuổi', { exact: true }).check();
  await page.getByRole('button', { name: 'Đồng ý chia sẻ' }).click();
  await expect(page.locator('#toast')).toContainText('cha mẹ');
  await expect(page.getByText('Đang tắt.')).toBeVisible();
  await page.getByLabel(/Cha mẹ hoặc người giám hộ đã đọc/).check();
  await page.getByRole('button', { name: 'Đồng ý chia sẻ' }).click();
  await expect(page.getByText(/Đang bật/)).toBeVisible();
  await page.getByRole('button', { name: 'Tắt chia sẻ' }).click();
  await expect(page.getByText('Đang tắt.')).toBeVisible();
  expect(errors).toEqual([]);
});

test('ghi điểm thật và xem trang độ chính xác', async ({ page, errors }) => {
  await toIelts(page);
  await page.getByRole('button', { name: /Ghi điểm thi thật/ }).click();
  await page.getByLabel('Đọc').fill('6.5');
  await page.getByRole('button', { name: 'Lưu điểm thật' }).click();
  await expect(page.locator('#toast')).toContainText('Đã lưu');
  await page.getByRole('button', { name: /Ghi điểm thi thật/ }).click();
  await expect(page.getByRole('cell', { name: '6,5' })).toBeVisible();
  await page.getByRole('button', { name: 'Về trang Ôn thi' }).click();
  await page.getByRole('button', { name: /Độ chính xác của ước tính/ }).click();
  await expect(page.getByText('Chưa đủ cặp để công bố').first()).toBeVisible();
  expect(errors).toEqual([]);
});
