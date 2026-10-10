import AxeBuilder from '@axe-core/playwright';
import { test, expect, play } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v74 Bài Câu: lá từ của câu ngữ pháp do engine chọn; tự xếp câu = bằng chứng mức 3 (id lượt "quest-1:c…"); điểm / bùa là telemetry.
// v97 (GAME-CRITERIA §10.9): chạy trong lớp phủ toàn màn hình; lá bài là nút thật trên bàn nỉ canvas, kéo thả được; lượt đúng tự chuyển.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    w.eval('save()'); w.eval("go('games')");
  });
  await page.getByRole('button', { name: '▶ Chơi' }).click();
  await expect(page.getByRole('heading', { name: /Hôm nay chơi gì/ })).toBeVisible({ timeout: 15000 });
  await play(page, 'cdstart');
  await expect(page.locator('#whfx.cdfx')).toBeVisible();
  await page.waitForTimeout(500);   // lá bay từ cỗ bài vào chỗ (0,22 s)
}
const vis = (page: Page, sel: string) => page.locator(sel).filter({ visible: true });
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());
const tiles = (page: Page) => page.evaluate(() => (document.getElementById('whfx') as any)._pos());
const zone = (page: Page) => page.evaluate(() => (document.getElementById('whfx') as any)._zone());
async function dragTo(page: Page, from: { x: number; y: number }, to: { x: number; y: number }): Promise<void> {
  await page.mouse.move(from.x, from.y); await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 8 }); await page.mouse.up();
}

