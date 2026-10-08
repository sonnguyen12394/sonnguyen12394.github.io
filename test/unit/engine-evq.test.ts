import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ingest, freshEv, fatigue } from '../../src/engine/ev/store.ts';
import { RULE, type Rule } from '../../src/engine/ev/evaluate.ts';
import { drift, estimate } from '../../src/engine/ev/audit.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { candidates } from '../../src/engine/probe.ts';
import { index } from '../../src/engine/graph.ts';
import type { Graph, Level, Node } from '../../src/engine/types.ts';

// v66 chất lượng bằng chứng (luật m3.2): độ khó câu, ≥ 2 câu khác nhau, câu trùng nội dung, mệt, trôi model, ước lượng tham số.

let T = 0;
type O = { node?: string; level?: Level; ok: boolean; item?: string; diff?: number; text?: string; sess?: string; rt?: number; hint?: boolean; g?: number };
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, o: O, day = 1, rule: Rule = RULE) =>
  ingest(st, m, { node: o.node ?? 'x:a', level: o.level ?? 3, ok: o.ok, item: o.item ?? `i${++T}`, ...(o.diff !== undefined ? { diff: o.diff } : {}), ...(o.text ? { text: o.text } : {}), ...(o.sess ? { sess: o.sess } : {}), ...(o.rt ? { rt: o.rt } : {}), ...(o.hint ? { hint: true } : {}), ...(o.g ? { g: o.g } : {}) }, { dev: 'd', ts: ++T, day, rule });

test('độ khó câu: đúng câu khó nặng hơn, đúng câu dễ nhẹ hơn; sai câu dễ nặng hơn (C86, C118, C246)', () => {
  const run = (diff: number, ok: boolean) => { const st = freshEv(), m: MasteryStore = {}; for (let i = 0; i < 6; i++) put(st, m, { ok, diff }); return m['x:a']![3]!; };
  assert.ok(run(1, true).a > run(0, true).a && run(0, true).a > run(-1, true).a);
  assert.ok(run(-1, false).b > run(0, false).b && run(0, false).b > run(1, false).b);
});

test('mức 1–3 không Đạt bằng một câu lặp qua nhiều ngày; đúng ở ≥ 2 câu khác nhau thì Đạt (C180)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let d = 1; d <= 25; d++) put(st, m, { ok: true, item: 'same' }, d);
  assert.equal(stat(m['x:a']![3]).pass, false);
  assert.equal(stat(m['x:a']![3]).state, 'verify');
  put(st, m, { ok: true, item: 'other' }, 30);
  assert.equal(stat(m['x:a']![3]).pass, true);
});

test('cùng một đề dưới id khác không được tính là câu mới (C242)', () => {
  const st = freshEv(), m: MasteryStore = {};
  const a = put(st, m, { ok: true, item: 'id-1', text: 'She ___ a doctor.' })!;
  const b = put(st, m, { ok: true, item: 'id-2', text: '  she ___ a DOCTOR ' })!;
  const c = put(st, m, { ok: true, item: 'id-3', text: 'They ___ doctors.' })!;
  assert.deepEqual([a.nov, b.nov, c.nov], [1, 0, 1]);
});

test('mệt trong phiên: đúng giảm rõ và chậm dần → lỗi nhẹ hơn, độ tin cậy thấp hơn (C295, C371)', () => {
  const obs = [...Array(8).fill({ ok: true, rt: 3000, sess: 's' }), ...Array(8).fill({ ok: false, rt: 6000, sess: 's' })];
  assert.equal(fatigue(obs, 's'), true);
  assert.equal(fatigue(obs.map(o => ({ ...o, ok: true })), 's'), false);
  assert.equal(fatigue(obs, undefined), false);
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 8; i++) put(st, m, { ok: true, sess: 's', rt: 3000, node: 'x:b' });
  for (let i = 0; i < 8; i++) put(st, m, { ok: false, sess: 's', rt: 6000, node: 'x:b' });
  const e = put(st, m, { ok: false, sess: 's', rt: 7000 })!;
  assert.ok(e.w < 1 && e.rel < 1);
});

test('độ tin cậy và thời điểm của từng sự kiện (C72, C85, C107)', () => {
  const st = freshEv(), m: MasteryStore = {};
  const plain = put(st, m, { ok: true })!, mcq = put(st, m, { ok: true, g: 0.25 })!, hint = put(st, m, { ok: true, hint: true })!;
  assert.equal(plain.rel, 1); assert.equal(mcq.rel, 0.75); assert.equal(hint.rel, 0.5);
  assert.ok(plain.ts > 0 && plain.day === 1 && typeof plain.id === 'string');
});

test('luật truyền vào ingest được dùng khi tính lại ô (slip khác → ô khác)', () => {
  const a = freshEv(), ma: MasteryStore = {}, b = freshEv(), mb: MasteryStore = {};
  for (const [st, m, slip] of [[a, ma, 0.05], [b, mb, 0.3]] as const) for (let i = 0; i < 4; i++) put(st, m, { ok: false }, 1, { ...RULE, slip });
  assert.notEqual(ma['x:a']![3]!.b, mb['x:a']![3]!.b);
});

test('trôi model: ở phần đã Đạt mà gần đây sai nhiều hơn dự đoán → báo trôi; ước lượng slip từ sổ (C257, C379, C264, C265)', () => {
  const st = freshEv(), m: MasteryStore = {}, ns = ['x:a', 'x:b', 'x:c', 'x:d', 'x:e', 'x:f'];
  for (const n of ns) for (let i = 0; i < 25; i++) put(st, m, { node: n, ok: true }, 1);
  assert.equal(drift(st, m, 30).n, 0, 'cửa sổ 14 ngày: bằng chứng cũ không tính');
  for (const n of ns) for (let i = 0; i < 4; i++) put(st, m, { node: n, ok: i !== 0, item: `late${n}${i}` }, 30);
  const d = drift(st, m, 30), est = estimate(st, m);
  assert.ok(ns.every(n => stat(m[n]![3]).state === 'mastered'));
  assert.equal(d.n, 24); assert.ok(d.obs < d.exp); assert.equal(d.flag, true);
  assert.ok(est.slipN >= 30 && est.slip !== null && est.slip > 0 && est.slip < 0.2);
});

test('chế độ xác minh của chẩn đoán: nút mở lại / cần xác minh được dò ở chế độ verify (C136)', () => {
  const nn = (id: string): Node => ({ id, kind: 'grammar', area: 'gra', skill: null, cefr: 'A2', vi: id, ctx: [], acts: [], minutes: 10 });
  const ix = index({ nodes: [nn('g:v')], edges: [], goals: [] } as Graph);
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 25; i++) put(st, m, { node: 'g:v', ok: true });
  put(st, m, { node: 'g:v', ok: false }); put(st, m, { node: 'g:v', ok: false });
  assert.equal(stat(m['g:v']![3]).state, 'reopened');
  const c = candidates({ ix, m, need: [{ node: 'g:v', level: 3, type: 'foundation' }], open: new Set(), probeable: () => true });
  assert.equal(c[0]!.mode, 'verify');
});
