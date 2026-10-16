import { test, expect, noHorizontalScroll, toLobby, navTo } from './fixtures.ts';
import type { Page } from '@playwright/test';
/* eslint-disable @typescript-eslint/no-explicit-any */

// v135 một não, hai lối (docs/DOI-CHIEU-GAME-APP.md): ⚔️ lối Chiến Binh chỉ có sảnh + Tôi; 📘 lối Học có đủ tab app cũ.
// Tiến độ dùng chung; mỗi câu đúng ghi thêm nó đến từ lối nào; màn ⚖️ Đối chiếu so theo nhóm A2.
test.use({ future: false });

async function lobby(page: Page): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate(() => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a2', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    w.eval('save()'); w.eval("go('games')");
  });
  await toLobby(page, false);
}
// Một câu đúng của bài học kiểu cũ (đường ELCORE.ev của app.js), như khi học một unit.
const answer = (page: Page, item: string) => page.evaluate(it => { const w = window as any; w.ELCORE.ev(w.eval('st'), { node: 'u:a1-u1', level: 2, ok: true, g: 0.25, item: it, qt: 'mcq', ctx: 'rec', src: 'vocab' }, w.eval('today()')); w.eval('save()'); }, item);
const src = (page: Page) => page.evaluate(() => (window as any).eval('st').e.src ?? null);

test('hai lối: lối game gọn (sảnh + Tôi), đổi sang lối Học có đủ tab, đổi lại không mất gì', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await expect(page.locator('#bnav button')).toHaveText(['Hôm nay', 'Tôi', 'Lối Học'].map(t => new RegExp(t)));
  await expect(page.locator('#app .cbgo')).toBeVisible();
  await page.locator('#bnav [data-act="door"]').click();
  await expect(page.locator('#bnav button')).toHaveText(['Hôm nay', 'Ôn tập', 'Thư viện', 'Tôi', 'Lối game'].map(t => new RegExp(t)));
  await expect(page.locator('#app .cbgo')).toHaveCount(0);
  expect(await page.evaluate(() => (window as any).eval('st').set.door)).toBe('app');
  await navTo(page, 'Thư viện');
  await expect(page.getByRole('heading', { name: 'Tự chọn bài', level: 1 })).toBeVisible();
  await page.locator('#bnav [data-act="door"]').click();
  await expect(page.locator('#app .cbgo')).toBeVisible();
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('đối chiếu: câu đúng ghi theo lối; màn ⚖️ chia 7 kỹ năng A2 và nói nhóm nào game chưa có lò', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await answer(page, 'w:x:g1');
  expect(await src(page)).toEqual({ 'u:a1-u1': { g: 1, a: 0 } });
  await page.locator('#bnav [data-act="door"]').click();
  await answer(page, 'w:x:a1');
  await answer(page, 'w:x:a2');
  expect(await src(page)).toEqual({ 'u:a1-u1': { g: 1, a: 2 } });
  await navTo(page, 'Tôi');
  await page.getByRole('button', { name: /Đối chiếu game và app/ }).click();
  await expect(page.getByRole('heading', { name: /Đối chiếu game và app/ })).toBeVisible();
  await expect(page.locator('#app .cmprow')).toHaveCount(7);
  await expect(page.locator('#app')).toContainText(/\/359 phần đã vững/);
  await expect(page.locator('#app')).toContainText('Game chưa có lò cho nhóm này');
  await expect(page.locator('#app .cmprow').first()).toContainText('câu đúng: game 1, app 2');
  await noHorizontalScroll(page);
  expect(errors).toEqual([]);
});

test('v136 Thư viện: bảng 7 kỹ năng (thanh vững, "thiếu nhất"); chạm Nghe mở đúng tab Nghe, chạm Phát âm mở màn phát âm', async ({ page, errors }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await lobby(page);
  await navTo(page, 'Thư viện');
  const rows = page.locator('#app .lskrow');
  await expect(rows).toHaveCount(7);
  await expect(rows).toHaveText(['Từ vựng', 'Ngữ pháp', 'Phát âm', 'Nghe', 'Nói', 'Đọc', 'Viết'].map(t => new RegExp(t)));
  await expect(page.locator('#app .lskrow.low')).toHaveCount(1);
  await expect(rows.filter({ hasText: 'Nói' })).toContainText('tin cậy vừa');
  await noHorizontalScroll(page);
  await rows.filter({ hasText: 'Nghe' }).click();
  await expect(page.locator('[data-ttab="nghe"]')).toHaveAttribute('aria-selected', 'true');
  await navTo(page, 'Thư viện');
  await rows.filter({ hasText: 'Phát âm' }).click();
  await expect(page.locator('#app h1')).toContainText(/Phát âm|âm/i);
  expect(errors).toEqual([]);
});