test('Bài Câu: xếp đúng thì ra bài có điểm (tự chuyển lượt), sai thì hiện câu đúng; 3 bàn × 3 lượt; bằng chứng đúng nút ngữ pháp', async ({ page, errors }) => {
  await open(page);
  const end = page.getByRole('heading', { name: /Xong ván/ });
  let plays = 0, good = 0, shot = 0;
  for (let i = 0; i < 80 && !(await end.isVisible()); i++) {
    const playB = vis(page, '[data-e="cdplay"]'), next = vis(page, '[data-e="cdnext"]'), charm = vis(page, '[data-e="cdcharm"]');
    await expect(playB.or(next).or(charm).or(end).first()).toBeVisible();
    if (await end.isVisible()) break;
    if (await charm.count()) { await charm.first().click(); continue; }
    if (await next.count()) {
      const h = await next.first().elementHandle(); await h!.click();
      expect(await h!.isVisible(), 'nút vừa bấm phải ẩn ngay (không đợi khung hình: WebKit vẽ khung chậm, CI Safari iOS)').toBe(false);
      continue;
    }
    const pk = await peek(page);
    expect(pk.run).toBe('cards');
    if (plays % 2 === 0) for (const k of pk.order) await page.locator(`#whfx [data-e="cdtile"][data-i="${k}"]`).click();   // đúng (chạm)
    else await vis(page, '#whfx [data-e="cdtile"]').first().click();                                                      // sai (1 lá)
    if (shot++ === 0) await page.screenshot({ path: 'test-results/cards.png' });
    await playB.click(); plays++;
    if (plays % 2 === 1) { await expect(page.locator('.cdfb .fb.good')).toBeVisible(); good++; await expect(vis(page, '[data-e="cdnext"]')).toHaveCount(0); }
    else await expect(page.locator('.cdfb .fb.bad')).toContainText('Câu đúng');
  }
  await expect(end).toBeVisible();
  expect(plays).toBe(9); expect(good).toBe(5);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); const xs = st.e.ev.led.filter((x: any) => /^quest-1:c1:/.test(x.ch ?? '')); return { n: xs.length, ok: xs.filter((x: any) => x.ok).length, g: xs.every((x: any) => x.node.startsWith('g:')), gc: st.e.gc }; });
  expect(s.n).toBe(9); expect(s.ok).toBe(5); expect(s.g).toBe(true); expect(s.gc.runs).toBe(1);
  await page.screenshot({ path: 'test-results/cards-end.png' });
  await expect(page.getByText(/không đổi đánh giá năng lực/)).toBeVisible();
  await page.locator('#whfx [data-e="cdexit"]').last().click();
  await expect(page.locator('#whfx')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('v97 Bài Câu: kéo thả chuột thật vào vùng câu, chèn đúng chỗ, kéo ra để bỏ; câu kéo đúng → ra bài, bằng chứng thứ tự', async ({ page, errors }) => {
  await open(page);
  const pk = await peek(page), order: number[] = pk.order;
  expect(order.length).toBeGreaterThanOrEqual(2);
  const z = await zone(page);
  // Vị trí lá khi đã đứng yên (lá trượt bằng transition 0,22 s; máy chậm thì lâu hơn): đọc lại tới khi hai lần liền giống nhau.
  // Lá đã vào câu: chờ tới khi nó thật sự nằm trong vùng câu (WebKit ở CI vẽ khung chậm: lá có thể chưa kịp bắt đầu trượt, hai lần đọc
  // giống nhau vẫn là vị trí cũ trong tay), rồi mới đọc vị trí đứng yên.
  const atRow = async (k: number) => { await expect.poll(async () => { const t = (await tiles(page))[k], zz = await zone(page); return t.on && t.y >= zz.y && t.y <= zz.y + zz.h; }, { timeout: 5000 }).toBe(true); return at(k); };
  const at = async (k: number) => { let a = (await tiles(page))[k]; for (let n = 0; n < 30; n++) { await page.waitForTimeout(80); const b = (await tiles(page))[k]; if (Math.abs(a.x - b.x) < 0.5 && Math.abs(a.y - b.y) < 0.5) return b; a = b; } return a; };
  // Kéo lá thứ hai của câu vào trước, rồi kéo lá đầu vào TRƯỚC nó (chèn theo vị trí con trỏ).
  await dragTo(page, await at(order[1]!), { x: z.x + z.w / 2, y: z.y + z.h / 2 });
  const second = await atRow(order[1]!);
  await dragTo(page, await at(order[0]!), { x: second.x - 40, y: second.y });
  // Thứ tự trong câu: order[0], order[1]
  const rowOrder = async () => (await tiles(page)).map((t: any, i: number) => ({ ...t, i })).filter((t: any) => t.on).sort((a: any, b: any) => a.k - b.k).map((t: any) => t.i);   // thứ tự logic trong câu (lá vừa thả có thể còn đang trượt)
  const dlog = () => page.evaluate(() => ((document.getElementById('whfx') as any)?._log?.() ?? []).join(' | '));
  expect(await rowOrder(), `nhật ký kéo thả: ${await dlog()}`).toEqual([order[0], order[1]]);
  // Kéo lá ra khỏi vùng câu → bỏ ra.
  const one = await atRow(order[1]!);
  await dragTo(page, one, { x: one.x, y: z.y + z.h + 200 });
  expect(await rowOrder()).toEqual([order[0]]);
  // Kéo nốt các lá còn lại theo thứ tự vào cuối câu.
  // Mỗi lần thả: chờ lá vừa kéo thật sự vào câu và đứng yên ở hàng (WebKit CI chậm) rồi mới kéo lá sau.
  for (const [n, k] of order.slice(1).entries()) {
    const zz = await zone(page);
    await dragTo(page, await at(k), { x: zz.x + zz.w - 20, y: zz.y + zz.h - 20 });
    await expect.poll(async () => (await tiles(page)).filter((t: any) => t.on).length, { message: `lá ${k}: ${await dlog()}` }).toBe(n + 2);
    await atRow(k);
  }
  expect(await rowOrder(), `nhật ký kéo thả: ${await dlog()}`).toEqual(order);
  await page.screenshot({ path: 'test-results/cards-drag.png' });
  await vis(page, '[data-e="cdplay"]').click();
  await expect(page.locator('.cdfb .fb.good')).toBeVisible();
  const led = await page.evaluate(() => (window as any).eval('st').e.ev.led.slice(-1)[0]);
  expect(led.ctx).toBe('cards'); expect(led.ok).toBe(1); expect(led.qt).toBe('order');
  // Tự chuyển sang lượt 2 (không phải bấm Tiếp).
  await expect(page.locator('#whfx .whti')).toContainText('lượt 2/3', { timeout: 4000 });
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) {
  test(`v97 Bài Câu: WCAG AA (${scheme}), 390px, lá ≥ 44 px, lá bấm được bằng bàn phím`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await open(page);
    await page.waitForTimeout(400);
    const r = await new AxeBuilder({ page }).include('#whfx').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    const hs = await page.locator('#whfx .cdtile').evaluateAll(xs => xs.map(x => (x as HTMLElement).getBoundingClientRect()).map(b => ({ h: b.height, w: b.width, r: b.right })));
    expect(hs.every(b => b.h >= 44 && b.w >= 44 && b.r <= 390)).toBe(true);
    await page.locator('#whfx .cdtile').first().focus(); await page.keyboard.press('Enter');
    await expect(page.locator('#whfx .cdtile.on')).toHaveCount(1);
    await page.screenshot({ path: `test-results/cards-390-${scheme}.png` });
    expect(errors).toEqual([]);
  });
}
