import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v130 Bản đồ Phố Chữ (GAME-CRITERIA §17): màn Hôm nay là một bản đồ kéo / thu phóng 5 khu; mọi game, truyện, Túi chữ, Bảng tin và
// Đấu trường là công trình trên đó. Kiểm: kéo / phóng đổi camera (không đổi trang), chạm công trình → bảng → chơi, Tab đưa camera theo,
// chế độ danh sách, Đấu trường ↔ bản đồ, WCAG AA sáng / tối ở 390 px.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function map(page: Page): Promise<void> {
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
  await expect(page.locator('#app .wmap')).toBeVisible();
}
const tf = (page: Page) => page.locator('.wworld').evaluate(el => (el as HTMLElement).style.transform);
const zoomOf = async (page: Page) => Number((await tf(page)).match(/scale\(([\d.]+)\)/)?.[1]);

test('kéo và phóng đổi camera; chạm sau khi kéo không mở bảng; camera nhớ qua lần vẽ lại', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await map(page);
  const t0 = await tf(page);
  expect(t0).toMatch(/translate\(-?\d+px, ?-?\d+px\) scale\([\d.]+\)/);
  await page.locator('.wmap').scrollIntoViewIfNeeded();
  const box = (await page.locator('.wmap').boundingBox())!;
  const x = box.x + box.width / 2, y = box.y + box.height / 2;
  await page.mouse.move(x, y); await page.mouse.down();
  await page.mouse.move(x + 60, y + 80, { steps: 6 }); await page.mouse.up();
  const t1 = await tf(page);
  expect(t1).not.toBe(t0);
  await expect(page.locator('.wsheet')).toHaveCount(0);                 // vừa kéo: không tính là chạm công trình
  const z0 = await zoomOf(page);
  await page.locator('[data-e="wmzoom"][data-k="1.25"]').click();
  await expect.poll(() => zoomOf(page)).toBeGreaterThan(z0);
  const t2 = await tf(page);
  await page.evaluate(() => (window as any).eval('render()'));
  expect(await tf(page)).toBe(t2);
  await page.locator('[data-e="wmhome"]').click();
  await expect.poll(() => tf(page)).not.toBe(t2);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('Tab tới công trình ngoài khung → camera kéo tới; Enter mở bảng; ▶ Chơi vào đúng game', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await map(page);
  const b = page.locator('.wplace[data-p="kara"]');                     // Phố Đêm (góc trên phải, xa ghim ở Quảng trường)
  await page.locator('.wmap').scrollIntoViewIfNeeded();
  const inFrame = async () => { const fr = (await page.locator('.wmap').boundingBox())!, r = (await b.boundingBox())!; return r.y >= fr.y - 1 && r.y + r.height <= fr.y + fr.height + 1 && r.x >= fr.x - 1 && r.x + r.width <= fr.x + fr.width + 1; };
  expect(await inFrame()).toBe(false);
  await b.focus();
  await expect.poll(inFrame, { timeout: 3000 }).toBe(true);
  await page.keyboard.press('Enter');
  const sheet = page.locator('.wsheet');
  await expect(sheet).toContainText('Sân khấu');
  await expect(sheet).toContainText('Khu này còn Sương Câm');            // sương chỉ trang trí: vẫn có nút chơi
  await sheet.locator('[data-e="wmclose"]').click();
  await expect(sheet).toHaveCount(0);
  await page.locator('.wplace[data-p="case"]').evaluate((el: HTMLElement) => el.click());
  await page.locator('.wsheet [data-e="dtstart"]').click();
  await expect.poll(() => page.evaluate(() => (window as any).eval('EM').peek()?.game)).toBe('case');
  expect(errors).toEqual([]);
});

test('Đấu trường mở thử thách cũ của app; nút quay lại về bản đồ; tab Chơi vẫn sáng', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await map(page);
  await page.locator('.wplace[data-p="arena"]').evaluate((el: HTMLElement) => el.click());
  await page.locator('.wsheet [data-go="games"]').click();
  await expect(page.locator('#app')).toContainText('Đấu trường');
  await expect(page.locator('#bnav button[aria-current="page"]')).toContainText('Chơi');
  await page.getByRole('button', { name: '← Bản đồ Phố Chữ' }).click();
  await expect(page.locator('#app .wmap')).toBeVisible();
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) test(`bản đồ + bảng công trình + danh sách: WCAG AA (${scheme}), 390 px không cuộn ngang`, async ({ page, errors }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width: 390, height: 844 });
  await map(page);
  const axe = async () => (await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze()).violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`);
  expect(await axe()).toEqual([]);
  await page.locator('.wplace[data-p="wheel"]').evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('.wsheet')).toContainText('Vòng đu quay');
  expect(await axe()).toEqual([]);
  await page.screenshot({ path: `test-results/worldmap-${scheme}.png`, fullPage: true });
  await page.locator('[data-e="wmlist"]').click();
  const list = page.locator('.wlist');
  await expect(list.locator('.wlz')).toHaveCount(5);
  await expect(list.locator('.wlp')).toHaveCount(25);
  expect(await axe()).toEqual([]);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});
