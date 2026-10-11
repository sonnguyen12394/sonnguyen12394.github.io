import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roteStat, roteNodes, ROTE } from '../../src/engine/rote.ts';
import { freshEv } from '../../src/engine/ev/store.ts';
import { direct, planDay, type DirIn } from '../../src/engine/director.ts';
import type { Agg } from '../../src/engine/ev/types.ts';

const agg = (n: number, ok: number, nov = 0): Agg => ({ n, sw: n, swOk: ok, swgOk: 0, swBad: n - ok, nov: nov ? n : 0, asst: 0, novOk: nov ? ok : 0, d0: 1, d1: 2 });
function ev(cells: Record<string, Record<string, Agg>>) { const s = freshEv(); s.agg = { d1: cells }; return s; }

test('v111 đèn học tủ: đúng câu cũ 90%, câu lạ 33% → bật; đủ lượt mới kết luận; mỗi nút chỉ đọc một mức', () => {
  const s = ev({
    'u:food|2': { 'game|mcq|0|0': agg(10, 9), 'transfer|mcq|1|0': agg(6, 2, 1) },
    'u:food|1': { 'game|mcq|0|0': agg(3, 3) },                                   // mức có ít lượt hơn: bỏ qua
    'u:home|2': { 'game|mcq|0|0': agg(10, 9), 'game|mcq|1|0': agg(6, 5, 1) },  // câu lạ cũng đúng: không học tủ
    'g:be|3': { 'game|order|0|0': agg(10, 10), 'game|order|1|0': agg(2, 0, 1) }, // câu lạ quá ít: chưa kết luận
  });
  const f = roteStat(s, 'u:food')!;
  assert.equal(f.lv, 2); assert.ok(Math.abs(f.gap - (0.9 - 2 / 6)) < 1e-9);
  assert.ok(roteStat(s, 'u:home')!.gap < ROTE.gap);
  assert.equal(roteStat(s, 'g:be'), null);
  assert.deepEqual(roteNodes(s, ['u:food', 'u:home', 'g:be', 'u:none']).map(x => x.node), ['u:food']);
});

const base = (x: Partial<DirIn> = {}): DirIn => ({
  placed: true, fogWait: 3, claims: 0, top: { kind: 'learn', node: 'g:be', vi: 'be' }, review: 0, first: { u: 'Chào', g: 'be' }, neck: null,
  gWrong: false, fnSeen: false, cd: { R: { vi: 'đọc', gap: 1 }, W: { vi: 'viết', gap: 1 }, S: { vi: 'nói', gap: 1 } }, lv: 'A1', garden: 0, puzzleToday: false, played: [], last: '', tts: true, asr: true, ...x,
});
const SK = ['read', 'listen', 'write', 'speak'];

test('v111 bộ não: có phần học tủ → tháp (câu mới) được ưu tiên; từ A2 lộ trình được 2 chặng kỹ năng, A1 vẫn 1', () => {
  const t = direct(base({ rote: 3 })).find(p => p.game === 'tower')!;
  assert.equal(t.need, 'check'); assert.match(t.why, /câu lạ/);
  assert.ok(t.score > (direct(base()).find(p => p.game === 'tower')?.score ?? 0));
  assert.equal(planDay(base()).filter(p => SK.includes(p.need)).length, 1);
  const a2 = planDay(base({ lv: 'A2' }));
  assert.equal(a2.filter(p => SK.includes(p.need)).length, 2);
  assert.ok(a2.some(p => !SK.includes(p.need)), 'vẫn còn một chặng nền');
});

// v111 bot "học vẹt" (SCORECARD K1): đi qua đúng đường ghi bằng chứng thật (ingest → L2). Bot vẹt đúng mọi câu ĐÃ GẶP, đoán bừa
// (1/3) ở câu lạ; bot học thật đúng ~85% ở cả hai. Đèn học tủ phải bật với bot vẹt và tắt với bot học thật.
import { ingest } from '../../src/engine/ev/store.ts';
function play(parrot: boolean, seed = 7) {
  let s = seed; const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const st = freshEv(), m = {};
  for (let day = 1; day <= 10; day++) for (let k = 0; k < 12; k++) {
    const item = `i${k % 4}`, seenBefore = day > 1;            // 4 câu luyện đi luyện lại
    const ok = parrot ? (seenBefore ? true : rnd() < 1 / 3) : rnd() < 0.85;
    ingest(st, m, { node: 'u:food', level: 2, ok, g: 1 / 3, item, qt: 'mcq', ctx: 'game' }, { dev: 'bot001', ts: day * 1e5 + k, day });
  }
  for (let k = 0; k < 8; k++) {                                // câu lạ (transfer)
    const ok = parrot ? rnd() < 1 / 3 : rnd() < 0.85;
    ingest(st, m, { node: 'u:food', level: 2, ok, g: 1 / 3, item: `new${k}`, qt: 'mcq', ctx: 'transfer' }, { dev: 'bot001', ts: 2e6 + k, day: 11 });
  }
  return roteNodes(st, ['u:food']).length;
}
test('v111 bot học vẹt: đèn học tủ bật với bot vẹt, tắt với bot học thật', () => {
  assert.equal(play(true), 1);
  assert.equal(play(false), 0);
});
