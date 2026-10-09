import { test } from 'node:test';
import assert from 'node:assert/strict';
import { record, stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, recomputeAll, fromCells, mergeEv, verify, freshEv, setPrior, LED_MAX, prune } from '../../src/engine/ev/store.ts';
import { sanitizeEv } from '../../src/engine/ev/sanitize.ts';
import { RULE } from '../../src/engine/ev/evaluate.ts';
const EXACT = { ...RULE, decay: 1 };   // tắt giảm theo lượt khi kiểm phép tính chính xác
import { migrateE, mergeE, E_V } from '../../src/engine/state.ts';
import type { Observation } from '../../src/engine/ev/types.ts';
import type { Level } from '../../src/engine/types.ts';

// Kiến trúc bằng chứng v2.4 (v53): Observation → Evaluator → L1 sổ + L2 thống kê → L3 ô Beta dẫn xuất.

const near = (a: number, b: number) => Math.abs(a - b) < 1e-6;
function rng(seed: number): () => number { let s = seed >>> 0; return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296); }
function randObs(r: () => number, i: number): Observation {
  const node = ['u:a1-u1', 'u:a1-u2', 'g:g-a1-01'][Math.floor(r() * 3)]!;
  return { node, level: (1 + Math.floor(r() * 4)) as Level, ok: r() < 0.7, g: r() < 0.5 ? 0.25 : 0, item: `q${Math.floor(r() * 40)}`, qt: r() < 0.5 ? 'mcq' : 'typed', ctx: `c${i % 3}`, only: r() < 0.1 };
}

test('ô Beta dẫn xuất khớp đúng công thức spec §44 (khi tắt giảm theo lượt), có cả lặp 24h và "only"', () => {
  const r = rng(7), st = freshEv(), m: MasteryStore = {}, old: MasteryStore = {}, rec1: Record<string, number> = {}, rec2: Record<string, number> = {};
  for (let i = 0; i < 400; i++) {
    const o = randObs(r, i), day = 100 + Math.floor(i / 50);
    ingest(st, m, o, { dev: 'dev001', ts: i, day, recent: rec1, rule: { ...RULE, decay: 1 } });   // không giảm theo lượt: đúng công thức §44 gốc
    record(old, { ...o }, day, rec2);
  }
  for (const [id, cs] of Object.entries(old)) for (const [l, c] of Object.entries(cs)) {
    const d = m[id]![Number(l) as Level]!;
    assert.ok(near(d.a, c!.a) && near(d.b, c!.b) && near(d.n, c!.n), `${id}/${l}: ${JSON.stringify(d)} vs ${JSON.stringify(c)}`);
  }
});

test('mỗi sự kiện có provenance: id thiết bị, luật, nguồn, câu, phiên; quan sát thô vào L0', () => {
  const st = freshEv(), m: MasteryStore = {};
  const e = ingest(st, m, { node: 'g:g-a1-01', level: 3, ok: true, src: 'gram', item: 'g:x', ch: 'g:g-a1-01', qt: 'gtp', ctx: 'typ', sess: 's1', cv: 'a52', rt: 3200 }, { dev: 'abc123', ts: 5, day: 9 })!;
  assert.equal(e.id, 'abc123.1');
  assert.equal(e.ev, `${RULE.evaluator}/${RULE.mastery}`);
  assert.deepEqual([e.src, e.item, e.ch, e.sess, e.cv, e.rt, e.nov], ['gram', 'g:x', 'g:g-a1-01', 's1', 'a52', 3200, 1]);
  assert.equal(st.obs.length, 1);
  assert.equal(st.led.length, 1);
  assert.equal(Object.keys(st.agg.abc123!).length, 3);   // mức 1, 2, 3 (bằng chứng lan xuống)
});

test('trợ giúp, làm lại và hết giờ trong game làm bằng chứng yếu đi; tốc độ không đổi trọng số', () => {
  const w = (o: Partial<Observation>) => ingest(freshEv(), {}, { node: 'u:x', level: 1, ok: true, item: 'i', ...o } as Observation, { dev: 'd00001', ts: 0, day: 1 })!;
  assert.equal(w({}).w, 1);
  assert.equal(w({ hint: true }).w, RULE.hint);
  assert.equal(w({ retry: true }).w, RULE.retry);
  assert.equal(w({ ok: false, timed: true, timeout: true }).w, RULE.timeout);
  assert.equal(w({ rt: 900 }).w, w({ rt: 15000 }).w);
  assert.equal(w({ hint: true }).asst, 1);
});

