import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v117 Nhóm L "Rõ ràng và dễ dùng" (docs/SCORECARD-v111.md, SPEC §7 "Luật màn đầu"): người mới mở app phải thấy ngay MỘT việc.
// Các test này giữ luật đó: tính năng mới không được thêm thẻ / nút chính lên màn đầu.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

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
  await toLobby(page, false);
}
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
// Từ nội bộ không được nằm ở màn đầu (chi tiết ở trang mục tiêu, cách một lần chạm).
const JARGON = /năng lực|cổng khu|bằng chứng|Can-Do|Pre-A1|kết luận|Target Model|readiness/i;

test('L1 L2 L3: màn đầu có đúng một nút chính trong khung đầu (Chơi tiếp), ít khối, không thuật ngữ nội bộ; WCAG AA', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  const prim = await page.evaluate(() => {
    const nav = document.getElementById('bnav')?.getBoundingClientRect().top ?? innerHeight;
    return [...document.querySelectorAll('#app .btn.primary, #app .dgo')].filter(el => {
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0 && r.top < nav && r.bottom > 0;
    }).map(el => (el as HTMLElement).innerText.trim().slice(0, 40));
  });
  expect(prim, 'đúng một nút chính trong khung nhìn đầu tiên').toHaveLength(1);
  expect(prim[0]).toMatch(/Chơi tiếp/);
  // Khối hiện ra (con trực tiếp của #app có kích thước), không tính tiêu đề và mục thu gọn.
  const blocks = await page.evaluate(() => [...document.querySelectorAll('#app > *')].filter(el => {
    const r = el.getBoundingClientRect();
    return r.height > 0 && !el.matches('section:has(> h1), details');
  }).length);
  expect(blocks, 'tối đa 3 khối: Chơi tiếp, mục tiêu, kho báu').toBeLessThanOrEqual(3);
  // v130: màn đầu là bản đồ (không mở sẵn bảng công trình hay danh sách).
  await expect(page.locator('#app .wmap')).toBeVisible();
  await expect(page.locator('#app .wsheet, #app .wlist')).toHaveCount(0);
  expect(await page.locator('#app').innerText()).not.toMatch(JARGON);
  // Thẻ mục tiêu gọn: một con số chính, chạm mở bản đầy đủ ở trang mục tiêu.
  await expect(page.locator('.gbar.slim')).toContainText(/🎯 A1 · \d+\/\d+ kỹ năng đã vững/);
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  expect(h, 'màn đầu gần vừa một màn hình (trước v117 ~4.300 px)').toBeLessThanOrEqual(1300);
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await page.screenshot({ path: 'test-results/clarity-lobby.png' });
  await page.locator('.gbar.slim').click();
  await expect(page.locator('#app')).toContainText('Gần đạt nhất');
  await expect(page.locator('#app')).toContainText(/Cổng khu A1|chưa phải kết luận/);
  expect(errors).toEqual([]);
});

test('L7: từ màn đầu, một chạm vào "Chơi tiếp" là vào game có câu hỏi', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await page.locator('.dgo').first().click();
  await page.waitForFunction(() => { try { return !!(window as any).eval('EM').peek(); } catch { return false; } }, null, { timeout: 15000 });
  expect(errors).toEqual([]);
});

test('L6: 4 tab không trùng nghĩa; Thư viện → Bản đồ Phố Chữ; danh sách bản đồ, bấm Hôm nay về bản đồ', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await expect(page.locator('#bnav button')).toHaveText(['Hôm nay', 'Ôn tập', 'Thư viện', 'Tôi'].map(t => new RegExp(`^${t}`)));
  await page.locator('#bnav button', { hasText: 'Thư viện' }).click();
  await expect(page.getByRole('heading', { name: 'Tự chọn bài', level: 1 })).toBeVisible();
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => v.id)).toEqual([]);
  // v130: mọi trò chơi (cả Đấu trường thay mục Thử thách) nằm trên Bản đồ Phố Chữ; Thư viện chỉ còn một lối tới đó.
  for (const t of [/Bản đồ Phố Chữ/, /Bài học theo chủ đề/, /Kỹ năng/, /Sổ từ/]) await expect(page.getByRole('button', { name: t })).toBeVisible();
  await expect(page.getByRole('button', { name: /Tất cả trò chơi|Thử thách/ })).toHaveCount(0);
  await page.getByRole('button', { name: /Bản đồ Phố Chữ/ }).click();
  await expect(page.locator('#app .wmap')).toBeVisible();
  await expect(page.locator('#bnav button[aria-current="page"]')).toContainText('Hôm nay');
  await page.locator('[data-e="wmlist"]').click();
  await expect(page.locator('#app .wlist')).toBeVisible();
  await page.locator('#bnav button', { hasText: 'Hôm nay' }).click();
  await expect(page.locator('#app .wmap')).toBeVisible();
  await expect(page.locator('#app .wlist')).toHaveCount(0);
  // Màn học cũ (unit) thuộc tab Thư viện.
  await page.locator('#bnav button', { hasText: 'Thư viện' }).click();
  await page.getByRole('button', { name: /Bài học theo chủ đề/ }).click();
  await expect(page.locator('#bnav button[aria-current="page"]')).toContainText('Thư viện');
  expect(errors).toEqual([]);
});

test('L4 L8: thanh đầu trang một dòng ở 360 px, số có chữ đi kèm, năng lượng ẩn khi đầy; không cuộn ngang', async ({ page, errors }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await lobby(page);
  const clock = page.locator('#clock');
  await expect(clock).toHaveText(/\d+ ngày · hôm nay \d+\/\d+ câu$/);
  await expect(clock).not.toContainText('⚡');
  const lines = await clock.evaluate(el => Math.round(el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight || '16')));
  expect(lines).toBeLessThanOrEqual(1);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

// v118: màn Hôm nay là cảnh truyện của khu đang ở (nền khu, Tí kể việc của cư dân, 3 đèn lồng), vẫn đúng một nút chính; WCAG AA cả tối.
for (const dark of [false, true]) test(`v118 cảnh Phố Chữ (${dark ? 'tối' : 'sáng'}): khu + chương, Tí kể việc cư dân, đèn lồng; vẫn một nút chính; WCAG AA`, async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  if (dark) await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    st.e.sy = { ch: 1, prog: { dig: 0, light: 0, voice: 0 } };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page, false);
  const scene = page.locator('.lscene');
  await expect(scene).toContainText('📍 Khu Chợ Sáng · Chương 1: Hoa không tên');
  await expect(scene.locator('.tisay-b')).toContainText('Bà Lan');
  await expect(scene.locator('.lanterns li')).toHaveCount(3);
  await expect(scene).toContainText(/Thắp 0\/3 đèn hôm nay/);
  // v130: sương phủ các khu truyện chưa tới (Bến Cảng, Rừng Trúc, Phố Đêm); khu đang ở có ghim.
  await expect(page.locator('.wzone.fog')).toHaveCount(3);
  await expect(page.locator('.wzone.here')).toContainText('Khu Chợ Sáng');
  await expect(page.locator('.wplace.pin')).toContainText('Bạn ở đây');
  const prim = await page.locator('#app .btn.primary:visible, #app .dgo:visible').count();
  expect(prim).toBe(1);
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
  await page.screenshot({ path: `test-results/clarity-scene-${dark ? 'dark' : 'light'}.png` });
  expect(errors).toEqual([]);
});
