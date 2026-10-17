import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { index, closure, defaultLevel } from '../../src/engine/graph.ts';
import type { Edge, Goal, Node } from '../../src/engine/types.ts';
import { doorOfCtx, GAME_CTX, tally, sanitizeSrc, mergeSrc, compareOf, cmpVerdict, skillRows, type SrcMap } from '../../src/engine/compare.ts';
import { ESS_GAMES } from '../../src/engine/cb.ts';
import { sanitizeE, mergeE, freshE } from '../../src/engine/state.ts';
import { ev as coreEv } from '../../src/engine/core.ts';

const nodes = JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Node[];
const edges = JSON.parse(readFileSync('content/engine/edges.json', 'utf8')) as Edge[];
const goals = readdirSync('content/engine/goals').map(f => JSON.parse(readFileSync(`content/engine/goals/${f}`, 'utf8')) as Goal);
const ix = index({ nodes, edges, goals });
const a2 = closure(ix, ix.goal.get('cefr-a2')!.req, defaultLevel).map(r => ({ ...r, area: ix.node.get(r.node)?.area }));

test('v138 nguồn theo nơi học: ngữ cảnh lò game (Vườn từ, Vòng Chữ, Mỏ Chữ, Lò rèn) là game, còn lại là app; khớp cb.ts ESS_GAMES', () => {
  assert.deepEqual([...GAME_CTX].sort(), Object.keys(ESS_GAMES).sort());
  for (const c of ['learn', 'wheel', 'hunt', 'forge']) assert.equal(doorOfCtx(c), 'game');
  for (const c of ['rec', 'listen', 'cards', 'diag', undefined, 7]) assert.equal(doorOfCtx(c), 'app');
});

test('v136 tally: chỉ đếm câu đúng đã vào sổ, đúng lối; bỏ id lạ', () => {
  const s: SrcMap = {};
  tally(s, 'u:food', true, true, 'game');
  tally(s, 'u:food', true, true, 'app');
  tally(s, 'u:food', true, true, 'app');
  tally(s, 'u:food', false, true, 'game');   // sai: không đếm
  tally(s, 'g:past', true, false, 'game');   // không vào sổ: không đếm
  tally(s, '<script>', true, true, 'game');
  assert.deepEqual(s, { 'u:food': { g: 1, a: 2 } });
});

test('v136 bản lưu: lọc bộ đếm hỏng, gộp hai máy lấy số lớn hơn, đi qua sanitizeE / mergeE', () => {
  assert.equal(sanitizeSrc(null), undefined);
  assert.deepEqual(sanitizeSrc({ 'u:a': { g: 2.4, a: -3 }, 'zz': { g: 1 }, 'g:b': { g: 0, a: 0 }, 'ph:c': 'x' }), { 'u:a': { g: 2, a: 0 } });
  assert.deepEqual(mergeSrc({ 'u:a': { g: 3, a: 1 } }, { 'u:a': { g: 1, a: 4 }, 'g:b': { g: 0, a: 2 } }), { 'u:a': { g: 3, a: 4 }, 'g:b': { g: 0, a: 2 } });
  const e = sanitizeE({ ...freshE(), src: { 'u:a': { g: 1, a: 0 } } });
  assert.deepEqual(e.src, { 'u:a': { g: 1, a: 0 } });
  const m = mergeE({ ...freshE(), src: { 'u:a': { g: 5, a: 0 } } }, { ...freshE(), src: { 'u:a': { g: 1, a: 2 } } });
  assert.deepEqual(m.src, { 'u:a': { g: 5, a: 2 } });
});

test('v138 đường ELCORE.ev ghi nguồn theo ngữ cảnh câu; sổ bằng chứng như cũ', () => {
  const st: { e?: unknown } = {};
  const o = { node: 'u:a1-food', level: 2 as const, ok: true, g: 0.25, item: 'w:x:rec', qt: 'mcq', ctx: 'rec', src: 'vocab' as const };
  coreEv(st, o, 100);
  coreEv(st, { ...o, item: 'w:x:wh', ctx: 'wheel' }, 100);
  coreEv(st, { ...o, ok: false, item: 'w:x:rec3' }, 100);
  const e = st.e as ReturnType<typeof freshE>;
  assert.deepEqual(e.src, { 'u:a1-food': { g: 1, a: 1 } });
  assert.equal(e.ev.led.length, 3, 'ba câu vẫn vào sổ như cũ');
});

