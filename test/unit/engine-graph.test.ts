import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { topo, closure, mergeGoals, validate, index, defaultLevel, audit, blockedBy } from '../../src/engine/graph.ts';
import type { Edge, Goal, Graph, Node } from '../../src/engine/types.ts';

const n = (id: string, kind: Node['kind'] = 'cando'): Node => ({ id, kind, area: 'rd', skill: 'R', cefr: 'B1', vi: id, ctx: [], acts: [], minutes: 10 });
const e = (from: string, to: string, type: Edge['type'] = 'hard'): Edge => ({ from, to, type, w: 1 });

test('topo: tiền đề đứng trước, phát hiện vòng lặp', () => {
  const ok = topo(['a', 'b', 'c'], [e('c', 'b'), e('b', 'a')]);
  assert.deepEqual(ok.order, ['a', 'b', 'c']);
  assert.deepEqual(ok.cycle, []);
  const bad = topo(['a', 'b', 'c'], [e('a', 'b'), e('b', 'c'), e('c', 'a')]);
  assert.deepEqual(bad.cycle.sort(), ['a', 'b', 'c']);
});

test('closure: chỉ kéo tiền đề cứng, đệ quy, giữ mức mục tiêu đã ghi', () => {
  const g: Graph = { nodes: [n('cd:a'), n('cd:b'), n('u:c', 'vocab'), n('g:d', 'grammar')], edges: [e('cd:a', 'cd:b'), e('cd:b', 'u:c'), e('cd:a', 'g:d', 'soft')], goals: [] };
  const out = closure(index(g), [{ node: 'cd:a', level: 5, type: 'skill' }], defaultLevel);
  const by = Object.fromEntries(out.map(r => [r.node, r.level]));
  assert.deepEqual(by, { 'cd:a': 5, 'cd:b': 3, 'u:c': 3 });   // g:d là tiền đề mềm: không kéo vào
});

test('mergeGoals: mỗi nút lấy mức cần cao nhất', () => {
  const g1: Goal = { id: 'x', version: '1.0', kind: 'cefr', vi: 'x', target: 'B1', cefr: 'B1', status: 'active', req: [{ node: 'cd:a', level: 3, type: 'skill' }] };
  const g2: Goal = { ...g1, id: 'y', req: [{ node: 'cd:a', level: 5, type: 'skill' }, { node: 'cd:b', level: 4, type: 'skill' }] };
  assert.deepEqual(mergeGoals([g1, g2]).map(r => [r.node, r.level]), [['cd:a', 5], ['cd:b', 4]]);
});

test('validate: bắt id trùng, cạnh lạc, vòng lặp, mục tiêu sai', () => {
  const g: Graph = {
    nodes: [n('cd:a'), n('cd:a'), n('cd:b')],
    edges: [e('cd:a', 'cd:z'), e('cd:a', 'cd:b'), e('cd:b', 'cd:a')],
    goals: [{ id: 'g', version: 'v1', kind: 'cefr', vi: 'g', target: 'B1', cefr: 'B1', status: 'active', req: [{ node: 'cd:q', level: 3, type: 'skill' }] }],
  };
  const errs = validate(g).join('\n');
  for (const s of ['nút trùng id', 'cạnh tới nút không có', 'vòng lặp', 'phiên bản', 'nút không có cd:q']) assert.match(errs, new RegExp(s));
});

// Dữ liệu thật trong content/engine
const nodes = JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Node[];
const edges = JSON.parse(readFileSync('content/engine/edges.json', 'utf8')) as Edge[];
const goals = readdirSync('content/engine/goals').map(f => JSON.parse(readFileSync(`content/engine/goals/${f}`, 'utf8')) as Goal);
const real: Graph = { nodes, edges, goals };

test('đồ thị thật: toàn vẹn, không vòng lặp, đủ 4 nhóm mục tiêu', () => {
  assert.deepEqual(validate(real), []);
  const kinds = new Set(goals.map(g => g.kind));
  for (const k of ['cefr', 'ielts-ac', 'ielts-gt', 'vstep', 'comm']) assert.ok(kinds.has(k as Goal['kind']), k);
  assert.equal(goals.filter(g => g.kind === 'ielts-ac').length, 11);   // 4.0 → 9.0, bước 0,5
});

test('đồ thị thật: mục tiêu cao hơn cần nhiều nút hơn sau đóng tiền đề; IELTS gồm bài Viết/Nói', () => {
  const ix = index(real), size = (id: string) => closure(ix, ix.goal.get(id)!.req, defaultLevel).length;
  assert.ok(size('cefr-a1') < size('cefr-b1') && size('cefr-b1') < size('cefr-c2'));
  assert.ok(size('vstep-b1') < size('vstep-c1'));
  const ac = ix.goal.get('ielts-ac-6.5')!.req.map(r => r.node);
  for (const id of ['xw:ielts-t1-ac', 'xw:ielts-t2', 'xs:ielts-p2', 'x:r-tfng', 'x:l-map']) assert.ok(ac.includes(id), id);
  assert.ok(!ac.includes('xw:ielts-t1-gt'));
});

