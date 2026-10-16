import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { index, closure, defaultLevel } from '../../src/engine/graph.ts';
import type { Edge, Goal, Node } from '../../src/engine/types.ts';
import { doorOf, tally, sanitizeSrc, mergeSrc, compareOf, cmpVerdict, skillRows, type SrcMap } from '../../src/engine/compare.ts';
import { viewCompare } from '../../src/engine/compareview.ts';
import { sanitizeE, mergeE, freshE } from '../../src/engine/state.ts';
import { ev as coreEv } from '../../src/engine/core.ts';
import type { ECtx } from '../../src/engine/views.ts';

const nodes = JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Node[];
const edges = JSON.parse(readFileSync('content/engine/edges.json', 'utf8')) as Edge[];
const goals = readdirSync('content/engine/goals').map(f => JSON.parse(readFileSync(`content/engine/goals/${f}`, 'utf8')) as Goal);
const ix = index({ nodes, edges, goals });
const a2 = closure(ix, ix.goal.get('cefr-a2')!.req, defaultLevel).map(r => ({ ...r, area: ix.node.get(r.node)?.area }));
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

test('v136 lối: mặc định là game; chỉ "app" mới là lối Học', () => {
  assert.equal(doorOf({}), 'game');
  assert.equal(doorOf({ set: { door: 'app' } }), 'app');
  assert.equal(doorOf({ set: { door: 'lạ' } }), 'game');
  assert.equal(doorOf(null), 'game');
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

test('v136 đường bài học cũ (ELCORE.ev) ghi nguồn theo lối, không đổi sổ bằng chứng so với không đếm', () => {
  const st: { e?: unknown; set: { door: string } } = { set: { door: 'app' } };
  const o = { node: 'u:a1-food', level: 2 as const, ok: true, g: 0.25, item: 'w:x:rec', qt: 'mcq', ctx: 'rec', src: 'vocab' as const };
  coreEv(st, o, 100);
  st.set.door = 'game';
  coreEv(st, { ...o, item: 'w:x:rec2' }, 100);
  coreEv(st, { ...o, ok: false, item: 'w:x:rec3' }, 100);
  const e = st.e as ReturnType<typeof freshE>;
  assert.deepEqual(e.src, { 'u:a1-food': { g: 1, a: 1 } });
  assert.equal(e.ev.led.length, 3, 'ba câu vẫn vào sổ như cũ');
});

test('v137 đối chiếu A2 thật theo 7 kỹ năng = 7 ô đồ: 188 / 70 / 29 / 10 / 44 / 8 / 10; game chỉ có lò Từ vựng', () => {
  const o = compareOf(a2, () => false, undefined);
  assert.deepEqual(o.rows.map(r => [r.id, r.total]), [['voc', 188], ['gra', 70], ['pro', 29], ['lis', 10], ['spk', 44], ['rd', 8], ['wr', 10]]);
  assert.deepEqual(o.rows.map(r => r.slot), ['Vũ khí', 'Giáp', 'Giày', 'Khiên', 'Bùa', 'Mũ', 'Nhẫn']);
  assert.equal(o.total, 359);
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

test('v136 kết luận và màn đối chiếu: nói thẳng nhóm chỉ học được ở lối Học; không dùng chữ thi / đề / kiểm tra', () => {
  const o = compareOf(a2, () => false, undefined);
  const v = cmpVerdict(o, 6);
  assert.match(v, /chỉ cho lý do học Từ vựng, và chỉ tới khi đủ 6 kỹ năng vững \(2% của 359/);
  assert.match(v, /Ngữ pháp, Phát âm, Nghe, Nói, Đọc, Viết: chỉ học được ở lối 📘 Học/);
  const c = { host: { esc }, e: freshE(), route: 'cmp' } as unknown as ECtx;
  const h = viewCompare(c, o, 'game', 'Tiếng Anh tổng quát A2', 6);
  assert.match(h, /data-act="door" data-door="app"/);
  assert.match(h, /🔒 Game chưa có lò cho nhóm này/);
  assert.match(h, /0\/359 phần đã vững/);
  assert.doesNotMatch(h.replace(/<[^>]+>/g, ' '), /\b(thi|đề|kiểm tra)\b/i);
  assert.match(viewCompare(c, null, 'app', ''), /data-door="game"/);
});
