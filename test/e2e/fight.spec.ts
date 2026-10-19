import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';
/* eslint-disable @typescript-eslint/no-explicit-any */

// v133 Chiến Binh Chữ mốc 1 (docs/MOC1-KE-HOACH.md), v134 trận kiểu Chaos Orbit: sảnh có ⚔️ là nút chính; vào trận, chạy né, thắng / thua; thua vì thiếu bậc thì
// màn kết chỉ thẳng Vũ khí và mở đúng lò; rèn; góp ý nhanh. Trận không ghi bằng chứng (sổ bằng chứng không đổi).
test.use({ future: false });

async function lobby(page: Page, cb?: Record<string, unknown>, coins = 0): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(([cb, coins]) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    if (cb) st.e.cb = cb;
    if (coins) st.e.q = { ...(st.e.q ?? {}), coins };
    w.eval('save()'); w.eval("go('games')");
  }, [cb, coins] as const);
  await toLobby(page, false);
}
const led = (page: Page) => page.evaluate(() => (window as any).eval('st').e.ev.led.length as number);
const cbs = (page: Page) => page.evaluate(() => (window as any).eval('st').e.cb ?? null);
async function ready(page: Page): Promise<boolean> {
  await page.waitForFunction(() => { const r = document.getElementById('whfx') as any; return !r || r._ready?.() || !(document.querySelector('.cbend') as HTMLElement)?.hidden; }, null, { timeout: 30000 });
  return page.locator('.cbend').isHidden();
}

test('sảnh: ⚔️ là nút chính duy nhất; vào trận luyện tay, chạy né tới thắng; sổ bằng chứng không đổi', async ({ page, errors }) => {
  // Hạt trận cố định: với hạt theo giờ, bot né giỏi thua Luyện tay 1 khoảng 5–6% số lần (mô phỏng 160 trận), làm CI lúc đỏ lúc xanh.
  // Hạt 20 thắng ở mọi độ trễ bật bot đã thử (0 / 1 / 3 / 6 giây đứng yên), máu còn ≥ 79%.
  await page.addInitScript(() => { (window as any).__elFightSeed = 20; });
  // Trận chạy theo khung hình thật (tối đa 0,1 giây trận mỗi khung × tốc độ): máy CI bận thì cùng một trận tốn lâu hơn 60 giây của cả test → nới riêng test này.
  test.setTimeout(150_000);
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await expect(page.locator('#app .btn.primary')).toHaveCount(1);
  await expect(page.locator('#app .cbgo')).toContainText('⚔️ Vào trận: Luyện tay 1');
  await expect(page.locator('#app .cbsmith')).toContainText('Thợ rèn gợi ý');
  const n0 = await led(page);
  await page.locator('#app .cbgo').click();
  await expect(page.locator('#whfx canvas')).toBeVisible();
  await expect(page.locator('#whfx .whti')).toHaveText('Luyện tay 1');
  await noHorizontalScroll(page);
  await ready(page);
  // Bot né giỏi điều khiển thay, tăng tốc mô phỏng để test chạy nhanh (luật vẫn là bước cố định của fight.ts).
  await page.evaluate(() => { const r = document.getElementById('whfx') as any; r._auto('good'); r._speed(30); });
  await expect(page.locator('.cbend')).toContainText('Thắng Luyện tay 1', { timeout: 120_000 });
  await expect(page.locator('.cbend')).toContainText(/\+(3\d|4\d) 🪙/);
  const cb = await cbs(page);
  expect(cb.clr).toEqual(['k1-l1']);
  expect(cb.log[0]).toMatchObject({ id: 'k1-l1', r: 'w', w: 0, need: 0 });
  expect(cb.log[0].n).toBeGreaterThan(0);
  expect(cb.best.runs).toBe(1); expect(cb.ach).toContain('run1');
  expect(await led(page), 'trận không ghi bằng chứng (P13)').toBe(n0);
  await page.locator('.cbend [data-e="cbnext"]').click();
  await expect(page.locator('#whfx .whti')).toHaveText('Luyện tay 2');
  expect((await cbs(page)).log[0].again).toBe(1);
  await page.locator('#whfx [data-e="cbexit"]').click();
  await expect(page.locator('#whfx')).toHaveCount(0);
  expect((await cbs(page)).log.at(-1)).toMatchObject({ id: 'k1-l2', r: 'q' });
  expect(errors).toEqual([]);
});

