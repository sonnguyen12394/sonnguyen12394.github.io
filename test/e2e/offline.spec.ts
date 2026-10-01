import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect, navTo } from './fixtures.ts';

// Mất mạng thật cho mọi trình duyệt (kể cả Safari iOS/WebKit): bài test tự chạy một máy chủ riêng, nạp app,
// chờ service worker lưu xong, rồi TẮT HẲN máy chủ trước khi tải lại. App phải mở được từ bộ nhớ đệm.
const SERVE = fileURLToPath(new URL('../../tools/serve.mjs', import.meta.url));

test('mở lại khi mất mạng: app và tab Ôn thi vẫn chạy', async ({ page, errors }, info) => {
  const port = 8110 + info.parallelIndex + 3 * ['android-chrome', 'desktop-chrome', 'ios-safari'].indexOf(info.project.name);
  const base = `http://localhost:${port}/`;
  let srv: ChildProcess | null = spawn(process.execPath, [SERVE, String(port)], { stdio: 'ignore' });
  try {
    await expect.poll(async () => { try { return (await fetch(base)).ok; } catch { return false; } }).toBe(true);
    await page.goto(base);
    const start = page.getByRole('button', { name: 'Bắt đầu ôn thi' });
    await start.click();
    await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    const cached = await page.evaluate(async () => {
      const urls: string[] = [];
      for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys()) urls.push(new URL(r.url).pathname);
      return urls;
    });
    expect(cached.some(u => /\/index\.html$|\/$/.test(u))).toBe(true);
    expect(cached.some(u => /\/app\.js$/.test(u))).toBe(true);
    expect(cached.some(u => /\/x\/exam\.[0-9a-f]{10}\.js$/.test(u))).toBe(true);
    srv.kill(); srv = null;
    await expect.poll(async () => { try { await fetch(base); return 'up'; } catch { return 'down'; } }).toBe('down');
    await page.reload();
    await expect(page.locator('#bnav button:visible, #nav button:visible').first()).toBeVisible();
    await navTo(page, 'Ôn thi');
    await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  } finally { srv?.kill(); }
  expect(errors.filter(e => !/Failed to fetch|NetworkError|Load failed|network|internet|ERR_CONNECTION|Could not connect/i.test(e))).toEqual([]);
});
