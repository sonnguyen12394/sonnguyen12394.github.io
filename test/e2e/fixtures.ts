import { test as base, expect, type Page } from '@playwright/test';
/* eslint-disable @typescript-eslint/no-explicit-any */

// Mỗi test: chặn font Google (không phụ thuộc mạng ngoài), gom lỗi JavaScript của trang để kiểm "không im lặng hỏng".
// future (mặc định bật cho các test cũ): localStorage 'el-future' = '1' trước khi trang nạp, để tab Ôn thi và mục tiêu
// IELTS/VSTEP/giao tiếp hiện như trước v52. Test của bản MVP chỉ CEFR dùng test.use({ future: false }).
export const test = base.extend<{ errors: string[]; future: boolean; futureInit: void }>({
  future: [true, { option: true }],
  futureInit: [async ({ page, future }, use) => {
    if (future) await page.addInitScript(() => { try { localStorage.setItem('el-future', '1'); } catch { /* bỏ qua */ } });
    await use();
  }, { auto: true }],
  errors: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(String(e)));
    page.on('console', m => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)|ERR_FAILED|net::/.test(m.text())) errors.push(m.text()); });
    await page.route(/fonts\.(googleapis|gstatic)\.com/, r => r.abort());
    // Không gọi máy chủ thật trong test: mọi hàm Supabase trả về danh sách rỗng.
    await page.route(/supabase\.co/, r => r.fulfill({ status: 200, contentType: 'application/json', body: '[]' }));
    await use(errors);
  },
});

// Khi test hỏng: in màn hình đang hiện (route ôn thi, tiêu đề, chữ đầu trang) ra log CI để chẩn đoán được
// cả khi không tải được báo cáo (lỗi chỉ xảy ra lúc chạy song song, khó tái hiện tại máy).
test.afterEach(async ({ page }, info) => {
  if (info.status === info.expectedStatus) return;
  const snap = await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('vocab-ladder-v1') || '{}');
    const main = (document.querySelector('#app main, main, #app') as HTMLElement | null)?.innerText ?? '';
    return { url: location.href, exam: s.x?.exam, attempts: s.x?.attempts?.length, modal: !document.querySelector('#modal')?.hasAttribute('hidden'), text: main.replace(/\s+/g, ' ').slice(0, 400) };
  }).catch(e => ({ error: String(e) }));
  console.log(`[chẩn đoán] ${info.project.name} › ${info.title}: ${JSON.stringify(snap)}`);
});
export { expect };

// Mở app. Người mới gặp màn chào: bấm "Bắt đầu ôn thi" (vào thẳng tab Ôn thi). Trả về khi thanh điều hướng đã hiện.
export async function openApp(page: Page, path = '/'): Promise<void> {
  await page.goto(path);
  const start = page.getByRole('button', { name: 'Bắt đầu ôn thi' });
  const nav = page.locator('#bnav button:visible, #nav button:visible').first();
  await expect(start.or(nav).first()).toBeVisible();
  if (await start.isVisible()) await start.click();
  await expect(nav).toBeVisible();
  await closeModal(page);
}

// Hộp thoại "Có gì mới" hiện khi người học cũ mở bản mới: đóng để thao tác tiếp.
export async function closeModal(page: Page): Promise<void> {
  const m = page.locator('#modal:not([hidden])');
  if (await m.count()) {
    const b = m.getByRole('button', { name: /Đã hiểu|Đóng|Để sau/ }).first();
    if (await b.count()) await b.click(); else await page.keyboard.press('Escape');
    await expect(m).toHaveCount(0);
  }
}

export async function noHorizontalScroll(page: Page): Promise<void> {
  const over = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(over, 'trang không được cuộn ngang').toBeLessThanOrEqual(1);
}

export const navTo = (page: Page, label: string) =>
  page.locator('#bnav:visible button, #nav:visible button').filter({ hasText: label }).first().click();

// v88: sảnh mở đầu bằng nút "Chơi tiếp" do bộ não chọn; thẻ từng game nằm trong mục thu gọn "Tất cả trò chơi". Test mở mục đó rồi bấm game.
export async function play(page: Page, start: string): Promise<void> {
  await page.evaluate(() => document.querySelectorAll('details.gall').forEach(d => { (d as HTMLDetailsElement).open = true; }));
  await page.locator(`[data-e="${start}"]`).filter({ visible: true }).first().click();
}

// v99: Leo tháp (game cũ) nằm trong mục thu gọn ở sảnh: mở mọi mục thu gọn trước khi tìm.
export async function openAll(page: Page): Promise<void> {
  await page.evaluate(() => document.querySelectorAll('details.gall').forEach(d => { (d as HTMLDetailsElement).open = true; }));
}

// Sảnh game từ màn "games": nạp engine trước (không đo thời gian tải ở đây), bấm "▶ Chơi", chờ sảnh. Hụt thì báo màn đang hiện
// (view, chữ trong #app) để biết gốc rễ: CI Safari iOS thỉnh thoảng không thấy sảnh sau 15 s.
export async function toLobby(page: Page): Promise<void> {
  await page.evaluate(() => (window as any).eval('emLoad()'));
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  const head = page.getByRole('heading', { name: /Hôm nay chơi gì/ });
  try { await expect(head).toBeVisible({ timeout: 15000 }); }
  catch (e) {
    const s = await page.evaluate(() => { const w = window as any; return { view: w.eval('ui.view'), er: w.eval('ui.er'), em: !!w.eval('EM'), app: (document.getElementById('app')?.innerText ?? '').slice(0, 300), stage: document.body.className }; });
    throw new Error(`sảnh không hiện: ${JSON.stringify(s)}\n${(e as Error).message}`);
  }
}
