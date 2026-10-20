import { test, expect, noHorizontalScroll, toLobby, navTo } from './fixtures.ts';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
/* eslint-disable @typescript-eslint/no-explicit-any */

// v138 ba phần (docs/DOI-CHIEU-GAME-APP.md): ⚔️ Chơi · 📘 Học · 🎯 Mục tiêu · Tôi. Mở app vào Mục tiêu. Câu đúng ghi nguồn theo nơi học
// (lò game = game, còn lại = app); Mục tiêu cho A1 / A2 cần đạt gì ở 7 kỹ năng, nút học ở game hoặc ở app, trận cổng.
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

async function seed(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a2', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
}
// Một câu đúng như ở bài học kiểu cũ (ctx 'rec') hoặc ở lò Vòng Chữ (ctx 'wheel'), qua đường ELCORE.ev.
const answer = (page: Page, item: string, ctx: string) => page.evaluate(([it, cx]) => { const w = window as any; w.ELCORE.ev(w.eval('st'), { node: 'u:a1-u1', level: 2, ok: true, g: 0.25, item: it, qt: 'mcq', ctx: cx, src: 'vocab' }, w.eval('today()')); w.eval('save()'); }, [item, ctx] as const);

test.describe('mở app (home: false)', () => {
  test.use({ home: false });
  test('mở app vào 🎯 Mục tiêu; thanh = Chơi · Học bài · Học nhanh · Mục tiêu · Tôi; A1 / A2 đổi được; WCAG', async ({ page, errors }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await seed(page);
    // Chờ bài học chi tiết tải xong rồi mới tải lại trang: tải lại giữa chừng thì Safari báo lỗi fetch bị cắt ngang (CI WebKit).
    await page.waitForFunction(() => (window as any).eval('detailAll()'), null, { timeout: 30000 });
    await page.reload();
    await expect(page.getByRole('heading', { name: /Cần đạt ở mỗi cấp/ })).toBeVisible({ timeout: 20000 });
    await expect(page.locator('#bnav button')).toHaveText(['Chơi', 'Học bài', 'Học nhanh', 'Mục tiêu', 'Tôi'].map(t => new RegExp(`^${t}`)));
    await expect(page.locator('#bnav button[aria-current="page"]')).toContainText('Mục tiêu');
    await expect(page.locator('#app .cmprow')).toHaveCount(7);
    await expect(page.locator('#app')).toContainText(/Cần đạt để qua A2 · \d+\/361 phần đã vững/);
    await expect(page.locator('#app [data-e="cblo"]')).toHaveCount(1);
    await expect(page.locator('#app [data-act="skgo"]')).toHaveCount(7);
    await expect(page.locator('#app')).toContainText('Thi chuyển cấp A2');
    // v139: bấm dòng kỹ năng → mở danh sách từng phần cần đạt
    const voc = page.locator('#app .aimsk').first();
    await expect(voc.locator('.aimdet')).toBeHidden();
    await voc.locator('summary').click();
    await expect(voc.locator('.aimit').first()).toBeVisible();
    await expect(voc).toContainText(/Còn \d+ phần chưa vững/);
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => v.id)).toEqual([]);
    await page.locator('[data-e="aimlv"][data-lv="A1"]').click();
    await expect(page.locator('#app')).toContainText(/Cần đạt để qua A1 · \d+\/186 phần đã vững/);
    await expect(page.locator('[data-e="aimpick"]')).toContainText('Chọn A1 làm đích');
    await page.locator('[data-e="aimpick"]').click();
    await expect(page.locator('[data-e="aimpick"]')).toHaveCount(0);
    expect(await page.evaluate(() => (window as any).eval('st').e.goals[0].id)).toBe('cefr-a1');
    expect(errors).toEqual([]);
  });
});

test('câu đúng ghi nguồn theo nơi học; Mục tiêu tách nhờ game / nhờ app; nút "📘 Học ở app" mở đúng màn', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await answer(page, 'w:x:g1', 'wheel');
  await answer(page, 'w:x:a1', 'rec');
  await answer(page, 'w:x:a2', 'rec');
  expect(await page.evaluate(() => (window as any).eval('st').e.src)).toEqual({ 'u:a1-u1': { g: 1, a: 2 } });
  await page.evaluate(() => (window as any).eval('emLoad()'));
  await navTo(page, 'Mục tiêu');
  await expect(page.locator('#app .cmprow')).toHaveCount(7);
  await page.locator('#app [data-act="skgo"][data-sk="lis"]').click();
  await expect(page.locator('[data-ttab="nghe"]')).toHaveAttribute('aria-selected', 'true');
  await expect(page.locator('#bnav button[aria-current="page"]')).toContainText('Học');
  expect(errors).toEqual([]);
});

test('tab 📘 Học bài: ▶ Hôm nay đứng đầu + tự chọn bài + 7 kỹ năng trong mục chi tiết (v175 bỏ "Hoặc tự học tiếp")', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await seed(page);
  await page.evaluate(() => (window as any).eval('emLoad()'));
  await toLobby(page, false);
  await navTo(page, 'Học');
  await expect(page.getByRole('heading', { name: '📘 Học bài', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Hoặc tự học tiếp' })).toHaveCount(0);
  await expect(page.locator('#app .dayplan')).toContainText('▶ Hôm nay');   // v161 một nút, một não cho Học bài + Ôn luyện
  await page.getByText('Kỹ năng theo mục tiêu (chi tiết)').click();
  await expect(page.locator('#app .lskrow')).toHaveCount(7);
  for (const t of [/Bài học theo chủ đề/, /Kỹ năng/, /Sổ từ/]) await expect(page.getByRole('button', { name: t })).toBeVisible();
  await noHorizontalScroll(page);
  await expect(page.locator('#app .lnext [data-go="review"]')).toHaveCount(0);
  await page.evaluate(() => (window as any).eval("go('review')"));
  await expect(page.locator('#bnav button[aria-current="page"]')).toContainText('Học nhanh');   // v165 tab nd = ⚡ Học nhanh
  expect(errors).toEqual([]);
});

test.describe('v178 đích mặc định (home: false)', () => {
  test.use({ home: false });
  test('chưa chọn đích, chưa qua A1 → Mục tiêu và Kỹ năng của bạn theo A1 (góp ý #14)', async ({ page, errors }) => {
    await page.goto('/');
    await page.waitForFunction(() => (window as any).ELREADY === true);
    await page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; st.e.goals = []; w.eval('save()'); w.eval("go('goal')"); });
    await expect(page.locator('#app')).toContainText(/Cần đạt để qua A1 · \d+\/186 phần đã vững/, { timeout: 20000 });
    await page.evaluate(() => (window as any).eval("go('lib')"));
    await expect(page.locator('#app .lsk')).toContainText('A1', { timeout: 20000 });
    expect(errors).toEqual([]);
  });
});
