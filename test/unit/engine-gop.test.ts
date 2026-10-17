import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toModelPhones, ctcAlign, logSoftmax, score, greedy, loudness, type GopPhone , fixOf } from '../../src/engine/gop.ts';
import { noteOf } from '../../src/engine/pronote.ts';
import { corpus } from '../../tools/pronote-cov.ts';

// v146 chấm từng âm (thử nghiệm): căn hàng CTC + GOP trên ma trận xác suất giả, không cần mô hình thật.
// Bộ âm giả theo kiểu espeak (en-us) của mô hình wav2vec2-lv-60-espeak-cv-ft.
const TOKS = ['<pad>', 's', 'ʃ', 'iː', 'h', 'æ', 'z', 'f', 'ɔː', 'ɹ', 'ɐ', 'n', 'oʊ', 'ɛ', 't', 'k', 'ɪ', 'ə', 'i', 'eɪ', 'aɪ', 'm', 'l', 'd', 'ð', 'θ', 'w', 'b', 'p', 'v', 'ŋ', 'ɡ', 'j', 'ʌ', 'ʊ', 'uː', 'ɑː', 'aʊ', 'tʃ', 'dʒ', 'ɜː', 'ɔɪ', 'ɚ', 'ɾ', 'ʒ', 'ᵻ', 'u', 'ɑ', 'ɔ', 'ɝ', 'oː', 'a', 'e', 'o', 'r', 'x', 'ç', 'ʔ', 'ɬ', 'ɕ', 'ʑ', 'ɲ', 'ɟ', 'c', 'ɣ', 'β'];
const VOC = Object.fromEntries(TOKS.map((t, i) => [t, i])) as Record<string, number>;
const V = TOKS.length, BLANK = 0;
// Ma trận logits: mỗi âm `spoken` chiếm 3 khung (âm mạnh), xen 1 khung khoảng lặng.
function frames(spoken: number[]): { data: Float32Array; T: number } {
  const T = spoken.length * 4 + 1, data = new Float32Array(T * V);
  for (let t = 0; t < T; t++) { const k = Math.floor(t / 4), on = t % 4 !== 0 && k < spoken.length; data[t * V + (on ? spoken[k]! : BLANK)] = 8; }
  return { data, T };
}
const phonesOf = (ws: string[]): GopPhone[] => ws.flatMap((ipa, w) => toModelPhones(ipa, VOC).map(p => ({ ...p, w })));

test('v146 đổi phiên âm kiểu Anh sang bộ âm espeak: r → ɹ, əʊ → oʊ, e → ɛ; âm không có thì báo thiếu', () => {
  assert.deepEqual(toModelPhones('ˈreɪn', VOC).map(p => TOKS[p.tok]), ['ɹ', 'eɪ', 'n']);
  assert.deepEqual(toModelPhones('nəʊ', VOC).map(p => TOKS[p.tok]), ['n', 'oʊ']);
  assert.deepEqual(toModelPhones('bed', VOC).map(p => TOKS[p.tok]), ['b', 'ɛ', 'd']);
  const miss = new Set<string>(); toModelPhones('q', VOC, miss); assert.ok(miss.has('q'));
});

test('v146 căn hàng CTC: mỗi âm nằm đúng khung của nó; âm thanh quá ngắn thì không căn', () => {
  const tgt = [VOC['s']!, VOC['iː']!], { data, T } = frames(tgt), lp = logSoftmax(data, T, V);
  assert.deepEqual(ctcAlign(lp, T, V, tgt, BLANK), [[1, 3], [5, 7]]);
  assert.equal(ctcAlign(lp, 1, V, tgt, BLANK), null);
});

test('v146 chấm: nói đúng → mọi âm ≥ 80; /s/ nói thành /ʃ/ → âm đó thấp, "nghe gần như ʃ"; bỏ âm cuối → thiếu', () => {
  const words = ['see', 'his'], ph = phonesOf(['siː', 'hɪz']);
  const ok = frames(ph.map(p => p.tok)), r = score(ok.data, ok.T, V, ph, words, TOKS, BLANK)!;
  assert.ok(r.words.every(w => w.phones.every(p => p.score >= 80)), JSON.stringify(r.words));
  assert.ok(r.score >= 80);
  const bad = frames(ph.map(p => (TOKS[p.tok] === 's' ? VOC['ʃ']! : p.tok))), rb = score(bad.data, bad.T, V, ph, words, TOKS, BLANK)!;
  const s = rb.words[0]!.phones[0]!; assert.ok(s.score < 40, String(s.score)); assert.equal(s.heard, 'ʃ');
  assert.ok(rb.words[1]!.score >= 80, 'từ thứ hai vẫn đúng'); assert.ok(rb.words[0]!.score < 60, 'một âm sai thì từ không còn xanh');
  const drop = frames(ph.slice(0, -1).map(p => p.tok)), rd = score(drop.data, drop.T, V, ph, words, TOKS, BLANK)!;
  const z = rd.words[1]!.phones.at(-1)!; assert.ok(z.score < 30 && z.missing, JSON.stringify(z));
});

