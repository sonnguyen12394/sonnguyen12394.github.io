import { spawn, type ChildProcess } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { test, expect, navTo } from './fixtures.ts';

// Mất mạng thật: bài test tự chạy một máy chủ riêng, nạp app, chờ service worker lưu xong, rồi TẮT HẲN máy chủ.
// Chrome (Android, máy tính): tải lại trang, app phải mở được hoàn toàn từ bộ nhớ đệm.
// WebKit (Safari iOS): bản WebKit dựng sẵn của Playwright trên Linux bị sập khi tải lại trang lúc máy chủ đã tắt, nên kiểm
// service worker trả đủ từng tệp lõi (trang, app.js, mô-đun ôn thi) khi không có mạng — đúng phần app cần để mở offline.
const SERVE = fileURLToPath(new URL('../../tools/serve.mjs', import.meta.url));

test('mở lại khi mất mạng: app và tab Ôn thi vẫn chạy', async ({ page, errors, browserName }, info) => {
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
    if (browserName === 'webkit') {
      const got = await page.evaluate(async () => {
        const urls: string[] = [], out: Record<string, number> = {};
        for (const k of await caches.keys()) for (const r of await (await caches.open(k)).keys())
          if (/\/(index\.html)?$|\/app\.js|\/x\/exam\./.test(new URL(r.url).pathname)) urls.push(r.url);
        for (const u of urls) { try { const r = await fetch(u); out[u] = r.ok ? (await r.text()).length : -r.status; } catch { out[u] = -1; } }
        return out;
      });
      expect(Object.keys(got).length).toBeGreaterThanOrEqual(3);
      for (const [u, n] of Object.entries(got)) expect(n, `service worker trả ${u} khi mất mạng`).toBeGreaterThan(1000);
      return;
    }
    await page.reload();
    await expect(page.locator('#bnav button:visible, #nav button:visible').first()).toBeVisible();
    await navTo(page, 'Ôn thi');
    await expect(page.getByRole('heading', { name: 'Bạn ôn thi gì?' })).toBeVisible();
  } finally { srv?.kill(); }
  expect(errors.filter(e => !/Failed to fetch|NetworkError|Load failed|network|internet|ERR_CONNECTION|Could not connect/i.test(e))).toEqual([]);
});
