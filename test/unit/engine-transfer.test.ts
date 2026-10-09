import { test } from 'node:test';
import assert from 'node:assert/strict';
import { xferCandidates, xferStatus, xferSummary, transferred, XFER } from '../../src/engine/transfer.ts';
import { rank } from '../../src/engine/nba.ts';
import { index } from '../../src/engine/graph.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv } from '../../src/engine/ev/store.ts';
import type { PathItem } from '../../src/engine/path.ts';
import type { Graph, Level, Node, Req } from '../../src/engine/types.ts';

// v60 Transfer (spec v2.4 §59, HG10; C26, C175–C179, C184, C211, C229, C277, C308, MT9).

const nn = (id: string, tr: number): Node => ({ id, kind: 'grammar', area: 'gra', skill: null, cefr: 'A2', vi: id, ctx: [], acts: [], minutes: 10, imp: { tr, re: 0.5 } });
const g: Graph = { nodes: [nn('g:a', 0.9), nn('g:b', 0.6), nn('g:low', 0.2), nn('g:new', 0.9)], edges: [], goals: [] };
const ix = index(g);
const need: Req[] = ['g:a', 'g:b', 'g:low', 'g:new'].map(node => ({ node, level: 3 as Level, type: 'foundation' }));
let T = 0;
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, node: string, ok: boolean, o: { ctx?: string; src?: 'transfer'; level?: Level; day?: number; item?: string } = {}) =>
  ingest(st, m, { node, level: o.level ?? 3, ok, item: o.item ?? `${node}#${++T}`, ctx: o.ctx ?? 'typ', ...(o.src ? { src: o.src } : {}) }, { dev: 'd', ts: ++T, day: o.day ?? 10 });
const master = (st: ReturnType<typeof freshEv>, m: MasteryStore, node: string) => { for (let i = 0; i < 20; i++) put(st, m, node, true, { item: `${node}-practice-${i % 4}` }); };
const xf = (st: ReturnType<typeof freshEv>, m: MasteryStore, node: string, ok: boolean, day = 10, level: Level = 3) => put(st, m, node, ok, { ctx: 'transfer', src: 'transfer', day, level });

test('ứng viên transfer: chỉ nút đã Đạt bằng bằng chứng thật, quan trọng cho transfer, chưa thử thành công; xếp theo độ quan trọng', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (const n of ['g:a', 'g:b', 'g:low']) master(st, m, n);
  assert.equal(stat(m['g:a']![3]).state, 'mastered');
  const cs = xferCandidates(ix, m, st, need, 10, () => true);
  assert.deepEqual(cs.map(c => c.node), ['g:a', 'g:b'], 'g:low không quan trọng cho transfer, g:new chưa Đạt');
  assert.deepEqual(xferCandidates(ix, m, st, need, 10, n => n !== 'g:a').map(c => c.node), ['g:b'], 'nút không có câu mới thì bỏ');
});

test('đúng ở câu mới → đã chứng minh transfer, ra khỏi danh sách; bằng chứng transfer là tier 2', () => {
  const st = freshEv(), m: MasteryStore = {};
  master(st, m, 'g:a');
  const ev = xf(st, m, 'g:a', true);
  assert.equal(ev!.tier, 2); assert.equal(ev!.why, 'transfer');
  assert.ok(transferred(st, 'g:a'));
  assert.equal(xferCandidates(ix, m, st, need, 10, () => true).some(c => c.node === 'g:a'), false);
});

test('đúng ở mức 4 lan xuống mức thấp hơn nhưng chỉ đếm một lần; sai đếm đúng số lượt', () => {
  const st = freshEv(), m: MasteryStore = {};
  master(st, m, 'g:a');
  xf(st, m, 'g:a', true, 10, 4); xf(st, m, 'g:a', false, 10, 3); xf(st, m, 'g:a', false, 10, 4);
  assert.deepEqual(xferStatus(st, 'g:a'), { tried: 3, ok: 1, fail: 2, last: 10 });
});

test('trượt ở câu mới: bằng chứng critical (tier 3), chờ vài ngày mới thử lại; trượt 2 lần → mở lại nút (mâu thuẫn, §69, MT9)', () => {
  const st = freshEv(), m: MasteryStore = {};
  master(st, m, 'g:a');
  const ev = xf(st, m, 'g:a', false);
  assert.equal(ev!.tier, 3);
  assert.equal(xferCandidates(ix, m, st, need, 11, () => true).some(c => c.node === 'g:a'), false, 'trong thời gian chờ');
  assert.ok(xferCandidates(ix, m, st, need, 10 + XFER.cooldownDays, () => true).some(c => c.node === 'g:a'), 'hết thời gian chờ thì thử lại');
  xf(st, m, 'g:a', false);
  assert.equal(stat(m['g:a']![3]).state, 'reopened');
  assert.equal(xferCandidates(ix, m, st, need, 30, () => true).some(c => c.node === 'g:a'), false, 'nút mở lại đi đường xác minh, không phải transfer');
  const sum = xferSummary(ix, m, st, need);
  assert.equal(sum.important, 3); assert.equal(sum.failed, 1); assert.equal(sum.ok, 0);
});

test('NBA: thử transfer thắng việc học nút ít giá trị, thua nút mở đường cho nhiều năng lực; chỉ một ứng viên transfer', () => {
  const item = (node: string, dep: number): PathItem => ({ node, level: 3, minutes: 10, dep, score: dep / 10, goals: ['cefr-a2'] });
  const none = { items: 0, mins: 0, risk: 0 };
  const tr = [{ node: 'g:a', level: 3, imp: 0.9 }, { node: 'g:b', level: 3, imp: 0.6 }];
  const lo = rank({ open: [item('u:x', 1), item('u:y', 10)], probe: null, review: none, verify: [], transfer: tr });
  assert.equal(lo[0]!.node, 'u:y');
  assert.ok(lo.findIndex(a => a.kind === 'transfer') < lo.findIndex(a => a.node === 'u:x'));
  assert.equal(lo.filter(a => a.kind === 'transfer').length, 1);
  assert.equal(lo.find(a => a.kind === 'transfer')!.node, 'g:a');
  assert.ok(lo.find(a => a.kind === 'transfer')!.parts.transfer > 0);
});