test('thua boss vì thiếu bậc: màn kết chỉ thẳng Vũ khí, một nút mở đúng lò (Thợ rèn gợi ý)', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, { w: 0, ess: 0, got: 0, day: 0, today: 0, spent: 0, clr: ['k1-l1', 'k1-l2'], tip: null, log: [], fb: [] });
  await expect(page.locator('#app .cbgo')).toContainText('⚔️ Đánh boss: Tiếng Ồn Rè');
  await page.locator('#app .cbgo').click();
  await expect(page.locator('#whfx .whti')).toHaveText('Tiếng Ồn Rè');
  await ready(page);
  await page.evaluate(() => (document.getElementById('whfx') as any)._end('lose'));
  const end = page.locator('.cbend');
  await expect(end).toContainText('Thua Tiếng Ồn Rè');
  await expect(end).toContainText('Vũ khí của bạn bậc 0, Tiếng Ồn Rè cần bậc 2');
  const lo = end.locator('[data-e="cblo"]');
  await expect(lo).toContainText('Rèn Vũ khí: vào');
  const g = await lo.getAttribute('data-g');
  await lo.click();
  await expect(page.locator('#whfx.cbfx')).toHaveCount(0);
  const cb = await cbs(page);
  expect(cb.tip?.game).toBe(g);
  expect(cb.log.at(-1)).toMatchObject({ id: 'k1-boss', r: 'l', w: 0, need: 2 });
  expect(errors).toEqual([]);
});

test('Chiến Binh: rèn Vũ khí bằng tinh hoa + xu; khoá theo Từ vựng; góp ý lưu và xuất được', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, { w: 0, ess: 9, got: 9, day: 0, today: 0, spent: 0, clr: [], tip: null, log: [], fb: [] }, 200);
  await expect(page.locator('#app .cbsmith')).toContainText('Rèn Vũ khí bậc 1 ngay');
  await page.locator('#app .cblink[data-r="cb"]').click();
  await expect(page.getByRole('heading', { name: '⚔️ Chiến Binh', level: 1 })).toBeVisible();
  await noHorizontalScroll(page);
  await page.locator('#app [data-e="cbforge"]').first().click();
  const cb = await cbs(page);
  expect(cb).toMatchObject({ w: 1, ess: 1, spent: 20 });
  // Người mới chưa có kỹ năng từ vựng vững: đã rèn nhưng chưa mặc được.
  await expect(page.locator('#app')).toContainText('Đã rèn bậc 1');
  await page.locator('#app form[data-eform="cbfb2"] input[name="t"]').fill('Chém vui, boss hơi khó');
  await page.locator('#app form[data-eform="cbfb2"] button[type="submit"]').click();
  expect((await cbs(page)).fb).toEqual([expect.objectContaining({ at: 'forge', s: 5, t: 'Chém vui, boss hơi khó' })]);
  // Nhân vật: người mới chỉ có Orbiter; nhân vật khác khoá kèm điều kiện mở.
  await expect(page.locator('#app .cbch.on')).toContainText('Orbiter');
  await expect(page.locator('#app .cbch.lock')).toHaveCount(6);
  expect(errors).toEqual([]);
});

test('góp ý nhanh ngay trong trận: chấm sao + một dòng; đồng hồ dừng khi đang góp ý', async ({ page, errors }) => {
  await lobby(page);
  await page.locator('#app .cbgo').click();
  await page.locator('#whfx [data-e="cbfbopen"]').click();
  const fb = page.locator('#whfx .cbfb');
  await expect(fb).toBeVisible();
  await fb.locator('[data-s="4"]').click();
  await fb.locator('input[name="t"]').fill('Nhân vật dễ thương');
  await fb.locator('button[type="submit"]').click();
  await expect(fb).toBeHidden();
  expect((await cbs(page)).fb).toEqual([expect.objectContaining({ at: 'fight', id: 'k1-l1', s: 4, t: 'Nhân vật dễ thương' })]);
  expect(errors).toEqual([]);
});

test('điều khiển: phím chạy, DASH, lên cấp chọn thẻ bằng chạm; trận dừng khi đang chọn', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await page.locator('#app .cbgo').click();
  await ready(page);
  const st = () => page.evaluate(() => (document.getElementById('whfx') as any)._state());
  const x0 = (await st()).x;
  await page.locator('#whfx').focus();
  // Giữ phím tới khi nhân vật đi đủ xa (WebKit chạy khung hình đầu chậm hơn: không đo theo một mốc thời gian cố định).
  await page.keyboard.down('d');
  await expect.poll(async () => (await st()).x, { timeout: 5000 }).toBeGreaterThan(x0 + 30);
  await page.keyboard.up('d');
  await page.locator('#whfx .cbsk.dash').dispatchEvent('pointerdown');
  await expect.poll(async () => (await st()).dashCd).toBeGreaterThan(0);
  await page.evaluate(() => (document.getElementById('whfx') as any)._xp(40));
  const lv = page.locator('#whfx .cblv');
  await expect(lv).toBeVisible();
  await expect(lv.locator('.cbcard')).toHaveCount(3);
  await noHorizontalScroll(page);
  const t = (await st()).t; await page.waitForTimeout(400); expect((await st()).t).toBe(t);
  // 40 XP có thể lên nhiều cấp: chọn tới khi hết thẻ.
  for (let k = 0; k < 8 && await lv.isVisible(); k++) { await lv.locator('.cbcard').first().click(); await page.waitForTimeout(80); }
  await expect.poll(async () => (await st()).level).toBeGreaterThan(1);
  await expect.poll(async () => (await st()).pick).toBeNull();
  expect(errors).toEqual([]);
});
