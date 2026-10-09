import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { index, blockedBy, defaultLevel, closure } from '../../src/engine/graph.ts';
import { readinessFor, READINESS_MODELS } from '../../src/engine/readiness.ts';
import { plan } from '../../src/engine/path.ts';
import type { Edge, Goal, Graph, Node } from '../../src/engine/types.ts';

// v67: mô hình nội dung + đồ thị (C14, C17–C19, C34, C55, C56, C60, C156, C207) và Readiness một đường (C5, C197, C198).

const J = (p: string) => JSON.parse(readFileSync(p, 'utf8'));
const nodes = J('content/engine/nodes.json') as Node[], edges = J('content/engine/edges.json') as Edge[];
const goals = readdirSync('content/engine/goals').map(f => J(`content/engine/goals/${f}`) as Goal);
const ix = index({ nodes, edges, goals });

test('đồ thị thật có tiền đề thay thế: Can-Do vốn từ theo chủ đề mở khi Đạt ≥ 80% số unit, không cần đủ cả', () => {
  const alt = edges.filter(e => e.alt);
  assert.ok(alt.length > 100 && new Set(alt.map(e => e.alt)).size >= 20);
  const g = alt[0]!.alt!, members = alt.filter(e => e.alt === g), need = members[0]!.need!;
  assert.ok(need < members.length, 'cần ít hơn tổng số unit: có nhiều đường');
  const done = new Set(members.slice(0, need).map(e => e.to));
  const inGroup = (to: string) => members.some(m => m.to === to);   // tiền đề cứng ngoài nhóm coi như đã đạt
  assert.equal(blockedBy(ix, members[0]!.from, to => inGroup(to) && !done.has(to)), false, 'đủ need unit → mở');
  const fewer = new Set(members.slice(0, need - 1).map(e => e.to));
  assert.equal(blockedBy(ix, members[0]!.from, to => inGroup(to) && !fewer.has(to)), true, 'thiếu một unit → chưa mở');
  assert.ok(edges.filter(e => /-gra\d+$/.test(e.from) && e.alt).length === 0, 'Can-Do ngữ pháp không có tiền đề thay thế');
});

test('nút âm vị và nút chức năng giao tiếp riêng, có hoạt động để đo, nối từ Can-Do (C14, C17–C19)', () => {
  const ph = nodes.filter(n => n.kind === 'sound'), fn = nodes.filter(n => n.kind === 'func');
  assert.equal(ph.length, 26); assert.ok(fn.length >= 40);
  assert.ok(ph.every(n => n.acts.length && n.dims?.includes('phon') && defaultLevel(n) === 2));
  assert.ok(fn.every(n => n.acts.length && n.dims?.includes('inter') && n.dims.includes('prag') && defaultLevel(n) === 3));
  assert.ok(edges.some(e => e.from.startsWith('cd:') && e.to.startsWith('ph:')) && edges.some(e => e.from.startsWith('cd:') && e.to.startsWith('fn:')));
  const a1 = goals.find(g => g.id === 'cefr-a1')!;
  assert.ok(closure(ix, a1.req, defaultLevel).some(r => r.node.startsWith('fn:')), 'mục tiêu A1 đòi chức năng giao tiếp');
});

test('bản đồ nội dung: mọi câu học nền gắn một nút có thật, mức và băm nội dung; không nút từ vựng / ngữ pháp nào thiếu câu (C55, C56, C60)', () => {
  const cm = J('content/engine/content-map.json') as { items: number; map: Record<string, Array<[string, number[], string]>> };
  const have = new Set(nodes.map(n => n.id));
  assert.ok(cm.items > 20000);
  for (const [node, xs] of Object.entries(cm.map)) { assert.ok(have.has(node), node); for (const [id, lv, h] of xs) assert.ok(id && lv.length && /^[0-9a-z]+$/.test(h), id); }
  for (const n of nodes) if (n.kind === 'vocab' || n.kind === 'grammar' || n.kind === 'sound') assert.ok(cm.map[n.id]?.length, n.id);
  assert.ok(cm.map['u:a1-u1']!.some(([id]) => id === 'w:breakfast:rec'), 'id câu khớp id app ghi vào bằng chứng');
});

test('Readiness theo mô hình khai trong dữ liệu mục tiêu; mục tiêu mới chỉ cần dữ liệu (C5, C197, C198)', () => {
  assert.ok(goals.every(g => g.readiness && READINESS_MODELS[g.readiness]));
  assert.ok(goals.filter(g => g.kind === 'vstep').every(g => g.readiness === 'exam-score'));
  // Mục tiêu mới (không có trong app): tiếng Anh công sở A2, chỉ là dữ liệu → lộ trình và Readiness chạy bằng engine có sẵn.
  const biz: Goal = { id: 'biz-a2', version: '1.0', kind: 'comm', vi: 'Tiếng Anh công sở A2', target: 'A2', status: 'active', readiness: 'mastery', cefr: 'A2',
    req: nodes.filter(n => n.kind === 'func' && n.cefr === 'A2').slice(0, 4).map(n => ({ node: n.id, level: 3 as const, type: 'skill' as const })) };
  const g2: Graph = { nodes, edges, goals: [...goals, biz] }, ix2 = index(g2);
  const p = plan(ix2, [{ goal: biz, date: null }], 1, () => false);
  assert.ok(p.total >= 4 && p.open.length > 0);
  const passAll = readinessFor(biz, { mastery: () => ({ pass: true, conf: 'mid' }), lapse: null, today: 10 });
  const none = readinessFor(biz, { mastery: () => ({ pass: false, conf: 'low' }), lapse: null, today: 10 });
  assert.equal(passAll.kind, 'mastery'); assert.equal((passAll as { achieved: boolean }).achieved, true); assert.equal((none as { achieved: boolean }).achieved, false);
});
