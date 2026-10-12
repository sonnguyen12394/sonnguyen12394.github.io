import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hAdd, hScore, sanitizeH, mergeH, freshH, lin } from '../../src/engine/hmeter.ts';
import { askMatch, isQuestion, CASES, usesWord, turnCoins, thinkSec, portOrders, signOk, signsOf, realTask, pickConvs, pickOpts, sanitizeVoice, mergeVoice, freshVoice, type Conv } from '../../src/engine/voice.ts';
import { direct, type DirIn } from '../../src/engine/director.ts';
import { SPOTS, DECO } from '../../src/engine/town.ts';
import { sanitizeE, mergeE, freshE } from '../../src/engine/state.ts';

test('v122 Bảng đo H: chưa có số liệu → chỉ ước tính, không tiêu chí nào quá 6', () => {
  const h = hScore({ log: freshH(), led: [], today: 100, gate: 0, real: 0 });
  assert.equal(h.measured, 0);
  for (const r of h.rows) { assert.ok(r.score <= 6, `${r.id} ≤ 6 khi chưa đo`); assert.equal(r.measured, false); }
  assert.ok(h.total > 0 && h.total <= 6);
});

test('v122 Bảng đo H: số đo thật đổi ra điểm theo mốc §12.1 (H1 30% = 10, H5 ≤ 3 giây = 10, H6 nhớ 80% = 10)', () => {
  const log = freshH(), d = 100;
  for (let i = 0; i < 30; i++) hAdd(log, d, 'sp');
  for (let i = 0; i < 20; i++) hAdd(log, d, 'lat', 2.5);
  for (let i = 0; i < 10; i++) hAdd(log, d - 40, 'r30', i < 8);
  const led = Array.from({ length: 70 }, () => ({ qt: 'mcq', ctx: 'learn', ok: 1 as const, day: d, src: 'game' as const, nov: 0 as const }));
  const h = hScore({ log, led, today: d, gate: 1, real: 1 }), by = (id: string) => h.rows.find(r => r.id === id)!;
  assert.equal(by('H1').measured, true); assert.equal(by('H1').score, 10, '30 câu tự nói / 100 lượt = 30%');
  assert.equal(by('H5').score, 10);
  assert.equal(by('H6').score, 10); assert.match(by('H6').value, /≥ 30 ngày/);
  assert.equal(by('H9').score, 10);
  assert.equal(lin(5, 10, 3), Math.round((10 * 5) / 7 * 10) / 10, 'số nhỏ hơn tốt hơn (giây)');
});

test('v122 Bảng đo H: H10 tự báo cáo nên tối đa 7; nhật ký giữ 120 ngày, làm sạch, gộp hai máy không cộng trùng', () => {
  const log = freshH();
  for (let w = 0; w < 4; w++) hAdd(log, 100 - w * 7, 'rw');
  assert.equal(hScore({ log, led: [], today: 100, gate: 0, real: 0 }).rows.find(r => r.id === 'H10')!.score, 7);
  for (let i = 0; i < 130; i++) hAdd(log, 1000 + i, 'ty');
  assert.equal(Object.keys(log.d).length, 120);
  const x = sanitizeH({ d: { '5': { sp: -3, ty: 2, l4: [9, 3], lat: [10, 'x', -1] }, bad: { sp: 1 } } })!;
  assert.deepEqual(x.d['5'], { ty: 2, l4: [3, 3], lat: [10] });
  const a = freshH(), b = freshH(); hAdd(a, 7, 'sp', 3); hAdd(b, 7, 'sp', 5); hAdd(b, 8, 'xf', true);
  const m = mergeH(a, b)!; assert.equal(m.d['7']!.sp, 5); assert.deepEqual(m.d['8']!.xf, [1, 1]);
});

test('v125 Hỏi chuyện: chỉ câu HỎI có từ để hỏi + từ khoá mới mở manh mối; mọi vụ có đáp án và 4 manh mối', () => {
  const c = CASES.find(x => x.id === 'a1-bag')!;
  assert.equal(askMatch(c, 'Where did you lose it?')?.id, 'where');
  assert.equal(askMatch(c, 'what color is your bag')?.id, 'color', 'không có dấu hỏi (máy nghe giọng) vẫn nhận');
  assert.equal(askMatch(c, 'When did it happen?')?.id, 'when');
  assert.equal(askMatch(c, 'I lost my bag at the market.'), null, 'câu kể không phải câu hỏi');
  assert.ok(isQuestion('Excuse me, where is it')); assert.ok(!isQuestion('My bag is red'));
  for (const k of CASES) { assert.equal(k.facts.length, 4, k.id); assert.equal(k.sus.length, 3); assert.ok(k.ans >= 0 && k.ans < 3);
    for (const f of k.facts) { const q = f.q[0]!.split(' ').map(s => s.split('|')[0]).join(' ') + '?'; assert.ok(askMatch(k, q), `${k.id}/${f.id}: câu hỏi mẫu "${q}" phải mở được manh mối`); } }
  assert.deepEqual(new Set(CASES.map(c => c.lv)), new Set(['A1', 'A2', 'B1']));
});