test('tính lại được khi đổi luật (HG33): đổi slip thì β đổi đúng theo thống kê, không cần dữ liệu gốc', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 10; i++) ingest(st, m, { node: 'u:x', level: 1, ok: i % 3 !== 0, item: `q${i}` }, { dev: 'd00001', ts: i, day: i, rule: EXACT });
  const bad = 4, good = 6;
  const s2 = recomputeAll(st, { ...EXACT, slip: 0.3 });
  assert.ok(near(s2['u:x']![1]!.b, 1 + bad * 0.7));
  assert.ok(near(s2['u:x']![1]!.a, 1 + good));
  assert.ok(near(recomputeAll(st)['u:x']![1]!.b, m['u:x']![1]!.b));
});

test('v3 → v4: ô Beta cũ giữ nguyên α, β, n, dạng câu, ngữ cảnh; tiên nghiệm thành Claim riêng', () => {
  const v3 = { v: 3, goals: [], r: {}, pri: 1, diag: null, m: {
    'u:a1-u1': { 3: { a: 9.5, b: 2.8, n: 11, q: ['mcq', 'typed'], c: ['rcl', 'rec'], d: 120 } },
    'g:g-a1-02': { 4: { a: 7, b: 1.5, n: 0, q: [], c: [], d: 0 } },
  } };
  const e = migrateE(v3);
  assert.equal(e.v, E_V);
  assert.deepEqual(e.m['u:a1-u1']![3], { a: 9.5, b: 2.8, n: 11, q: ['mcq', 'typed'], c: ['rcl', 'rec'], d: 120 });
  assert.equal(e.m['g:g-a1-02']![4]!.a, 7);
  assert.ok(e.ev.pri['g:g-a1-02|4']);
  assert.equal(stat(e.m['u:a1-u1']![3]).pass, stat({ a: 9.5, b: 2.8, n: 11, q: [], c: [], d: 0 }).pass);
});

test('tiên nghiệm không đè ô đã có bằng chứng thật; bằng chứng thật đến sau thì cộng dồn với tiên nghiệm (pseudo-count)', () => {
  const st = freshEv(), m: MasteryStore = {};
  setPrior(st, m, 'u:y', 3, 6, 0.5, 'diag', 1);
  assert.ok(stat(m['u:y']![3]).pass);
  ingest(st, m, { node: 'u:y', level: 3, ok: false, item: 'a' }, { dev: 'd00001', ts: 1, day: 2 });
  assert.equal(m['u:y']![3]!.a, 7);                         // 1 + tiên nghiệm 6
  assert.ok(Math.abs(m['u:y']![3]!.b - (1 + 0.5 + 0.9)) < 1e-9);   // + một lượt sai
  assert.equal(stat(m['u:y']![3]).state, 'learning');        // Claim chưa có bằng chứng thật: một lỗi đủ làm yếu
  // Chiều ngược lại (lỗi trước v58): một câu ĐÚNG không được làm mất Đạt của nút suy ra
  const s2 = freshEv(), m2: MasteryStore = {};
  setPrior(s2, m2, 'u:z', 3, 6, 0.5, 'diag', 1);
  ingest(s2, m2, { node: 'u:z', level: 3, ok: true, item: 'a' }, { dev: 'd00001', ts: 1, day: 2 });
  assert.equal(stat(m2['u:z']![3]).pass, true);
  // m3.3 (bot L01): xác nhận Claim cần riêng bằng chứng thật đủ Đạt như một nút chưa có tiên nghiệm (ở đây: 4 câu đúng khác nhau);
  // trong lúc đó vẫn "suy ra" và vẫn coi như biết (không quay lại lộ trình).
  for (const [i, it] of ['b', 'c'].entries()) {
    ingest(s2, m2, { node: 'u:z', level: 3, ok: true, item: it }, { dev: 'd00001', ts: 2 + i, day: 3 + i });
    assert.equal(stat(m2['u:z']![3]).state, 'inferred');
    assert.equal(stat(m2['u:z']![3]).pass, true);
  }
  ingest(s2, m2, { node: 'u:z', level: 3, ok: true, item: 'd' }, { dev: 'd00001', ts: 5, day: 6 });
  assert.equal(stat(m2['u:z']![3]).state, 'mastered');
});

