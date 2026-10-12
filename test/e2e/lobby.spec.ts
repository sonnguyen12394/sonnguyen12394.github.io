import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v131 sảnh kiểu game (GAME-CRITERIA §18.4): Tí là nhân vật trên bản đồ (P1), thanh tài nguyên (P2), chấm đỏ ≤ 3 (P3), khung game ở màn
// ngoài trận (P4), màn Nhân vật của Túi chữ (P5), luật gom vào "❓" (P6), phòng chờ trước ván (P7), Sổ nhiệm vụ (P8), thử đồ ở Tủ đồ (P10).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const axe = async (page: Page) => (await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze()).violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`);

async function lobby(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true; st.cos.acc = 'scarf'; st.cos.own = ['scarf'];
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page, false);
}

test('P1 P2 P3: Tí (mặc đồ đang đeo) là ghim "Bạn ở đây"; thanh tài nguyên chạm được; chấm đỏ không quá 3, chỉ ở chỗ có việc', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  const pin = page.locator('.wplace.pin');
  await expect(pin).toContainText('Bạn & Tí');
  await expect(pin.locator('svg.ti')).toHaveCount(1);
  const res = page.locator('.whud .wres');
  await expect(res).toContainText(/🪙 \d+/);
  await expect(res).toContainText(/🏮 \d\/3/);
  await expect(res).toContainText(/⭐ Lv \d+/);
  const n = await page.locator('.wmap .wdot').count();
  expect(n).toBeGreaterThan(0);                                    // người mới: truyện mở đầu sẵn sàng, câu đố hôm nay chưa giải
  expect(n).toBeLessThanOrEqual(3);
  await expect(page.locator('.wplace[data-p="story"] .wdot')).toHaveCount(1);
  await expect(page.locator('.wplace[data-p="story"]')).toHaveAttribute('aria-label', /có việc làm ngay/);
  await res.locator('[data-p="bag"]').click();
  await expect(page.locator('.wsheet')).toContainText('Xưởng của Tí');
  expect(await axe(page)).toEqual([]);
  expect(errors).toEqual([]);
});

test('P8 Sổ nhiệm vụ: 3 chặng hôm nay + truyện + mốc phố + sự kiện tuần; chặng mở đúng game', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await page.locator('[data-e="wmquests"]').click();
  const sheet = page.locator('.wsheet');
  await expect(sheet.getByRole('heading', { name: 'Sổ nhiệm vụ' })).toBeVisible();
  await expect(sheet.locator('.wqrow')).toHaveCount(5);              // 3 chặng + truyện + mốc phố gần nhất
  await expect(sheet).toContainText('Chặng 1');
  await expect(sheet).toContainText('Truyện');
  await expect(sheet.locator('.wkcard')).toHaveCount(1);
  expect(await axe(page)).toEqual([]);
  await page.locator('[data-e="wmclose"]').click();
  await expect(sheet).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('P7 phòng chờ: bảng công trình xem trước ván (thời lượng, mốc ★, xu) và một nút chơi lớn', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await page.locator('.wplace[data-p="wheel"]').evaluate((el: HTMLElement) => el.click());
  const room = page.locator('.wsheet .wroom');
  await expect(room).toContainText(/⏱ ~\d+ phút/);
  await expect(room).toContainText('tới ★ thứ 1');
  await expect(page.locator('.wsheet .wgo')).toHaveCount(1);
  await expect(page.locator('.wsheet .wgo')).toHaveAttribute('data-e', 'whstart');
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) test(`P4 P5 P6 P10 (${scheme}): Tôi có Tí; Tủ đồ thử đồ trên Tí; Túi chữ có màn Nhân vật; khung game; luật gom vào ❓; WCAG AA 390 px`, async ({ page, errors }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await page.evaluate(() => (window as any).eval("go('more')"));
  await expect(page.locator('#app')).toHaveClass(/\bgx\b/);
  await expect(page.locator('.mehero svg.ti')).toHaveCount(1);
  expect(await axe(page)).toEqual([]);
  await page.locator('.mehero [data-go="closet"]').click();
  await expect(page.locator('.goal.closet .cltry svg.ti')).toHaveCount(7);   // mỗi phụ kiện có Tí thử đồ, kể cả món chưa mở
  await expect(page.locator('.hero details.dwhy')).not.toHaveAttribute('open', '');
  expect(await axe(page)).toEqual([]);
  await page.evaluate(() => (window as any).eval("go('play')"));
  await page.locator('.wplace[data-p="bag"]').evaluate((el: HTMLElement) => el.click());
  await page.locator('.wsheet [data-e="bgopen"][data-t="me"]').click();
  const root = page.locator('.bgroot');
  await expect(root).toContainText('Thợ Chữ cấp');
  await expect(root.locator('.mslot')).toHaveCount(5);
  await expect(root.locator('.mstat')).toHaveCount(7);
  await expect(root.locator('.bggrp')).toHaveCount(3);
  expect(await axe(page)).toEqual([]);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});
