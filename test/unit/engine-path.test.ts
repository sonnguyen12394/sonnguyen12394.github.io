import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { plan, session, goalWeight } from '../../src/engine/path.ts';
import { index } from '../../src/engine/graph.ts';
import { record, statusOf, type MasteryStore } from '../../src/engine/mastery.ts';
import type { Edge, Goal, Graph, Node } from '../../src/engine/types.ts';

const n = (id: string, minutes = 10, kind: Node['kind'] = 'cando'): Node => ({ id, kind, area: 'rd', skill: 'R', cefr: 'B1', vi: id, ctx: [], acts: [], minutes });
const e = (from: string, to: string, type: Edge['type'] = 'hard', w = 1): Edge => ({ from, to, type, w });
const goal = (id: string, nodes: string[]): Goal => ({ id, version: '1.0', kind: 'cefr', vi: id, target: 'B1', cefr: 'B1', req: nodes.map(node => ({ node, level: 3, type: 'skill' })) });

// cd:top cần cd:mid (cứng), cd:mid cần u:a và u:b (cứng); u:c chỉ là tiền đề mềm của cd:top
const g: Graph = { nodes: [n('cd:top'), n('cd:mid'), n('u:a', 20, 'vocab'), n('u:b', 5, 'vocab'), n('u:c', 5, 'vocab')], edges: [e('cd:top', 'cd:mid'), e('cd:mid', 'u:a'), e('cd:mid', 'u:b'), e('cd:top', 'u:c', 'soft', 0.5)], goals: [goal('g1', ['cd:top'])] };
const ix = index(g);

test('chỉ mở nút đã đủ tiền đề cứng; nút đã đạt ra khỏi lộ trình', () => {
  const p = plan(ix, [{ goal: g.goals[0]!, date: null }], 0, () => false);
  assert.deepEqual(p.open.map(x => x.node).sort(), ['u:a', 'u:b']);
  assert.equal(p.unmet.length, 4);   // cd:top, cd:mid, u:a, u:b (u:c chỉ là tiền đề mềm: không thuộc tập thiếu)
  const p2 = plan(ix, [{ goal: g.goals[0]!, date: null }], 0, node => node === 'u:a' || node === 'u:b');
  assert.deepEqual(p2.open.map(x => x.node), ['cd:mid']);
  assert.equal(p2.unmet.length, 2);
});

test('ưu tiên = năng lực mục tiêu phụ thuộc ÷ phút: nút ngắn cùng giá trị đứng trước', () => {
  const p = plan(ix, [{ goal: g.goals[0]!, date: null }], 0, () => false);
  assert.equal(p.open[0]!.node, 'u:b');                 // 5 phút, cùng mở đường cho cd:mid → cd:top như u:a (20 phút)
  assert.ok(p.open[0]!.score > p.open[1]!.score);
  assert.deepEqual(p.open[0]!.goals, ['g1']);
});

test('mục tiêu có ngày thi gần nặng hơn', () => {
  assert.equal(goalWeight(null, 0), 1);
  assert.equal(goalWeight(0, 0), 3);
  assert.equal(goalWeight(400, 0), 1);
  const g2: Graph = { nodes: [n('u:x', 10, 'vocab'), n('u:y', 10, 'vocab')], edges: [], goals: [goal('far', ['u:x']), goal('near', ['u:y'])] };
  const ix2 = index(g2);
  const p = plan(ix2, [{ goal: g2.goals[0]!, date: 365 }, { goal: g2.goals[1]!, date: 10 }], 0, () => false);
  assert.equal(p.open[0]!.node, 'u:y');
});

test('buổi học: ôn ≤ 30% thời gian, bài làm thật khi 7 ngày chưa có, rồi các nút ưu tiên', () => {
  const p = plan(ix, [{ goal: g.goals[0]!, date: null }], 0, () => false);
  const s = session(p, 30, 25, true, id => id === 'u:a');
  assert.equal(s.review, 9);
  assert.equal(s.perf?.node, 'u:a');
  assert.deepEqual(s.items.map(x => x.node), ['u:b']);
  const s2 = session(p, 30, 0, false, () => false);
  assert.equal(s2.review, 0);
  assert.equal(s2.perf, null);
  assert.deepEqual(s2.items.map(x => x.node), ['u:b', 'u:a']);
});

test('kiểm tra để bỏ qua: đúng hết 3 câu (mức 1–3, trọng số 4) thì đạt mức 3; sai một câu thì chưa', () => {
  const ok: MasteryStore = {};
  record(ok, { node: 'u:a', level: 1, ok: true, g: 0.25, w: 4 }, 1);
  record(ok, { node: 'u:a', level: 2, ok: true, g: 0.25, w: 4 }, 1);
  record(ok, { node: 'u:a', level: 3, ok: true, g: 0, w: 4 }, 1);
  assert.equal(statusOf(ok, 'u:a', 3).pass, true);
  const bad: MasteryStore = {};
  record(bad, { node: 'u:a', level: 1, ok: true, g: 0.25, w: 4 }, 1);
  record(bad, { node: 'u:a', level: 2, ok: true, g: 0.25, w: 4 }, 1);
  record(bad, { node: 'u:a', level: 3, ok: false, g: 0, w: 4 }, 1);
  assert.equal(statusOf(bad, 'u:a', 3).pass, false);
});

test('đồ thị thật: người mới với mục tiêu VSTEP B1 — lộ trình mở được ngay, không chặn hết', () => {
  const nodes = JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Node[];
  const edges = JSON.parse(readFileSync('content/engine/edges.json', 'utf8')) as Edge[];
  const goals = readdirSync('content/engine/goals').map(f => JSON.parse(readFileSync(`content/engine/goals/${f}`, 'utf8')) as Goal);
  const real = index({ nodes, edges, goals });
  const p = plan(real, [{ goal: real.goal.get('vstep-b1')!, date: null }], 0, () => false);
  assert.ok(p.open.length > 20, `${p.open.length} nút mở`);
  assert.ok(p.open.every(x => !(real.pre.get(x.node) ?? []).some(e2 => e2.type === 'hard' && p.unmet.some(r => r.node === e2.to))));
  // người mới bắt đầu từ nền A1: 10 bước đầu đều là năng lực/cụm từ/điểm ngữ pháp cấp A1
  assert.ok(p.open.slice(0, 10).every(x => real.node.get(x.node)!.cefr === 'A1'), p.open.slice(0, 10).map(x => x.node).join(','));
});
