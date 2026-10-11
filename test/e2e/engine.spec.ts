import { readFileSync } from 'node:fs';
import { test, expect, openApp, navTo, noHorizontalScroll } from './fixtures.ts';

// M1: chọn mục tiêu, xem Target Model; dữ liệu engine khớp nội dung app.

test('chọn mục tiêu VSTEP B1, xem cần đạt gì, đặt hạn; tải lại vẫn còn', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await expect(page.getByRole('heading', { name: 'Mục tiêu của bạn', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: /^VSTEP/ }).click();
  await page.getByRole('button', { name: 'Chọn VSTEP Bậc 3 (B1)' }).click();
  await expect(page.getByRole('heading', { name: 'VSTEP Bậc 3 (B1)', level: 1 })).toBeVisible();
  await expect(page.getByText('kể cả tiền đề')).toBeVisible();
  for (const h of ['Nghe', 'Đọc', 'Viết', 'Nói', 'Dạng bài thi']) await expect(page.getByRole('heading', { name: new RegExp(`^${h}`), level: 2 })).toBeVisible();
  await page.getByLabel('Hạn muốn đạt (tuỳ chọn)').fill('2027-03-15');
  await page.getByRole('button', { name: 'Lưu' }).click();
  await noHorizontalScroll(page);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').e);
  expect(saved.goals).toHaveLength(1);
  expect(saved.goals[0]).toMatchObject({ id: 'vstep-b1', version: '1.0' });
  expect(saved.goals[0].date).toBe(Math.floor(Date.parse('2027-03-15T00:00:00Z') / 86400000));
  await page.reload();
  // Màn chính (v64) là tháp: chờ app và mô-đun engine vẽ xong rồi mới chuyển tab, bấm lại nếu cú bấm rơi vào lúc vẽ lại.
  await page.waitForFunction(() => (window as unknown as { ELREADY?: boolean }).ELREADY === true);
  const goalsBtn = page.getByRole('button', { name: /Mục tiêu của bạn/ });
  await expect(async () => { if (!(await goalsBtn.isVisible())) await navTo(page, 'Tôi'); await expect(goalsBtn).toBeVisible({ timeout: 3000 }); }).toPass({ timeout: 20000 });
  await goalsBtn.click();
  await expect(page.getByRole('heading', { name: 'VSTEP Bậc 3 (B1)', level: 3 })).toBeVisible();
  expect(errors).toEqual([]);
});

