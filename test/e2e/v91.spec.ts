import { test, expect, play, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v91 (GAME-CRITERIA §9.3): xu chung có chỗ tiêu, quyết định nằm ngoài vòng câu hỏi — trang trí Phố, hồi tim ở Leo tháp.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

async function open(page: Page, coins: number): Promise<void> {
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  await page.evaluate((c) => {
    const w = window as any, st = w.eval('st');
    st.onboarded = true;
    st.e.goals = [{ id: 'cefr-a1', version: '1.0', since: w.eval('today()'), date: null }];
    st.e.gf = { runs: 1, day: w.eval('today()') - 1 };
    st.e.q = { floor: 1, best: 0, coins: c, runs: 0, wins: 0, ans: 0, ok: 0, day: 0 };
    st.e.gq = { stars: 23, runs: 4, best: 6, day: 1 };
    w.eval('save()'); w.eval("go('games')");
  }, coins);
  await toLobby(page);
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());

test('Phố: trang trí công trình bằng xu chung; ví trừ đúng; món sau cần ★ kế tiếp', async ({ page, errors }) => {
  await open(page, 100);
  const shop = page.locator('details.twshop');
  await expect(shop).toContainText('100 xu');
  await shop.locator('summary').click();
  await shop.locator('[data-e="twbuy"][data-g="cafe"]').click();
  await expect(page.locator('details.twshop')).toContainText('70 xu');
  await expect(page.locator('.twt[data-e="cfstart"] .twd')).toHaveText('☂️');
  const tw = await page.evaluate(() => (window as any).eval('st').e.tw);
  expect(tw).toEqual({ spent: 30, deco: { cafe: 1 } });
  await page.locator('details.twshop').evaluate((d: any) => { d.open = true; });
  await page.locator('[data-e="twbuy"][data-g="cafe"]').click();   // món 2 (60 xu) với 2 ★
  await expect(page.locator('details.twshop')).toContainText('10 xu');
  await expect(page.locator('details.twshop')).toContainText('cần ★ thứ 3');
  expect(errors).toEqual([]);
});

test('Leo tháp: hết tim → hồi 1 tim bằng 25 xu (một lần mỗi tầng), leo tiếp; câu vẫn do engine chọn', async ({ page, errors }) => {
  await open(page, 100);
  await play(page, 'qstart');
  let revived = false;
  for (let i = 0; i < 40; i++) {
    if (await page.locator('[data-e="qrevive"]').isVisible()) {
      await page.locator('[data-e="qrevive"]').click();
      revived = true; break;
    }
    const next = page.locator('[data-e="qnext"]');
    if (await next.isVisible()) { await next.click(); continue; }
    const pk = await peek(page);
    if (!pk) break;
    if (pk.opts) { const w = pk.opts.findIndex((_: string, j: number) => j !== pk.ans); await page.locator(`[data-e="qans"][data-i="${w}"]`).first().click(); }
    else { await page.locator('input[name="a"]').first().fill('zzz'); await page.locator('input[name="a"]').first().press('Enter'); }
  }
  expect(revived).toBe(true);
  const s = await page.evaluate(() => { const st = (window as any).eval('st'); return { tw: st.e.tw }; });
  expect(s.tw.spent).toBe(25);
  // Đang leo tiếp với 1 tim: có câu mới, nút hồi tim không còn ở lượt sau.
  const pk = await peek(page);
  expect(pk).not.toBeNull();
  expect(errors).toEqual([]);
});