test('gộp hai máy (G-counter theo thiết bị): không mất, không đếm trùng, gộp lặp lại không đổi kết quả', () => {
  const A = freshEv(), B = freshEv(), mA: MasteryStore = {}, mB: MasteryStore = {};
  for (let i = 0; i < 6; i++) ingest(A, mA, { node: 'u:x', level: 1, ok: true, item: `a${i}` }, { dev: 'aaaaaa', ts: i, day: 1, rule: EXACT });
  for (let i = 0; i < 4; i++) ingest(B, mB, { node: 'u:x', level: 1, ok: false, item: `b${i}` }, { dev: 'bbbbbb', ts: 10 + i, day: 1, rule: EXACT });
  const AB = mergeEv(A, B), twice = mergeEv(AB, mergeEv(B, AB));
  const c = recomputeAll(AB)['u:x']![1]!, c2 = recomputeAll(twice)['u:x']![1]!;
  assert.ok(near(c.a, 7) && near(c.b, 1 + 4 * 0.9) && near(c.n, 10));
  assert.deepEqual(c2, c);
  assert.equal(AB.led.length, 10);
  // Qua lớp state (đồng bộ thật): mergeE dùng cùng cơ chế
  const ea = { ...migrateE(null), ev: A, m: mA }, eb = { ...migrateE(null), ev: B, m: mB };
  assert.ok(near(mergeE(ea, eb).m['u:x']![1]!.n, 10));
});

test('100.000 tương tác: sổ L1 có trần, dung lượng không tăng theo số lượt, ô Beta vẫn khớp thống kê (HG32)', () => {
  const r = rng(11), st = freshEv(), m: MasteryStore = {}, rec: Record<string, number> = {};
  let size10k = 0;
  for (let i = 0; i < 100000; i++) {
    ingest(st, m, randObs(r, i), { dev: 'dev001', ts: i, day: 100 + Math.floor(i / 500), recent: rec });
    if (i === 10000) size10k = JSON.stringify(st).length;
  }
  const size = JSON.stringify(st).length;
  assert.ok(st.led.length <= LED_MAX);
  assert.ok(size < size10k * 1.5, `dung lượng ${size} so với lúc 10k: ${size10k}`);
  assert.equal(verify(st, m), 0);
  assert.ok(st.led.some(e => e.tier >= 2));
});

test('dọn sổ theo giá trị: giữ tier 2–3 và bằng chứng đại diện (lần đúng/sai gần nhất) của mỗi nút', () => {
  const led = Array.from({ length: 50 }, (_, i) => ({ id: `d.${i}`, ts: i, day: 1, node: i < 45 ? 'u:a' : 'u:b', lv: 1 as Level, ok: (i % 2) as 0 | 1, w: 1, g: 0, src: 'vocab' as const, nov: 0 as const, rel: 1, tier: (i === 3 ? 3 : i === 4 ? 2 : 1) as 1 | 2 | 3, val: 1, ev: 'x' }));
  const kept = prune(led, 10, 1), ids = new Set(kept.map(e => e.id));
  assert.equal(kept.length, 10);
  for (const id of ['d.3', 'd.4', 'd.48', 'd.49']) assert.ok(ids.has(id), id);
});

test('phát hiện và sửa ô Beta bị hỏng theo thống kê (C399); dữ liệu rác từ ngoài bị lọc', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 5; i++) ingest(st, m, { node: 'u:x', level: 1, ok: true, item: `q${i}` }, { dev: 'd00001', ts: i, day: 1, rule: EXACT });
  m['u:x']![1]!.a = 99;
  assert.equal(verify(st, m), 1);
  assert.equal(m['u:x']![1]!.a, 6);
  const dirty = sanitizeEv({ agg: { 'BAD DEV': {}, d00001: { 'u:x|1': { '-|-|0|0': { n: 1, sw: 1, swOk: 1, swgOk: 5, swBad: 0 }, junk: { n: 1 } }, 'bad|9': {} } }, led: [{ id: 'x', node: 'bad id' }], seen: { 'u:x': 'zz' } });
  assert.deepEqual(Object.keys(dirty.agg), ['d00001']);
  assert.deepEqual(Object.keys(dirty.agg.d00001!), ['u:x|1']);
  assert.deepEqual(Object.keys(dirty.agg.d00001!['u:x|1']!), ['-|-|0|0']);
  assert.equal(dirty.agg.d00001!['u:x|1']!['-|-|0|0']!.swgOk, 1);
  assert.equal(dirty.led.length, 0);
  assert.deepEqual(dirty.seen, {});
});

test('ô legacy (gộp từ bản cũ) gộp hai máy như trước: lấy bản nhiều bằng chứng hơn', () => {
  const a = fromCells({ 'u:x': { 1: { a: 4, b: 1, n: 3, q: [], c: [], d: 1 } } }, 1);
  const b = fromCells({ 'u:x': { 1: { a: 9, b: 1, n: 8, q: [], c: [], d: 2 } } }, 2);
  assert.equal(recomputeAll(mergeEv(a, b))['u:x']![1]!.a, 9);
});
