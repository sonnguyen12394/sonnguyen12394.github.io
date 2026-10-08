import { test } from 'node:test';
import assert from 'node:assert/strict';
import { candidates, nextProbe, eig, rootVerdict, PROBE } from '../../src/engine/probe.ts';
import { index } from '../../src/engine/graph.ts';
import { plan } from '../../src/engine/path.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv, setPrior } from '../../src/engine/ev/store.ts';
import type { Graph, Level, Node, Req } from '../../src/engine/types.ts';

// v58 chẩn đoán liên tục (spec v2.4 §46–50; C131–C140, C281–C300).

const nn = (id: string, kind: Node['kind'] = 'grammar'): Node => ({ id, kind, area: 'gra', skill: null, cefr: 'A2', vi: id, ctx: [], acts: [{ at: 'data-gp="x"', t: 't' }], minutes: 10 });
const g: Graph = { nodes: [nn('g:base'), nn('g:top'), nn('g:new'), nn('g:inf'), nn('g:edge')], edges: [{ from: 'g:top', to: 'g:base', type: 'hard', w: 1 }], goals: [] };
const ix = index(g);
const need: Req[] = ['g:base', 'g:top', 'g:new', 'g:inf', 'g:edge'].map(node => ({ node, level: 3 as Level, type: 'foundation' }));
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, node: string, ok: boolean, i: number) => ingest(st, m, { node, level: 3, ok, item: `${node}#${i}` }, { dev: 'd', ts: i, day: 1 });

test('giá trị thông tin: cao ở ô chưa có gì / sát ngưỡng, thấp ở ô đã chắc chắn', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 40; i++) put(st, m, 'g:sure', true, i);
  const empty = eig(undefined), sure = eig(m['g:sure']![3]);
  assert.ok(empty > sure * 3, `${empty} vs ${sure}`);
});

test('chọn đúng chế độ: khám phá, xác nhận Claim, ranh giới, truy gốc tiền đề khi sai lặp lại', () => {
  const st = freshEv(), m: MasteryStore = {};
  setPrior(st, m, 'g:inf', 3, 6, 0.5, 'diag', 1);
  for (let i = 0; i < 6; i++) put(st, m, 'g:top', false, i);                       // sai lặp lại → truy gốc g:base
  for (let i = 0; i < 9; i++) put(st, m, 'g:edge', i % 5 !== 0, 100 + i);          // sát ngưỡng
  const s = stat(m['g:edge']![3]);
  const cs = candidates({ ix, m, need, open: new Set(['g:new', 'g:base']), probeable: () => true });
  const mode = (n: string) => cs.find(c => c.node === n)?.mode;
  assert.equal(mode('g:base'), 'root');
  assert.equal(cs.find(c => c.node === 'g:base')!.for, 'g:top');
  assert.equal(mode('g:inf'), 'confirm');
  assert.equal(mode('g:new'), 'explore');
  if (s.n >= 3 && Math.abs(s.m - 0.8) < 0.08 && !s.pass) assert.equal(mode('g:edge'), 'boundary');
  assert.equal(cs[0]!.mode, 'root', 'truy gốc được ưu tiên trước');
});

test('dừng khi đủ (giá trị thấp) hoặc hết ngân sách trong ngày (§39, P10)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (const n of ['g:base', 'g:top', 'g:new', 'g:inf', 'g:edge']) for (let i = 0; i < 40; i++) put(st, m, n, true, i);
  const p = { ix, m, need, open: new Set<string>(), probeable: () => true };
  assert.equal(nextProbe(p, 0), null, 'mọi thứ đã chắc: không dò thêm');
  const p2 = { ...p, m: {} as MasteryStore, open: new Set(['g:new']) };
  assert.ok(nextProbe(p2, 0));
  assert.equal(nextProbe(p2, PROBE.budget), null);
});

test('truy gốc được kiểm chứng: trượt câu dò → thiếu tiền đề; lộ trình đưa tiền đề lên trước (boost)', () => {
  assert.equal(rootVerdict(0, 3), 'gap');
  assert.equal(rootVerdict(3, 3), 'ok');
  assert.equal(rootVerdict(1, 2), 'unclear');
  const g2: Graph = { nodes: [nn('g:a'), nn('g:b'), nn('g:c')], edges: [], goals: [{ id: 'x', version: '1.0', kind: 'cefr', vi: 'x', target: 'A2', cefr: 'A2', status: 'active', req: ['g:a', 'g:b', 'g:c'].map(node => ({ node, level: 3 as Level, type: 'foundation' as const })) }] };
  const ix2 = index(g2), goal = g2.goals[0]!;
  const p0 = plan(ix2, [{ goal, date: null }], 1, () => false);
  const p1 = plan(ix2, [{ goal, date: null }], 1, () => false, new Map([['g:c', 3]]));
  assert.equal(p0.open[0]!.node, 'g:a');
  assert.equal(p1.open[0]!.node, 'g:c');
});

test('truy gốc trọn vòng trên learner mô phỏng: sai lặp lại ở nút sau → dò tiền đề → trượt → giả thuyết đã kiểm chứng → lộ trình học tiền đề trước', async () => {
  const S = await import('../../src/engine/sim/sim.ts');
  const L = new S.Learner({ ...S.DEFAULT_PROFILE, learn: 0, slip: 0 }, S.rng(3)), E = S.newEngine();
  L.know('g:base', false); L.know('g:top', false);
  for (let i = 0; i < 6; i++) S.ask(E, L, 'g:top', 3, 1, { mc: false });
  const c = nextProbe({ ix, m: E.m, need, open: new Set(['g:base']), probeable: () => true }, 0)!;
  assert.deepEqual([c.node, c.mode, c.for], ['g:base', 'root', 'g:top']);
  let got = 0;
  for (let q = 0; q < 3; q++) if (S.ask(E, L, 'g:base', 3, 1, { mc: false })) got++;
  assert.equal(rootVerdict(got, 3), 'gap');
});
