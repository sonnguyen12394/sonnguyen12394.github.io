import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v132 sảnh và nhân vật kiểu Gunny (GAME-CRITERIA §19): sân khấu sảnh có nhân vật của người chơi (M1), thanh trên có Lực chữ + nhạc (M2 M7),
// lối tắt (M4), dòng tin (M5); Tạo nhân vật (C1), 7 ô trang bị (C3), Lực chữ (C4), thời trang mua bằng xu (C7), một công tắc âm thanh (M7).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const axe = async (page: Page) => (await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze()).violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`);

async function lobby(page: Page, coins = 0, sound = true): Promise<void> {
  await page.addInitScript(() => {
    const w = window as any, A = w.AudioContext;
    w.__acN = 0;
    if (A) w.AudioContext = class extends A { constructor(...a: any[]) { super(...a); w.__acN++; } };
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(([c, snd]) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true; st.set.sfx = snd; st.set.music = snd;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    st.e.q = { ...(st.e.q || {}), coins: c };
    w.eval('save()'); w.eval("go('games')");
  }, [coins, sound] as const);
  await toLobby(page, false);
}
const E = (page: Page) => page.evaluate(() => (window as any).eval('st').e);

test('M1 M2 M4 M5 C1: sân khấu sảnh có nhân vật + Tí; thanh trên có ⚔️ Lực chữ và nhạc; lối tắt; dòng tin; Tạo nhân vật rồi ra phố', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, 0);
  const stage = page.locator('.whud .lbstage');
  await expect(stage.locator('svg.av')).toHaveCount(1);
  await expect(stage.locator('svg.ti')).toHaveCount(1);
  await expect(stage.locator('svg.lbscene')).toHaveCount(1);
  await expect(page.locator('.whud .wres')).toContainText(/⚔️ \d+/);
  await expect(page.locator('.whud [data-e="wmmusic"]')).toHaveCount(1);
  await expect(stage.locator('.lbd')).toHaveCount(5);
  await expect(stage.locator('.lbnews')).toContainText('Sự kiện tuần');
  await expect(page.locator('.wplace.pin svg.av')).toHaveCount(1);       // ghim "Bạn ở đây": nhân vật + Tí
  // Lần đầu: chạm nhân vật → Tạo nhân vật; đổi tóc thì hình đổi; Xong → ra phố, không còn nhãn "Tạo".
  await stage.locator('.lbfig').click();
  await expect(page.getByRole('heading', { name: /Tạo nhân vật của bạn/ })).toBeVisible();
  const fig = page.locator('.mkstage .eqfig');
  const before = await fig.innerHTML();
  const h = (await E(page)).av?.look?.h ?? 0;
  await page.locator(`[data-e="bgavset"][data-k="h"][data-v="${(h + 1) % 6}"]`).click();
  expect(await fig.innerHTML()).not.toEqual(before);
  await page.locator('[data-e="bgavdone"]').click();
  expect((await E(page)).av.made).toBe(true);
  await expect(page.locator('.eqslot')).toHaveCount(7);
  await page.locator('[data-e="qhome"]').first().click();
  await expect(page.locator('.lbnew')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('C3 C4: 7 ô quanh nhân vật (4 trái, 3 phải); chạm ô mở thẻ món với bậc và nút luyện ngay; Lực chữ hiện', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await page.locator('.lbd[data-t="me"]').click();
  await expect(page.locator('.eqcol.l .eqslot')).toHaveCount(4);
  await expect(page.locator('.eqcol.r .eqslot')).toHaveCount(3);
  await expect(page.locator('.eqpow')).toContainText(/Lực chữ \d+/);
  await page.locator('[data-e="bgavslot"][data-s="pen"]').click();
  const card = page.locator('.eqcard');
  await expect(card).toContainText('Dùng thật');
  await expect(card.locator('.eqstep')).toHaveCount(5);
  await expect(card.locator('[data-e="akstart"]')).toContainText('Luyện ngay');
  await page.locator('.eqcard [data-e="bgavslot"]').click();
  await expect(card).toHaveCount(0);
  await expect(page.locator('.mslot')).toHaveCount(5);                     // hàng Đạo cụ (5 món rèn ở Xưởng) vẫn còn
  expect(errors).toEqual([]);
});

test('C7: thời trang: thử miễn phí; đủ xu thì mua, tự mặc, ví trừ đúng; thiếu xu thì không mua; tắt hiện thời trang', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, 100);
  await page.locator('.lbd[data-t="look"]').click();
  await page.locator('[data-e="bgavtry"][data-id="f-crown"]').click();
  const buy = page.locator('[data-e="bgavbuy"]');
  await expect(buy).toHaveAttribute('aria-disabled', 'true');
  await buy.click({ force: true });                                     // nút khoá mềm vẫn bấm được (báo thiếu xu), nhưng không mua
  expect((await E(page)).av?.spent ?? 0).toBe(0);
  await page.locator('[data-e="bgavtry"][data-id="f-cap"]').click();
  await page.locator('[data-e="bgavbuy"]').click();
  const av = (await E(page)).av;
  expect(av.spent).toBe(40); expect(av.fash).toEqual(['f-cap']); expect(av.wear.hat).toBe('f-cap');
  await expect(page.locator('.lkstage .pill')).toContainText('🪙 60');
  await page.locator('.bgtabs [data-t="me"]').click();
  await page.locator('[data-e="bgavshow"]').click();
  expect((await E(page)).av.showF).toBe(false);
  await page.locator('[data-e="qhome"]').first().click();
  await expect(page.locator('.whud .wres')).toContainText('🪙 60');
  expect(errors).toEqual([]);
});

test('M7: một công tắc: tắt âm thanh và nhạc trong Cài đặt thì cả sảnh và nhân vật không tạo AudioContext; nút 🔊 ở sảnh đổi st.set.music', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, 100, false);
  await page.locator('.lbd[data-t="look"]').click();
  await page.locator('[data-e="bgavtry"][data-id="f-cap"]').click();
  await page.locator('[data-e="bgavbuy"]').click();
  await page.locator('.bgtabs [data-t="me"]').click();
  await page.locator('[data-e="bgavslot"][data-s="hat"]').click();
  expect(await page.evaluate(() => (window as any).__acN)).toBe(0);
  await page.locator('[data-e="qhome"]').first().click();
  const mus = page.locator('.whud [data-e="wmmusic"]');
  await expect(mus).toHaveAttribute('aria-pressed', 'false');
  await mus.click();
  expect(await page.evaluate(() => (window as any).eval('st').set.music)).toBe(true);
  await expect(page.locator('.whud [data-e="wmmusic"]')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

for (const scheme of ['light', 'dark'] as const) test(`M6 (${scheme}): sảnh, Trang bị, Thời trang, Tạo nhân vật đạt WCAG AA ở 390 px, không cuộn ngang`, async ({ page, errors }) => {
  await page.emulateMedia({ colorScheme: scheme });
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page, 50);
  expect(await axe(page)).toEqual([]);
  await noHorizontalScroll(page);
  for (const t of ['me', 'look']) {
    await page.locator(`.lbd[data-t="${t}"]`).click();
    expect(await axe(page)).toEqual([]);
    await noHorizontalScroll(page);
    await page.locator('[data-e="qhome"]').first().click();
  }
  await page.locator('.lbfig').click();
  await expect(page.locator('.mkstage')).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});