test('v137 đối chiếu A2 thật theo 7 kỹ năng = 7 ô đồ: 188 / 70 / 29 / 10 / 46 / 8 / 10; game chỉ có lò Từ vựng', () => {
  const o = compareOf(a2, () => false, undefined);
  assert.deepEqual(o.rows.map(r => [r.id, r.total]), [['voc', 188], ['gra', 70], ['pro', 29], ['lis', 10], ['spk', 46], ['rd', 8], ['wr', 10]]);
  assert.deepEqual(o.rows.map(r => r.slot), ['Vũ khí', 'Giáp', 'Giày', 'Khiên', 'Bùa', 'Mũ', 'Nhẫn']);
  assert.equal(o.total, 361);   // v151 +2 Can-Do Nói (A1, A2) của Nói & Đọc
  assert.deepEqual(o.rows.filter(r => r.pull).map(r => r.id), ['voc']);
  assert.deepEqual(o.rows.filter(r => r.mid).map(r => r.id), ['spk', 'wr']);
  assert.equal(o.solid, 0);
  assert.ok(a2.filter(r => r.node.startsWith('fn:')).every(r => r.area === 'spk'), 'chức năng giao tiếp tính vào Nói');
});

test('v137 bảng kỹ năng: "thiếu nhất" là kỹ năng % thấp nhất còn phần chưa vững; kỹ năng đủ rồi không bị đánh dấu', () => {
  const rd = a2.filter(r => r.area === 'rd').map(r => r.node), lis = a2.filter(r => r.area === 'lis').map(r => r.node).slice(0, 1);
  const voc = a2.filter(r => r.area === 'voc').map(r => r.node).slice(0, 100);
  const all = new Set([...rd, ...lis, ...voc, ...a2.filter(r => ['gra', 'pro', 'spk', 'wr'].includes(r.area ?? '')).map(r => r.node).slice(0, 200)]);
  const rows = skillRows(compareOf(a2, n => all.has(n) && !a2.some(r => r.node === n && r.area === 'wr'), undefined));
  assert.equal(rows.length, 7);
  assert.deepEqual(rows.filter(r => r.low).map(r => r.id), ['wr']);
  assert.equal(rows.find(r => r.id === 'rd')!.solid, 8);
  assert.equal(skillRows(compareOf([], () => false, undefined)).length, 0);
});

test('v136 đối chiếu: vững nhờ game / app / cả hai / từ trước; chưa vững không xếp nguồn', () => {
  const [u1, u2, u3, u4] = a2.filter(r => r.node.startsWith('u:')).map(r => r.node);
  const g1 = a2.find(r => r.node.startsWith('g:'))!.node;
  const solid = new Set([u1, u2, u3, u4, g1]);
  const src: SrcMap = { [u1!]: { g: 3, a: 0 }, [u2!]: { g: 0, a: 2 }, [u3!]: { g: 1, a: 1 }, [g1]: { g: 0, a: 4 }, 'u:khong-vung': { g: 9, a: 0 } };
  const o = compareOf(a2, n => solid.has(n), src);
  const u = o.rows.find(r => r.id === 'voc')!, g = o.rows.find(r => r.id === 'gra')!;
  assert.deepEqual([u.solid, u.game, u.app, u.both, u.before], [4, 1, 1, 1, 1]);
  assert.deepEqual([g.solid, g.app, g.game], [1, 1, 0]);
  assert.deepEqual([o.solid, o.game, o.app, o.both, o.before], [5, 1, 2, 1, 1]);
});

test('v136 kết luận: nói thẳng kỹ năng nào game chưa có lò', () => {
  const o = compareOf(a2, () => false, undefined);
  const v = cmpVerdict(o, 6);
  assert.match(v, /chỉ cho lý do học Từ vựng, và chỉ tới khi đủ 6 kỹ năng vững \(2% của 361/);
  assert.match(v, /Ngữ pháp, Phát âm, Nghe, Nói, Đọc, Viết: hiện chỉ học được ở phần 📘 Học bài/);
});

test('v151 cửa thứ ba 🗣 Nói & Đọc: ngữ cảnh nd / nd-… đếm riêng; gộp hai máy; vững từ hai nguồn vào "cả hai"', () => {
  assert.equal(doorOfCtx('nd'), 'nd'); assert.equal(doorOfCtx('nd-pair'), 'nd'); assert.equal(doorOfCtx('ndx'), 'app'); assert.equal(doorOfCtx('wheel'), 'game');
  const src: SrcMap = {};
  tally(src, 'u:a1-food', true, true, 'nd'); tally(src, 'u:a1-food', true, true, 'nd'); tally(src, 'g:g-a1-08', true, true, 'nd'); tally(src, 'g:g-a1-08', true, true, 'app');
  assert.deepEqual(src['u:a1-food'], { g: 0, a: 0, n: 2 });
  assert.deepEqual(sanitizeSrc({ 'u:a1-food': { g: 0, a: 0, n: 2 }, 'u:x': { n: 'z' } }), { 'u:a1-food': { g: 0, a: 0, n: 2 } });
  assert.deepEqual(mergeSrc({ 'u:a1-food': { g: 0, a: 1, n: 3 } }, { 'u:a1-food': { g: 2, a: 0 } }), { 'u:a1-food': { g: 2, a: 1, n: 3 } });
  const o = compareOf([{ node: 'u:a1-food', level: 3, area: 'voc' }, { node: 'g:g-a1-08', level: 4, area: 'gra' }], () => true, src);
  assert.equal(o.nd, 1); assert.equal(o.both, 1); assert.equal(o.ansN, 3);
});
