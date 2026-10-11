import { test, expect } from './fixtures.ts';
import type { Page } from '@playwright/test';

// v120 Âm thanh thu sẵn A1–B1 (a/c/<khoá>.mp3): máy không có giọng đọc (ví dụ trình duyệt trong Zalo / Messenger) vẫn nghe được câu
// có tệp; câu không có tệp thì hiện chữ như trước (không bao giờ có câu nghe "câm" mà giấu chữ). Máy có giọng đọc: câu có tệp phát tệp.
/* eslint-disable @typescript-eslint/no-explicit-any */
test.use({ future: false });

// Ghi lại tệp được phát thay vì phát thật (máy CI không có loa); play() trả về như phát xong ngay.
async function spy(page: Page, noTts: boolean): Promise<void> {
  await page.addInitScript((no: boolean) => {
    const w = window as any;
    if (no) { try { delete w.speechSynthesis; } catch { /* bỏ qua */ } w.speechSynthesis = undefined; w.SpeechSynthesisUtterance = undefined; }
    w.__played = [] as string[];
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) { w.__played.push(this.getAttribute('src') || this.src); setTimeout(() => this.dispatchEvent(new Event('ended')), 10); return Promise.resolve(); };
  }, noTts);
}
const ready = (page: Page) => page.waitForFunction(() => (window as any).ELREADY === true && (window as any).eval('CLIPS') !== null, null, { timeout: 30000 });

test('Không có giọng đọc: Pre-A1 nghe được bằng tệp thu sẵn; câu không có tệp (số điện thoại) hiện chữ', async ({ page, errors }) => {
  await spy(page, true);
  await page.goto('/');
  await ready(page);
  const r = await page.evaluate(() => {
    const w = window as any;
    const tts = w.eval('HAS_TTS'), items = w.eval("paItems('pa-phon')") as any[], spell = w.eval("paItems('pa-spell')") as any[];
    const phone = spell.find(x => x.t === 'typed' && /^\d+$/.test(x.accept[0]));
    return { tts, heard: items.filter(x => x.say).length, n: items.length, phoneSay: phone?.say ?? null, phoneShown: !!phone && phone.q.includes('lang="en"') };
  });
  expect(r.tts).toBe(false);
  expect(r.heard).toBe(r.n);                      // mọi câu của bài phonics có tệp
  expect(r.phoneSay).toBeNull();                  // số điện thoại ngẫu nhiên không có tệp → không "nghe"
  expect(r.phoneShown).toBe(true);                //   … mà hiện chữ để đọc
  await page.evaluate(() => (window as any).eval("say('cat.')"));
  const k = await page.evaluate(() => (window as any).eval("clipKey('cat')"));
  await expect.poll(() => page.evaluate(() => (window as any).__played)).toContain(`a/c/${k}.mp3`);
  expect(errors).toEqual([]);
});

test('Hội thoại A1 hai giọng: phát lần lượt tệp giọng A và giọng B; máy có giọng đọc cũng ưu tiên tệp thu sẵn', async ({ page, errors }) => {
  await spy(page, false);
  await page.goto('/');
  await ready(page);
  const want: string[] = await page.evaluate(() => {
    const w = window as any, d = w.eval('DIALOGUES').find((x: any) => x.lv === 'A1');
    w.eval('sayLines')(d.lines.slice(0, 3), false);
    return d.lines.slice(0, 3).map((l: any) => `a/c/${w.eval('clipKey')(l.t, l.s === 'B' ? 1 : 0)}.mp3`);
  });
  await expect.poll(() => page.evaluate(() => (window as any).__played), { timeout: 5000 }).toEqual(want);
  expect(want.some(f => f.startsWith('a/c/b'))).toBe(true);   // có câu của người B (giọng thứ hai)
  // Mọi tệp trong danh mục đều có trên máy chủ (không có khoá "ma").
  const miss = await page.evaluate(async () => {
    const keys = [...(window as any).eval('CLIPS')] as string[], pick = keys.filter((_, i) => i % 400 === 0);
    const r = await Promise.all(pick.map(k => fetch(`a/c/${k}.mp3`, { method: 'HEAD' }).then(x => x.ok ? '' : k)));
    return { n: keys.length, miss: r.filter(Boolean) };
  });
  expect(miss.n).toBeGreaterThan(5000);
  // Tệp giải mã được thật (không chỉ tồn tại): MP3 24 kHz mono, dài hợp lý.
  const dec = await page.evaluate(async () => {
    const w = window as any, buf = await (await fetch(`a/c/${w.eval('clipKey')('cat')}.mp3`)).arrayBuffer();
    const a = await new OfflineAudioContext(1, 1, 24000).decodeAudioData(buf);
    return { sec: a.duration, ch: a.numberOfChannels };
  });
  expect(dec.ch).toBe(1);
  expect(dec.sec).toBeGreaterThan(0.3);
  expect(dec.sec).toBeLessThan(3);
  expect(miss.miss).toEqual([]);
  expect(errors).toEqual([]);
});
