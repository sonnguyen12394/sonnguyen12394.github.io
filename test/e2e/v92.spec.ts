import AxeBuilder from '@axe-core/playwright';
import { test, expect, play, toLobby } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v92 (GAME-CRITERIA §9.7): game tiếp nhận / trình diễn nâng bằng trình bày, không thêm thao tác (HG24).
//   Thám tử: mỗi câu hiểu đúng ghim một mảnh lên bảng manh mối; màn kết có biên bản vụ án. Karaoke: màn biểu diễn từng câu.
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
  await toLobby(page);
}
const peek = (page: Page) => page.evaluate(() => (window as any).eval('EM').peek());
const axe = async (page: Page) => {
  const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
};

test('Thám tử: câu đúng ghim manh mối (đúng chữ đáp án), sai thì không ghim; màn kết có biên bản; không thêm bằng chứng', async ({ page, errors }) => {
  await open(page);
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await play(page, 'dtstart');
  const end = page.getByRole('heading', { name: /Phá án|Hồ sơ còn bỏ ngỏ/ });
  let n = 0, pinned = 0;
  for (let i = 0; i < 30 && !(await end.isVisible()); i++) {
    const pk = await peek(page);
    if (pk?.run === 'case') {
      const main = await page.getByText(/Kết luận vụ án/).isVisible();
      const pin = n !== 1 && !main;
      if (n === 1) await page.locator('[data-e="dtans"][data-i="-1"]').click();
      else await page.locator(`[data-e="dtans"][data-i="${pk.ans}"]`).click();
      if (pin) pinned++;
      await expect(page.locator('.dtboard li')).toHaveCount(pinned);
      if (pin) await expect(page.locator('.dtboard li').last()).toContainText(pk.opts[pk.ans]);
      n++; continue;
    }
    await page.locator('[data-e="dtnext"]').click();
  }
  await expect(end).toBeVisible();
  const rec = page.locator('details.dtrec');
  await rec.locator('summary').click();
  await expect(rec.locator('li')).toHaveCount(n);
  await axe(page);
  await page.screenshot({ path: 'test-results/case-record.png', fullPage: true });
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
  expect(errors).toEqual([]);
});

test('Karaoke: màn biểu diễn liệt kê đúng các câu của bạn, có câu hay nhất và nút nghe mẫu; không thêm bằng chứng', async ({ page, errors }) => {
  await open(page);
  const led0 = await page.evaluate(() => (window as any).eval('st').e.ev.led.length);
  await play(page, 'krstart');
  const end = page.getByRole('heading', { name: /Hết bài/ });
  let mine = 0;
  for (let i = 0; i < 40 && !(await end.isVisible()); i++) {
    const pk = await peek(page);
    if (pk?.run === 'krwait') { await page.locator('[data-e="krnext"]').click(); continue; }
    if (pk?.run === 'karaoke') {
      // Không phụ thuộc máy nghe: tự chấm (Dễ / Được) nếu có nút, không thì đặt kết quả máy nghe.
      const self = page.locator('[data-e="krself"][data-v="1"]');
      if (await self.isVisible()) await self.click();
      else { await page.evaluate(([k, v]) => { const w = window as any, A = w.eval('ASR'); A.key = k; A.on = false; A.err = ''; A.res = { words: ['x'], hit: [0], heard: 'x', p: v }; w.eval('render()'); }, [pk.id, mine % 2 ? 0.5 : 1] as const); await page.locator('[data-e="krnext"]').click(); }
      mine++; continue;
    }
    break;
  }
  await expect(end).toBeVisible();
  await expect(page.locator('.krstage .krline')).toHaveCount(mine);
  await expect(page.locator('.krstage')).toContainText('🌟');
  await expect(page.locator('.krstage [data-say]').first()).toBeVisible();
  await axe(page);
  await page.screenshot({ path: 'test-results/kara-stage.png', fullPage: true });
  expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
  expect(errors).toEqual([]);
});