test('v123 Quán bằng giọng: chọn khách đúng cấp, xu theo cách trả lời (nói / gõ > chọn), tip khi nghĩ kịp; món đặc biệt cần câu ≥ 4 từ có từ đó', () => {
  const mk = (id: string, lv: string): Conv => ({ id, lv, title: id, vi: id, who: 'Barista', k: 1, start: 'n1', n: { n1: { a: 'Hi?', v: '', h: '', m: 'A coffee, please.', end: false }, n2: { a: 'Hot?', v: '', h: '', m: 'Hot, please.', end: false }, n3: { a: 'Ok?', v: '', h: '', m: 'Yes, thanks.', end: false }, e: { a: 'Bye', v: '', h: '', m: '', end: true } } });
  const all = [mk('a', 'A1'), mk('b', 'A1'), mk('c', 'A2')];
  assert.deepEqual(pickConvs(all, 'A1', { a: 3 }, 1).map(c => c.id), ['b', 'a'], 'khách chưa gặp trước');
  assert.deepEqual(pickConvs(all, 'B1', {}, 1).map(c => c.id), ['c'], 'cấp chưa có → cấp gần nhất');
  const o = pickOpts(all[0]!, 'n1', 7); assert.equal(o.opts[o.ans], 'A coffee, please.'); assert.equal(o.opts.length, 3);
  assert.deepEqual(turnCoins(true, 'mic', 3, 'A1'), { coins: 15, tip: true });
  assert.deepEqual(turnCoins(true, 'type', null, 'A1'), { coins: 10, tip: false });
  assert.deepEqual(turnCoins(true, 'pick', 1, 'A1'), { coins: 2, tip: false });
  assert.equal(thinkSec(6000, 'one two three four five'), 4);
  assert.ok(usesWord('I bought apples at the market', 'market')); assert.ok(usesWord('There are many markets here', 'market'));
  assert.ok(!usesWord('market', 'market'), 'một từ chưa phải câu'); assert.ok(!usesWord('I like it very much', 'market'));
});

test('v126 Bến Cảng: cặp âm yếu nhất trước; v124 Sương: từ sắp quên nhất trước, nhận đúng từ (bỏ mạo từ); Phố thật theo tuần', () => {
  const sets = ['s-01', 's-02', 's-03', 's-04', 's-05'].map((id, i) => ({ id, title: id, vi: '', tip: '', pairs: [[`a${i}`, `b${i}`] as [string, string]] }));
  const os = portOrders(sets, id => (id === 's-04' ? 0.1 : 0.9), 3, 8);
  assert.equal(os.length, 8); assert.equal(os[0]!.set, 's-04'); for (const x of os) assert.notEqual(x.target, x.other);
  const f = (id: string, r: number, gap: number) => ({ id, en: id, vi: id, pic: '', node: 'u:x', r, gap });
  assert.deepEqual(signsOf([f('a', 0.8, 3), f('b', 0.3, 9), f('c', 0.5, 40)], 2).map(x => x.id), ['b', 'c']);
  assert.ok(signOk('apple', ['an apple'])); assert.ok(signOk('apple', ['xyz', 'Apple.'])); assert.ok(!signOk('apple', ['apples please']));
  assert.notEqual(realTask('A1', 0).id, realTask('A1', 7).id, 'tuần sau nhiệm vụ khác');
});

test('v123–v126 bộ não, Phố, bản lưu: game nói có công trình, được chọn khi hợp nhu cầu; bản lưu làm sạch và gộp hai máy', () => {
  const base = (x: Partial<DirIn> = {}): DirIn => ({ placed: true, fogWait: 3, claims: 0, top: { kind: 'learn', node: 'fn:greet', vi: 'chào' }, review: 0, first: {}, neck: null, gWrong: false, fnSeen: true, cd: {}, lv: 'A1', garden: 0, puzzleToday: false, played: [], last: '', tts: true, asr: true, talk: true, ...x });
  assert.equal(direct(base())[0]!.game, 'talk', 'đã luyện hiểu chức năng giao tiếp → tự nói ở Quán');
  assert.equal(direct(base({ asr: false }))[0]!.game, 'talk', 'không mic vẫn gõ được');
  assert.equal(direct(base({ fnSeen: false }))[0]!.game, 'cafe', 'chưa luyện hiểu → nghe chọn trước');
  assert.equal(direct(base({ review: 9, top: { kind: 'review', node: 'review', vi: 'ôn' }, fading: 5 })).find(p => p.need === 'review')!.game, 'wheel');
  assert.ok(direct(base({ review: 9, top: { kind: 'review', node: 'review', vi: 'ôn' }, fading: 5 })).some(p => p.game === 'signs'));
  for (const g of ['talk', 'ask', 'port', 'signs']) { assert.ok(SPOTS.some(s => s.game === g)); assert.equal(DECO[g as 'talk'].length, 4); }
  const v = freshVoice(); v.tk.served = 3; v.tk.played = { 'a1-cv1': 2, 'BAD KEY': 9 } as Record<string, number>;
  const s = sanitizeVoice(v)!; assert.deepEqual(Object.keys(s.tk.played), ['a1-cv1']);
  const w = freshVoice(); w.tk.served = 5; w.rw.done = ['song'];
  const m = mergeVoice(s, w)!; assert.equal(m.tk.served, 5); assert.deepEqual(m.rw.done, ['song']);
  const e = sanitizeE({ ...freshE(), vo: v }); assert.equal(e.vo?.tk.served, 3);
  assert.equal(mergeE(e, { ...freshE(), vo: w }).vo?.tk.served, 5);
});
