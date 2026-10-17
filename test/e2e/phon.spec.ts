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
  return page.evaluate(() => { const w = window as any, st = w.eval('st'); st.onboarded = true; w.eval('save()'); w.eval("go('nd')"); return st.e.ev.led.length; });
}

for (const scheme of ['light', 'dark'] as const) {
  test(`🗣 Nói & Đọc → 🧪 chấm từng âm: tải mô hình, chấm câu, từ tô màu theo điểm, bấm từ thấy từng âm và "nghe gần như"; WCAG AA (${scheme}), 390 px`, async ({ page, errors }) => {
    await page.emulateMedia({ colorScheme: scheme });
    const led0 = await open(page);
    await page.locator('#app details.ndph summary').click();
    await page.locator('#app [data-go="phon"]').click();
    await expect(page.getByRole('heading', { name: 'Chấm từng âm trên máy' })).toBeVisible();
    await expect(page.locator('#app')).toContainText('vài trăm MB');
    await page.locator('[data-act="phload"]').click();
    await expect(page.locator('#app')).toContainText('Đã sẵn sàng');
    await page.evaluate(() => (window as any).eval('phGo')(Float32Array.from({ length: 32000 }, (_, i) => 0.3 * Math.sin(i / 5))));
    await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toBeVisible();
    const seasons = page.locator('.phd', { hasText: 'seasons' });
    await expect(seasons.locator('summary')).toHaveClass(/phw (a|r)/);
    await expect(page.locator('.phd', { hasText: 'four' }).locator('summary')).toHaveClass(/phw g/);
    await seasons.locator('summary').click();
    await expect(seasons).toContainText('nghe gần như /ʃ/');
    // v150 Sửa thế nào: âm /s/ nói thành /ʃ/ → lời dạy của bộ cặp /ʃ/ – /s/ + nút luyện cặp + nghe từ
    await expect(page.locator('.phfix')).toContainText('seasons');
    await expect(page.locator('.phfix [data-snd="s-07"]')).toBeVisible();
    await expect(page.locator('#app')).toContainText('chấm 456 ms');
    await expect(page.locator('#app')).toContainText('Máy nghe ra các âm');
    await expect(page.locator('#app')).toContainText('có tiếng 100%');
    await noHorizontalScroll(page);
    const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
    expect(r.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).slice(0, 3).join(' | ')}`)).toEqual([]);
    // v151 chấm từng âm được tính (nguồn Nói & Đọc): âm /s/ nói thành /ʃ/ → bằng chứng sai ở ph:s-07; mọi bằng chứng mới có ngữ cảnh nd-phon
    const evs = await page.evaluate((n: number) => (window as any).eval('st').e.ev.led.slice(n), led0);
    expect(evs.length).toBeGreaterThan(0);
    expect(evs.every((e: any) => e.ctx === 'nd-phon')).toBe(true);
    expect(evs.some((e: any) => e.node === 'ph:s-07' && !e.ok)).toBe(true);
    expect(errors).toEqual([]);
  });
}

test('v147 im lặng thì không chấm, báo rõ; fp16 có cảnh báo cho iPhone', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("go('phon')"));
  await page.locator('[data-act="phdt"][data-v="fp16"]').click();
  await expect(page.locator('#app')).toContainText('dành cho bản app');
  await expect(page.locator('#app .fb.bad')).toContainText('600 MB');
  await page.locator('[data-act="phdt"][data-v="q8"]').click();
  await page.locator('[data-act="phload"]').click();
  await expect(page.locator('#app')).toContainText('Đã sẵn sàng');
  await page.evaluate(() => (window as any).eval('phGo')(new Float32Array(32000)));
  await expect(page.locator('#app .fb.bad')).toContainText('chưa nghe thấy tiếng');
  await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toHaveCount(0);
  expect(errors).toEqual([]);
});

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

// v148 hai mô hình cùng lúc: micro giả + MediaRecorder giả cho mô hình chấm âm, máy nhận diện chữ giả của trình duyệt cho chữ hiện ngay.
async function openLive(page: Page, asrOk: boolean): Promise<number> {
  await page.addInitScript(() => {
    const w = window as any; w.__asr = []; w.__order = [];
    w.webkitSpeechRecognition = class { constructor() { w.__asr.push(this); } start() { w.__order.push('asr'); } stop() { (this as any).stopped = true; } abort() {} };
    w.SpeechRecognition = undefined;
    Object.defineProperty(navigator, 'mediaDevices', { value: { getUserMedia: async () => { w.__order.push('mic'); return { getTracks: () => [{ stop() {} }] }; } } });
    w.MediaRecorder = class { state = 'inactive'; mimeType = 'audio/mp4'; ondataavailable: any; onstop: any;
      start() { this.state = 'recording'; } stop() { this.state = 'inactive'; setTimeout(() => this.onstop && this.onstop(), 10); } };
  });
  const led0 = await open(page);
  await page.evaluate((ok: boolean) => { const w = window as any; w.eval('st').set.asr = ok; w.eval('save()');
    w.eval("phDecode = function(){ PH.dur = 2; phGo(Float32Array.from({ length: 32000 }, (_, i) => 0.3 * Math.sin(i / 5))); }"); w.eval("go('phon')"); }, asrOk);
  await page.locator('[data-act="phload"]').click();
  await expect(page.locator('#app')).toContainText('Đã sẵn sàng');
  return led0;
}
const emit = (page: Page, text: string, final: boolean) => page.evaluate(([t, f]) => {
  const w = window as any, r = w.__asr[w.__asr.length - 1]; r.onresult({ results: [Object.assign([{ transcript: t }], { isFinal: f })] });
}, [text, final] as const);

test('v148 đang nói: chữ hiện ngay (micro mở trước nhận diện); dừng thì có "Máy nghe ra n/m từ" rồi điểm từng âm; không đếm', async ({ page, errors }) => {
  const led0 = await openLive(page, true), ev0 = await page.evaluate(() => JSON.stringify((window as any).eval('st').ev?.c || {}));
  await page.locator('[data-act="phrec"]').click();
  await expect(page.locator('#asrlive')).toHaveText('…');
  expect(await page.evaluate(() => (window as any).__order)).toEqual(['mic', 'asr']);
  await emit(page, 'hanoi has four', false);
  await expect(page.locator('#asrlive')).toHaveText('hanoi has four');
  await page.locator('[data-act="phrec"]').click();
  expect(await page.evaluate(() => (window as any).__asr[0].stopped)).toBe(true);
  await emit(page, 'hanoi has four seasons', true);
  await expect(page.locator('#app')).toContainText('Máy nghe ra 4/4 từ');
  await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toBeVisible();
  await expect(page.locator('#app')).toContainText('chữ: bật, nghe 100%');
  expect(await page.evaluate(() => JSON.stringify((window as any).eval('st').ev?.c || {}))).toBe(ev0);
  expect(await page.evaluate((n: number) => (window as any).eval('st').e.ev.led.slice(n).every((e: any) => e.ctx === 'nd-phon'), led0)).toBe(true);
  const r = await new AxeBuilder({ page }).include('#app').withTags(AXE).analyze();
  expect(r.violations.map(v => v.id)).toEqual([]);
  expect(errors).toEqual([]);
});

test('v148 nhận diện chữ lỗi (iPhone giành micro) thì vẫn chấm âm, báo mã lỗi; tắt "Hiện chữ khi nói" thì không bật nhận diện', async ({ page, errors }) => {
  await openLive(page, true);
  await page.locator('[data-act="phrec"]').click();
  await page.evaluate(() => { const w = window as any; w.__asr[0].onerror({ error: 'audio-capture' }); });
  await page.locator('[data-act="phrec"]').click();
  await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toBeVisible();
  await expect(page.locator('#app')).toContainText('Chữ không hiện được lần này (audio-capture)');
  await expect(page.locator('#app')).toContainText('chữ: lỗi audio-capture');
  await page.locator('[data-act="phlive"]').click();
  await expect(page.locator('[data-act="phlive"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('[data-act="phrec"]').click();
  await page.locator('[data-act="phrec"]').click();
  await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__asr.length)).toBe(1);
  await expect(page.locator('#app')).toContainText('chữ: tắt');
  expect(errors).toEqual([]);
});

test('v148 chưa đồng ý máy nghe giọng: bấm ghi thì hỏi trước; đồng ý thì ghi luôn kèm chữ', async ({ page, errors }) => {
  await openLive(page, false);
  await page.locator('[data-act="phrec"]').click();
  await expect(page.locator('[data-act="asrok"]')).toBeVisible();
  await page.locator('[data-act="asrok"]').click();
  await expect(page.locator('#asrlive')).toBeVisible();
  expect(await page.evaluate(() => (window as any).__order)).toEqual(['mic', 'asr']);
  expect(errors).toEqual([]);
});

test('v148 như ELSA web: nhận diện tự tắt khi ngừng nhịp thì tự bật lại, chữ cộng dồn chạy suốt; bấm Dừng mới chấm cả câu', async ({ page, errors }) => {
  await openLive(page, true);
  await page.locator('[data-act="phrec"]').click();
  await emit(page, 'hanoi has', false);
  await page.evaluate(() => { const w = window as any; w.__asr[0].onend(); });
  expect(await page.evaluate(() => (window as any).__asr.length)).toBe(2);
  await expect(page.locator('#asrlive')).toHaveText('hanoi has');
  await expect(page.locator('#app .fb strong', { hasText: 'Máy nghe ra' })).toHaveCount(0);
  await emit(page, 'four seasons', false);
  await expect(page.locator('#asrlive')).toHaveText('hanoi has four seasons');
  await page.locator('[data-act="phrec"]').click();
  await page.evaluate(() => { const w = window as any; w.__asr[1].onend(); });
  await expect(page.locator('#app')).toContainText('Máy nghe ra 4/4 từ');
  await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__asr.length)).toBe(2);
  expect(errors).toEqual([]);
});

test('v150 câu ngẫu nhiên theo cấp × bậc; câu tiếp theo trong cùng bài', async ({ page, errors }) => {
  await open(page);
  await page.evaluate(() => (window as any).eval("go('phon')"));
  await page.locator('[data-act="phtier"][data-v="1"]').click();
  const s1 = await page.locator('#phsent').inputValue();
  expect(s1).not.toBe('Hanoi has four seasons.');
  expect((s1.match(/[A-Za-z0-9'’-]+/g) || []).length).toBeLessThanOrEqual(10);
  await page.locator('[data-act="phlv"][data-v="A2"]').click();
  await expect(page.locator('[data-act="phlv"][data-v="A2"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-act="phload"]').click();
  await expect(page.locator('#app')).toContainText('Đã sẵn sàng');
  await page.evaluate(() => (window as any).eval('phGo')(Float32Array.from({ length: 32000 }, (_, i) => 0.3 * Math.sin(i / 5))));
  const before = await page.locator('#phsent').inputValue();
  await page.locator('[data-act="phnext"]').click();
  await expect(page.locator('#phsent')).not.toHaveValue(before);
  await expect(page.locator('#app .fb strong', { hasText: 'Điểm phát âm' })).toHaveCount(0);
  expect(errors).toEqual([]);
});
