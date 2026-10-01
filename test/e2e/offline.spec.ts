import { test, expect, openApp, navTo } from './fixtures.ts';

// Mở lại khi mất mạng. Chrome: ngắt mạng thật (context.setOffline). WebKit (Safari iOS): Playwright báo lỗi nội bộ khi tải lại trang
// lúc setOffline, nên chặn mọi request ra mạng bằng context.route thay thế, và kiểm thêm bộ nhớ đệm có đủ tệp lõi.
test('mở lại khi mất mạng: app và tab Ôn thi vẫn chạy', async ({ page, context, browserName, errors }) => {
  await openApp(page);
  await page.evaluate(async () => { await navigator.serviceWorker.ready; });
  await page.reload();
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
  // tệp lõi đã nằm trong bộ nhớ đệm của service worker
  const cached = await page.evaluate(async () => {
    const ks = await caches.keys(), urls: string[] = [];
    for (const k of ks) for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
    return urls;
  });
  expect(cached.some(u => /\/index\.html$|\/$/.test(u))).toBe(true);
  expect(cached.some(u => /\/app\.js$/.test(u))).toBe(true);
  expect(cached.some(u => /\/x\/exam\.[0-9a-f]{10}\.js$/.test(u))).toBe(true);
  if (browserName === 'webkit') await context.route(/^https?:\/\//, r => r.abort('internetdisconnected'));
  else await context.setOffline(true);
  await page.reload();
  await expect(page.locator('#bnav button:visible, #nav button:visible').first()).toBeVisible();
  await navTo(page, 'Ôn thi');
  await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  if (browserName !== 'webkit') await context.setOffline(false);
  expect(errors.filter(e => !/Failed to fetch|NetworkError|Load failed|network|internet/i.test(e))).toEqual([]);
});
