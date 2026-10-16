import AxeBuilder from '@axe-core/playwright';
import { test, expect, noHorizontalScroll } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v146 🧪 chấm từng âm trên máy (thử nghiệm): worker mô hình được thay bằng worker giả trả logits dựng từ âm mong đợi của câu
// (một âm bị nói sai), để kiểm phần chấm + hiện kiểu ELSA mà không tải mô hình thật (máy soạn / CI không vào được Hugging Face).
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });
const AXE = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const TOKS = ['<pad>', 's', 'ʃ', 'iː', 'h', 'æ', 'z', 'f', 'ɔː', 'ɹ', 'ɐ', 'n', 'oʊ', 'ɛ', 't', 'k', 'ɪ', 'ə', 'i', 'eɪ', 'aɪ', 'm', 'l', 'd', 'ð', 'θ', 'w', 'b', 'p', 'v', 'ŋ', 'ɡ', 'j', 'ʌ', 'ʊ', 'uː', 'ɑː', 'aʊ', 'tʃ', 'dʒ', 'ɜː'];

async function open(page: Page): Promise<number> {
  await page.addInitScript((toks: string[]) => {
    const w = window as any, Real = w.Worker;
    w.Worker = class { onmessage: any = null; onerror: any = null;
      constructor(url: string, o: any) { if (!String(url).includes('phon-worker')) return new Real(url, o); }
      terminate() {}
      postMessage(m: any) { setTimeout(() => {
        const vocab = Object.fromEntries(toks.map((t, i) => [t, i]));
        if (m.type === 'load') { this.onmessage({ data: { type: 'progress', loaded: 50 << 20, total: 300 << 20 } }); this.onmessage({ data: { type: 'ready', vocab, ms: 1234 } }); }
        if (m.type === 'run') {   // logits: mỗi âm mong đợi 3 khung + 1 khung lặng; âm /s/ đầu tiên của "seasons" bị nói thành /ʃ/
          const tg = w.eval('phTarget')(), seq = tg.phones.map((p: any, k: number) => (k === tg.phones.findIndex((q: any) => toks[q.tok] === 's') ? 2 : p.tok));
          const V = toks.length, T = seq.length * 4 + 1, data = new Float32Array(T * V);
          for (let t = 0; t < T; t++) { const k = Math.floor(t / 4), on = t % 4 !== 0 && k < seq.length; data[t * V + (on ? seq[k] : 0)] = 8; }
          this.onmessage({ data: { type: 'logits', dims: [1, T, V], data, ms: 456 } });
        } }, 30); } };
  }, TOKS);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).ELREADY === true);
  return page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); w.eval("go('more')"); return st.e.ev.led.length; });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`Tôi → 🧪 chấm từng âm: tải mô hình, chấm câu, từ tô màu theo điểm, bấm từ thấy từng âm và "nghe gần như"; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const led0 = await open(page);
    await page.locator('#app [data-go="phon"]').click();
    await expect(page.getByRole('heading', { name: 'Chấm từng âm trên máy' })).toBeVisible();
    await expect(page.locator('#app')).toContainText('vài trăm MB');
    await page.locator('[data-act="phload"]').click();
    await expect(page.locator('#app')).toContainText('Đã sẵn sàng');
    await page.evaluate(() => (window as any).eval('phRun')(new Float32Array(16000)));
    await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toBeVisible();
    const seasons = page.locator('.phd', { hasText: 'seasons' });
    await expect(seasons.locator('summary')).toHaveClass(/phw (a|r)/);
    await expect(page.locator('.phd', { hasText: 'four' }).locator('summary')).toHaveClass(/phw g/);
    await seasons.locator('summary').click();
    await expect(seasons).toContainText('nghe gần như /ʃ/');
    await expect(page.locator('#app')).toContainText('chấm 456 ms');
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    expect(await page.evaluate(() => (window as any).eval('st').e.ev.led.length)).toBe(led0);
    expect(errors).toEqual([]);
  });
}

test('đổi câu để chấm; xoá mô hình đưa về trạng thái chưa tải', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("go('phon')"));
  await page.locator('#phsent').fill('I like summer.');
  await page.locator('[data-act="phset"]').click();
  await expect(page.locator('#app .pn')).toContainText('summer');
  await page.locator('[data-act="phload"]').click();
  await page.locator('[data-act="phdel"]').click();
  await expect(page.locator('[data-act="phload"]')).toBeVisible();
  expect(errors).toEqual([]);
});