test('IELTS: chọn band; mục Viết/Nói thi dẫn tới đúng bài thi thử Viết/Nói IELTS (M6)', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await page.getByRole('button', { name: /^IELTS Academic/ }).click();
  await page.getByRole('button', { name: 'Chọn IELTS Academic 6.5' }).click();
  await expect(page.getByRole('heading', { name: 'IELTS Academic 6.5', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Học: IELTS Viết Task 2: bài luận' }).click();
  await expect(page.getByRole('heading', { name: 'Thi thử Viết IELTS' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('đồ thị engine khớp Can-Do, unit, điểm ngữ pháp của app (chạy lại tools/engine-dump.mjs + engine-gen.ts khi lệch)', async ({ page }) => {
  await openApp(page);
  const app = await page.evaluate(() => ({
    // @ts-expect-error biến toàn cục của app.js
    cd: CANDO.map(c => 'cd:' + c.id), u: UNITS.map(u => 'u:' + u.id), g: GPOINTS.map(p => 'g:' + p.id),
  }));
  const nodes = (JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Array<{ id: string }>).map(n => n.id);
  const have = new Set(nodes);
  const want = [...app.cd, ...app.u, ...app.g];
  expect(want.filter(id => !have.has(id))).toEqual([]);
  expect(nodes.filter(id => /^(cd|u|g):/.test(id)).length).toBe(want.length);
});

// M3: chẩn đoán dò đồ thị — trả lời "Không biết" liên tục thì kết thúc ở cấp thấp; kết quả có bảng giờ tới từng kỳ thi.
test('chẩn đoán: làm tới hết, có kết quả, tiên nghiệm được đặt cho nút chưa dò', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await page.getByRole('button', { name: 'Thử sức để xếp lớp' }).click();
  await expect(page.getByRole('heading', { name: 'Bạn đang ở đâu?', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Bắt đầu thử sức' }).click();
  // câu đầu là trắc nghiệm nhận ra nghĩa: chọn sai một lần bằng "Không biết", rồi tiếp tục tới khi xong
  for (let k = 0; k < 80; k++) {
    if (await page.getByRole('heading', { name: 'Bạn đang ở đâu', level: 1, exact: true }).isVisible()) break;
    await page.getByRole('button', { name: 'Không biết' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Bạn đang ở đâu', level: 1, exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Số giờ học ước tính tới từng kỳ thi' })).toBeVisible();
  await expect(page.getByText('VSTEP Bậc 3 (B1)')).toBeVisible();
  await noHorizontalScroll(page);
  const e = await page.evaluate(() => JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}').e);
  expect(e.diag.u).toBe(0);
  expect(e.diag.g).toBe(0);
  expect(e.diag.n).toBeGreaterThanOrEqual(5);
  // nút cấp cao chưa dò nhận tiên nghiệm "chưa biết"
  expect(e.m['u:c1-u1']?.['3']).toMatchObject({ a: 2, b: 4 });
  expect(errors).toEqual([]);
});

// M4: có mục tiêu thì trang Học dùng bước tiếp theo của lộ trình; lộ trình hôm nay; kiểm tra để bỏ qua.
test('lộ trình: trang Học hiện bước tiếp theo của engine, lộ trình hôm nay, kiểm tra để bỏ qua', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await page.getByRole('button', { name: /^VSTEP/ }).click();
  await page.getByRole('button', { name: 'Chọn VSTEP Bậc 3 (B1)' }).click();
  await expect(page.getByRole('heading', { name: 'VSTEP Bậc 3 (B1)', level: 1 })).toBeVisible();
  const next = page.getByText(/^Bước tiếp theo: /);   // bấm lại nếu cú bấm rơi vào lúc màn vẽ lại (WebKit)
  await expect(async () => { if (!(await next.isVisible())) await navTo(page, 'Học'); await expect(next).toBeVisible({ timeout: 3000 }); }).toPass({ timeout: 20000 });
  await expect(page.getByText(/Cần cho VSTEP Bậc 3 \(B1\)/)).toBeVisible();
  await page.getByRole('button', { name: 'Lộ trình hôm nay' }).click();
  await expect(page.getByRole('heading', { name: 'Hôm nay học gì', level: 1 })).toBeVisible();
  await noHorizontalScroll(page);
  // kiểm tra để bỏ qua một cụm từ vựng A1: trả lời "Không biết" thì chưa được bỏ qua
  await page.evaluate(() => (window as unknown as { go: (v: string, x: object) => void }).go('goal', { er: 'tout/u:a1-u1' }));
  for (let k = 0; k < 6 && !(await page.getByRole('heading', { name: 'Chưa đủ để bỏ qua' }).isVisible()); k++) {
    await page.getByRole('button', { name: 'Không biết' }).click();
  }
  await expect(page.getByRole('heading', { name: 'Chưa đủ để bỏ qua' })).toBeVisible();
  await page.getByRole('button', { name: 'Về lộ trình hôm nay' }).click();
  await expect(page.getByRole('heading', { name: 'Hôm nay học gì', level: 1 })).toBeVisible();
  // nút Học của bước đầu mở đúng màn học cũ (thư viện), không lỗi
  await page.getByRole('button', { name: 'Học', exact: true }).first().click();
  await expect(page.locator('#app')).not.toContainText('Có lỗi khi mở màn này');
  expect(errors).toEqual([]);
});

// M5: Sẵn sàng tách khỏi tiến độ học; thiếu kỹ năng thì nói rõ; đủ 4 kỹ năng thì ra xác suất, Viết/Nói tin cậy tối đa Vừa.
test('sẵn sàng: thiếu dữ liệu thì nói rõ; có Nghe/Đọc + thi thử Viết/Nói thì ra xác suất đạt', async ({ page, errors }) => {
  await openApp(page);
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
  await page.getByRole('button', { name: /^VSTEP/ }).click();
  await page.getByRole('button', { name: 'Chọn VSTEP Bậc 3 (B1)' }).click();
  await expect(page.getByRole('heading', { name: 'Sẵn sàng: chưa đủ dữ liệu' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Thi thử Viết', exact: true })).toBeVisible();
  await page.evaluate(() => {
    // @ts-expect-error hàm toàn cục của app.js
    const t: number = today();
    const s = JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}');
    s.x = s.x || {};
    s.x.resp = Array.from({ length: 30 }, (_, i) => ({ i: 'q' + i, c: i % 3 ? 1 : 0, d: t, s: i % 2 ? 'L' : 'R', b: 5, g: 0.25 }));
    s.me = { ...(s.me || {}), vx: [{ day: t, m: 'w', b: 6, r: 2.5 }, { day: t, m: 's', b: 6 }] };
    localStorage.setItem('vocab-ladder-v1', JSON.stringify(s));
  });
  await page.reload();
  await page.evaluate(() => (window as unknown as { go: (v: string, x: object) => void }).go('goal', { er: 'goal/vstep-b1' }));
  await expect(page.getByRole('heading', { name: /^Sẵn sàng: \d+% khả năng đạt$/ })).toBeVisible();
  // một lần thi thử: tin cậy thấp; Viết có hai người chấm (luật + tự chấm)
  await expect(page.getByRole('cell', { name: 'máy chấm luật + tự chấm · tin cậy thấp' })).toBeVisible();
  await expect(page.getByText(/độ tin cậy tối đa là Vừa/)).toBeVisible();
  await expect(page.getByText('tiến độ học: năng lực đã đạt')).toBeVisible();
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

// Lần tải trước (khi rảnh) của mô-đun engine hỏng thì không được để lỗi "dính": mở Mục tiêu vẫn tải lại được (lỗi WebKit CI ở v49).
// Service worker phục vụ tệp engine từ bộ nhớ đệm thì page.route không thấy (WebKit): chặn service worker cho test này.
test.describe(() => {
  test.use({ serviceWorkers: 'block' });
  test('tải trước mô-đun engine hỏng: mở Mục tiêu vẫn tải lại được', async ({ page }) => {
    let failed = 0;
    await page.route(/\/x\/engine\.[0-9a-f]+\.js$/, route => { if (!failed++) return route.abort(); return route.continue(); });
    await openApp(page);
    await expect.poll(() => failed).toBeGreaterThan(0);
    await navTo(page, 'Tôi');
    await page.getByRole('button', { name: /Mục tiêu của bạn/ }).click();
    await expect(page.getByRole('heading', { name: 'Mục tiêu của bạn', level: 1 })).toBeVisible();
  });
});
