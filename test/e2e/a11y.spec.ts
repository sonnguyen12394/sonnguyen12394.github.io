import AxeBuilder from '@axe-core/playwright';
import { test, expect, openApp, navTo, noHorizontalScroll } from './fixtures.ts';

// WCAG 2.1 AA: tương phản, nhãn, vai trò… kiểm bằng axe-core trên các màn của phần ôn thi, sáng và tối, rộng 390px.
for (const scheme of ['light', 'dark'] as const) {
  test(`trợ năng WCAG AA, chế độ ${scheme}`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    await page.setViewportSize({ width: 390, height: 844 });
    await openApp(page);
    await navTo(page, 'Ôn thi');
    const scan = async () => {
      const r = await new AxeBuilder({ page }).include('#app').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    };
    await scan();
    await page.getByRole('button', { name: /IELTS Academic/ }).click();
    await scan();
    await page.getByRole('button', { name: /Cách tính điểm và nguồn/ }).click();
    await scan();
    await noHorizontalScroll(page);
    expect(errors).toEqual([]);
  });
}

test('dùng được bằng bàn phím: Tab tới tab Ôn thi và Enter mở', async ({ page, errors }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await openApp(page);
  const btn = page.locator('#nav button').filter({ hasText: 'Ôn thi' });
  await btn.focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  await page.keyboard.press('Tab');
  const focused = await page.evaluate(() => document.activeElement?.tagName);
  expect(focused).toBe('BUTTON');
  expect(errors).toEqual([]);
});