test('v146 bộ âm phủ đủ âm của câu A1–A2 (dùng phiên âm thật của app)', () => {
  const c = corpus(), miss = new Set<string>();
  for (const l of [...c.dlg, ...c.read.slice(0, 300)]) for (const t of noteOf(l, c.ipaOf).toks) if (t.ipa) toModelPhones(t.ipa, VOC, miss);
  assert.deepEqual([...miss], []);
});

// Kiểu CTC thật: mỗi âm chỉ bật 1 khung, giữa là 3 khung lặng; khung bật cũng còn chút xác suất lặng.
function spiky(spoken: number[]): { data: Float32Array; T: number } {
  const T = spoken.length * 4 + 2, data = new Float32Array(T * V);
  for (let t = 0; t < T; t++) { const k = Math.floor((t - 1) / 4), on = t >= 1 && (t - 1) % 4 === 1 && k < spoken.length; data[t * V + BLANK] = on ? 3 : 8; if (on) data[t * V + spoken[k]!] = 7; }
  return { data, T };
}
test('v147 chấm kiểu CTC thật (âm bật 1 khung): nói đúng vẫn ≥ 80; nói sai một âm thì âm đó thấp; bỏ âm cuối thì thiếu', () => {
  const words = ['see', 'his'], ph = phonesOf(['siː', 'hɪz']);
  const ok = spiky(ph.map(p => p.tok)), r = score(ok.data, ok.T, V, ph, words, TOKS, BLANK)!;
  assert.ok(r.words.every(w => w.phones.every(p => p.score >= 80)), JSON.stringify(r.words.map(w => w.phones.map(p => p.score))));
  const bad = spiky(ph.map(p => (TOKS[p.tok] === 's' ? VOC['ʃ']! : p.tok))), rb = score(bad.data, bad.T, V, ph, words, TOKS, BLANK)!;
  const s = rb.words[0]!.phones[0]!; assert.ok(s.score < 40, String(s.score)); assert.equal(s.heard, 'ʃ');
  const drop = spiky(ph.slice(0, -1).map(p => p.tok)), rd = score(drop.data, drop.T, V, ph, words, TOKS, BLANK)!;
  assert.ok(rd.words[1]!.phones.at(-1)!.missing, JSON.stringify(rd.words[1]!.phones.at(-1)));
});
test('v147 đọc tham lam ra chuỗi âm máy nghe; âm lượng: im lặng thì không có tiếng', () => {
  const ph = phonesOf(['siː', 'hɪz']), { data, T } = spiky(ph.map(p => p.tok));
  assert.equal(greedy(data, T, V, TOKS, BLANK), 'siːhɪz');
  assert.equal(loudness(new Float32Array(16000)).voiced, 0);
  const tone = Float32Array.from({ length: 16000 }, (_, i) => 0.3 * Math.sin(i / 5));
  assert.ok(loudness(tone).voiced > 0.9 && loudness(tone).rms > 0.1);
});

test('v150 fixOf: âm kém → bộ cặp âm có lời dạy (âm cuối, cặp hay nhầm, nguyên âm dài / ngắn)', () => {
  assert.equal(fixOf('s', 'ʃ', false, false), 's-07');
  assert.equal(fixOf('θ', 's', false, false), 's-22'); assert.equal(fixOf('θ', 't', false, false), 's-05');
  assert.equal(fixOf('z', null, true, true), 's-11'); assert.equal(fixOf('t', null, true, true), 's-10');
  assert.equal(fixOf('k', null, false, true), 's-19'); assert.equal(fixOf('ŋ', 'n', false, true), 's-25');
  assert.equal(fixOf('l', null, true, true), 's-12', 'âm cuối khác bị nuốt → bài giữ âm cuối');
  assert.equal(fixOf('iː', 'ɪ', false, false), 's-01'); assert.equal(fixOf('ʌ', 'æ', false, false), 's-15');
  assert.equal(fixOf('h', null, false, false), null);
});
