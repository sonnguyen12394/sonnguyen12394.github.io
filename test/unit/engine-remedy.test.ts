import { test } from 'node:test';
import assert from 'node:assert/strict';
import { remedyFor, pickFor } from '../../src/engine/remedy.ts';
import { gaps, weakContext } from '../../src/engine/gap.ts';
import { masteryReadiness } from '../../src/engine/readiness.ts';
import { xferSummary } from '../../src/engine/transfer.ts';
import { index } from '../../src/engine/graph.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv } from '../../src/engine/ev/store.ts';
import type { Graph, Level, Node, Req } from '../../src/engine/types.ts';

// v65: lỗ hổng quyết định cách sửa (C142–C149); tự động hoá theo chính người học (C145); Readiness đòi transfer, có miễn (C184).

test('mỗi loại lỗ hổng cho một cách sửa khác nhau; phần nền và transfer được ưu tiên', () => {
  assert.deepEqual([remedyFor(['knowledge'], 3).act, remedyFor(['knowledge'], 3).lv, remedyFor(['knowledge'], 3).typed], ['teach', 1, false]);
  assert.deepEqual([remedyFor(['recall'], 3).act, remedyFor(['recall'], 3).lv, remedyFor(['recall'], 3).typed], ['recall', 3, true]);
  assert.equal(remedyFor(['skill'], 4).act, 'produce'); assert.equal(remedyFor(['skill'], 4).lv, 4);
  assert.equal(remedyFor(['context'], 3, 'spl').ctx, 'spl');
  assert.equal(remedyFor(['retention'], 4).act, 'review');
  assert.equal(remedyFor(['automaticity'], 3).act, 'speed');
  assert.equal(remedyFor(['recall', 'prerequisite'], 3).act, 'root');
  assert.equal(remedyFor(['knowledge', 'transfer'], 3).act, 'transfer');
  assert.equal(remedyFor([], 3).act, 'practice');
});

test('chọn câu theo cách sửa: đúng mức, đúng dạng (tự gõ / chọn), câu chưa gặp trước', () => {
  const qs = [{ id: 'a', level: 1, opts: ['x', 'y'] }, { id: 'b', level: 2, opts: ['x'] }, { id: 'c', level: 3 }, { id: 'd', level: 3 }];
  assert.equal(pickFor(qs, remedyFor(['knowledge'], 3), () => false)!.id, 'a');
  assert.equal(pickFor(qs, remedyFor(['recall'], 3), id => id === 'c')!.id, 'd');
  assert.equal(pickFor([], remedyFor([], 3), () => false), null);
});

let T = 0;
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, node: string, ok: boolean, o: { rt?: number; ctx?: string; level?: Level } = {}) =>
  ingest(st, m, { node, level: o.level ?? 3, ok, item: `${node}#${++T}`, ...(o.rt ? { rt: o.rt } : {}), ...(o.ctx ? { ctx: o.ctx } : {}) }, { dev: 'd', ts: ++T, day: 1 });

test('"đúng nhưng chậm" so với chính người học: người vốn chậm không bị gắn nhãn; người nhanh mà chậm hẳn ở nút này thì có', () => {
  const slowLearner = freshEv(), m1: MasteryStore = {};
  for (let i = 0; i < 12; i++) put(slowLearner, m1, 'g:other', true, { rt: 15000 });
  for (let i = 0; i < 20; i++) put(slowLearner, m1, 'g:x', true, { rt: 15000 });
  assert.ok(!gaps({ m: m1, ev: slowLearner, node: 'g:x', need: 3, blocked: false }).includes('automaticity'));
  const fast = freshEv(), m2: MasteryStore = {};
  for (let i = 0; i < 12; i++) put(fast, m2, 'g:other', true, { rt: 3000 });
  for (let i = 0; i < 20; i++) put(fast, m2, 'g:x', true, { rt: 9000 });
  assert.ok(gaps({ m: m2, ev: fast, node: 'g:x', need: 3, blocked: false }).includes('automaticity'));
});

test('ngữ cảnh yếu nhất được chỉ ra để luyện đúng chỗ', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 20; i++) put(st, m, 'g:x', true, { ctx: 'rcl' });
  for (let i = 0; i < 4; i++) put(st, m, 'g:x', i === 0, { ctx: 'spl' });
  assert.equal(weakContext(st, 'g:x', 3), 'spl');
});

test('Readiness CEFR: đủ năng lực nhưng chưa đúng ở câu mới thì chưa Đạt; nút hết câu mới được miễn (C184)', () => {
  const req: Req[] = [{ node: 'g:a', level: 3, type: 'foundation' }, { node: 'g:b', level: 3, type: 'foundation' }];
  const pass = () => ({ pass: true, conf: 'mid' as const });
  assert.equal(masteryReadiness(req, pass, null, 100).achieved, true, 'không truyền transfer: như trước');
  assert.equal(masteryReadiness(req, pass, null, 100, { important: 2, ok: 1, exempt: 0 }).achieved, false);
  assert.equal(masteryReadiness(req, pass, null, 100, { important: 2, ok: 1, exempt: 1 }).achieved, true);
  const nn = (id: string): Node => ({ id, kind: 'grammar', area: 'gra', skill: null, cefr: 'A2', vi: id, ctx: [], acts: [], minutes: 10, imp: { tr: 0.9, re: 0.5 } });
  const ix = index({ nodes: [nn('g:a'), nn('g:b'), nn('g:c')], edges: [], goals: [] } as Graph);
  const st = freshEv(), m: MasteryStore = {};
  for (const n of ['g:a', 'g:b']) for (let i = 0; i < 20; i++) put(st, m, n, true);
  assert.equal(stat(m['g:a']![3]).state, 'mastered');
  ingest(st, m, { node: 'g:a', level: 3, ok: true, item: 'new1', src: 'transfer', ctx: 'transfer' }, { dev: 'd', ts: 999, day: 2 });
  const s = xferSummary(ix, m, st, [...req, { node: 'g:c', level: 3, type: 'foundation' }], n => n === 'g:b');
  assert.deepEqual({ important: s.important, ok: s.ok, exempt: s.exempt, pending: s.pending }, { important: 3, ok: 1, exempt: 1, pending: ['g:c'] }, 'g:c chưa Đạt: không được miễn');
});