test('spec v2.4: MVP chỉ CEFR là mục tiêu mở; IELTS/VSTEP/giao tiếp giữ dữ liệu ở trạng thái tương lai', () => {
  const active = goals.filter(g => g.status === 'active').map(g => g.id).sort();
  assert.deepEqual(active, ['cefr-a1', 'cefr-a2', 'cefr-b1', 'cefr-b2', 'cefr-c1', 'cefr-c2', 'cefr-pre-a1']);
  for (const g of goals) if (g.kind !== 'cefr') assert.equal(g.status, 'future', g.id);
});

test('Pre-A1: mục tiêu riêng, mọi bài khởi động là tiền đề cứng của A1', () => {
  const ix = index(real), pre = ix.goal.get('cefr-pre-a1')!;
  assert.ok(pre.req.length >= 5 && pre.req.every(r => r.node.startsWith('pa:') && r.level === 3));
  const a1 = new Set(closure(ix, ix.goal.get('cefr-a1')!.req, defaultLevel).map(r => r.node));
  for (const r of pre.req) assert.ok(a1.has(r.node), r.node);
});

test('v57 Knowledge Model: mọi cạnh có lý do; nút có phiên bản, phạm vi, độ khó, năng lực Universal Core, yêu cầu bằng chứng', () => {
  assert.ok(real.edges.every(e => e.why && e.ver), 'cạnh thiếu lý do/phiên bản');
  for (const n of real.nodes) {
    assert.ok(n.ver && n.scope && n.dims?.length && n.evReq && n.imp && typeof n.diff === 'number', n.id);
    assert.ok(n.diff! >= 0 && n.diff! <= 1, n.id);
  }
  const dims = new Set(real.nodes.flatMap(n => n.dims ?? []));
  for (const d of ['lex', 'gram', 'phon', 'rec', 'prod', 'inter', 'prag', 'disc']) assert.ok(dims.has(d as never), d);
});

test('v57: cặp dễ nhầm đối xứng và trỏ đúng nút; lỗi hay gặp gắn vào điểm ngữ pháp; quan hệ transfer (uses) khớp cạnh', () => {
  const by = new Map(real.nodes.map(n => [n.id, n]));
  for (const n of real.nodes) for (const c of n.contrast ?? []) { assert.ok(by.has(c), c); assert.ok(by.get(c)!.contrast?.includes(n.id), `${n.id} ↔ ${c}`); }
  assert.ok(real.nodes.filter(n => n.mis?.length).length >= 20);
  for (const n of real.nodes) for (const u of n.uses ?? []) assert.ok(real.edges.some(e => e.from === u && e.to === n.id && e.type === 'hard'), `${u} → ${n.id}`);
});

test('v57 audit: phát hiện mồ côi, không học được, tiền đề ngược cấp, trùng tên, nhóm thay thế sai; đồ thị thật sạch', () => {
  const nn = (id: string, cefr: Node['cefr'], acts = 1): Node => ({ id, kind: 'cando', area: 'rd', skill: 'R', cefr, vi: id === 'cd:dup2' ? 'cd:dup1' : id, ctx: [], acts: Array.from({ length: acts }, () => ({ at: 'data-x="1"', t: 't' })), minutes: 10 });
  const g: Graph = {
    nodes: [nn('cd:top', 'A1'), nn('cd:hi', 'B2'), nn('cd:noact', 'A1', 0), nn('cd:orphan', 'A1'), nn('cd:dup1', 'A1'), nn('cd:dup2', 'A1')],
    edges: [{ from: 'cd:top', to: 'cd:hi', type: 'hard', w: 1 }, { from: 'cd:top', to: 'cd:noact', type: 'hard', w: 1, alt: 'x', need: 3 }],
    goals: [{ id: 'g', version: '1.0', kind: 'cefr', vi: 'g', target: 'A1', cefr: 'A1', status: 'active', req: [{ node: 'cd:top', level: 3, type: 'skill' }] }],
  };
  const a = audit(g);
  assert.ok(a.orphan.includes('cd:orphan'));
  assert.deepEqual(a.unreachable, ['cd:noact']);
  assert.deepEqual(a.inverse, ['cd:top → cd:hi']);
  assert.deepEqual(a.dup, [['cd:dup1', 'cd:dup2']]);
  assert.deepEqual(a.altBad, ['cd:top#x']);
  const r = audit(real);
  assert.deepEqual([r.orphan.length, r.unreachable.length, r.inverse.length, r.altBad.length], [0, 0, 0, 0]);
});

test('v57 tiền đề thay thế (alt/need): nút mở khi đủ need nút trong nhóm, không cần đủ cả nhóm', () => {
  const nn = (id: string): Node => ({ id, kind: 'cando', area: 'rd', skill: 'R', cefr: 'B1', vi: id, ctx: [], acts: [], minutes: 10 });
  const g: Graph = { nodes: [nn('cd:t'), nn('cd:a'), nn('cd:b'), nn('cd:c')], edges: ['cd:a', 'cd:b', 'cd:c'].map(to => ({ from: 'cd:t', to, type: 'hard' as const, w: 1, alt: 'r', need: 2 })), goals: [] };
  const ix = index(g);
  assert.equal(blockedBy(ix, 'cd:t', to => to !== 'cd:a'), true);           // mới đạt 1/3
  assert.equal(blockedBy(ix, 'cd:t', to => to === 'cd:c'), false);          // đạt 2/3 → mở
});
