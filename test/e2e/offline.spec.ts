import { test, expect, openApp, navTo } from './fixtures.ts';

test('mở lại khi mất mạng: app và tab Ôn thi vẫn chạy', async ({ page, context, browserName, errors }) => {
  test.skip(browserName === 'webkit' && !process.env.CI, 'WebKit chỉ chạy trên CI');
  await openApp(page);
  // chờ service worker cài xong và điều khiển trang
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  await page.waitForTimeout(500);
  await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#bnav button:visible, #nav button:visible').first()).toBeVisible();
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  await context.setOffline(false);
  expect(errors.filter(e => !/Failed to fetch|NetworkError|Load failed|network/i.test(e))).toEqual([]);
});
