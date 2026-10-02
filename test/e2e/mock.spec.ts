import { readFileSync } from 'node:fs';
import { test, expect, openApp, navTo, noHorizontalScroll, type Page } from './fixtures.ts';

// Đề thi thử đầy đủ (yêu cầu 6.3): làm bài có giờ, bị gián đoạn vẫn làm tiếp, nộp bài ra điểm + phân tích dạng câu + giải thích.
const SILENCE = readFileSync(new URL('./silence.mp3', import.meta.url));

async function openMock(page: Page): Promise<void> {
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: /IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Để sau' }).click();
  await page.getByRole('button', { name: /^Đề thi thử đầy đủ/ }).click();
  await expect(page.getByRole('heading', { name: 'Đề thi thử đầy đủ' })).toBeVisible();
  await page.getByRole('button', { name: 'Vào đề' }).first().click();
  await expect(page.getByRole('heading', { name: 'IELTS Academic – Đề 1' })).toBeVisible();
}

test('Đọc: trả lời, tải lại trang vẫn làm tiếp đúng chỗ, nộp bài ra band và dạng câu hay sai', async ({ page, errors }) => {
  await openMock(page);
  await page.getByRole('button', { name: 'Chỉ Đọc' }).click();
  await expect(page.getByRole('heading', { name: 'The orchards that switched off their lights' })).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
  await page.locator('input[name="m-a1-r1-01"][value="FALSE"]').check();
  await page.locator('input[name="m-a1-r1-08"]').fill('flowers');
  await noHorizontalScroll(page);
  // Android hay đóng tab chạy nền: mở lại app phải làm tiếp được, câu trả lời còn nguyên
  await page.waitForTimeout(800);
  await page.reload();
  await openApp(page);
  await navTo(page, 'Ôn thi');
  await page.getByRole('button', { name: 'Làm tiếp' }).click();
  await expect(page.locator('input[name="m-a1-r1-08"]')).toHaveValue('flowers');
  await expect(page.locator('input[name="m-a1-r1-01"][value="FALSE"]')).toBeChecked();
  // sang bài 2 bằng thẻ phần, rồi nộp (lần đầu app nhắc còn câu chưa trả lời)
  await page.getByRole('tab', { name: 'Phần 2' }).click();
  await expect(page.getByRole('heading', { name: 'Taking boredom seriously' })).toBeVisible();
  await page.getByRole('button', { name: 'Nộp bài Đọc' }).click();
  await page.getByRole('button', { name: 'Nộp bài Đọc' }).click();
  await expect(page.getByRole('heading', { name: /^Đọc: band/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dạng câu bạn hay sai' })).toBeVisible();
  await expect(page.getByText('2/40 câu đúng')).toBeVisible();
  // giải thích từng câu: vì sao đúng và câu chứa đáp án
  await expect(page.getByText('Câu chứa đáp án:').first()).toBeVisible();
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('Nghe: tải trước âm thanh, phát liền các phần, hết giờ soát lại thì tự nộp', async ({ page, errors }) => {
  await page.route(/\/a\/m-a1-l\d\.mp3$/, r => r.fulfill({ status: 200, contentType: 'audio/mpeg', body: SILENCE }));
  await openMock(page);
  await page.getByRole('button', { name: 'Chỉ Nghe' }).click();
  await page.getByRole('button', { name: /Bắt đầu nghe/ }).click();
  // Mỗi phần là 1 giây im lặng: phát hết 4 phần thì sang soát lại có đồng hồ
  const retry = page.getByRole('button', { name: 'Thử phát lại' }), check = page.getByText(/Đã nghe xong/);
  for (let i = 0; i < 30 && !(await check.isVisible()); i++) {
    if (await retry.isVisible()) await retry.click();   // trình duyệt chặn tự phát: người học bấm lại, như trên máy thật
    await page.waitForTimeout(500);
  }
  await expect(check).toBeVisible();
  await expect(page.getByRole('timer')).toBeVisible();
  // Tua đồng hồ của trang qua 2 phút soát lại: app tự nộp
  await page.clock.install();
  await page.clock.runFor(125_000);
  await expect(page.getByRole('heading', { name: /^Nghe: band/ })).toBeVisible();
  await expect(page.getByText('Lời thoại và bản dịch (hiện sau khi làm xong):').first()).toBeVisible();
  expect(errors).toEqual([]);
});
