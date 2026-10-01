import { readFileSync } from 'node:fs';
import { test, expect, openApp } from './fixtures.ts';

// Đi qua mọi màn mở thẳng được trong bảng điều hướng của app.js và các hàm tạo dữ liệu (báo cáo, dữ liệu ẩn danh, mã sao lưu):
// không màn nào rơi vào "Có lỗi khi mở màn này", không có lỗi JavaScript. Bắt lỗi kiểu xoá hàm còn được gọi.
const src = readFileSync(new URL('../../app.js', import.meta.url), 'utf8');
const m = /const v=\{(thi:viewThi[^}]*)\}\[ui\.view\]/.exec(src);
const ALL = m?.[1] ? m[1].split(',').map(p => p.split(':')[0]!.trim()) : [];
// Màn cần ngữ cảnh (một unit, một lượt luyện, một đề cụ thể…): luôn mở qua hành động riêng, không mở thẳng.
const CONTEXT = new Set(['shadow', 'exam', 'wtask', 'stask', 'lread', 'dlg', 'fn', 'quiz', 'rp', 'story1', 'game', 'word', 'sound', 'unit',
  'learn', 'session', 'summary', 'gpoint', 'gsess', 'gsum', 'read', 'speak', 'write']);
const VIEWS = ALL.filter(v => !CONTEXT.has(v));

test('mọi màn mở được, không lỗi', async ({ page, errors }) => {
  test.skip(test.info().project.name !== 'desktop-chrome', 'một trình duyệt là đủ cho bài quét này');
  expect(VIEWS.length).toBeGreaterThan(20);
  await openApp(page);
  // chờ chi tiết bài học các cấp tải xong để màn nào cũng có dữ liệu
  await expect.poll(() => page.evaluate(() => (window as any).eval('detailAll()')), { timeout: 30000 }).toBe(true);
  const bad: string[] = [];
  for (const v of VIEWS) {
    const err = await page.evaluate(v => { try { (window as any).eval(`go(${JSON.stringify(v)})`); return ''; } catch (e) { return String(e); } }, v);
    const t = await page.locator('#app').innerText();
    if (err || /Có lỗi khi mở màn này/.test(t)) bad.push(`${v}${err ? ': ' + err : ''}`);
    await page.evaluate(() => { try { (window as any).eval('closeModal()'); } catch { /* không có hộp thoại */ } });
  }
  expect(bad, 'màn bị lỗi').toEqual([]);
  const ok = await page.evaluate(async () => {
    const w = window as any;
    const r = w.eval('researchData()'); const rep = w.eval('reportHtml()'); const code = await w.eval('makeCode()');
    return !!r.kind && rep.length > 1000 && /^VL[12]:/.test(code);
  });
  expect(ok).toBe(true);
  expect(errors).toEqual([]);
});
