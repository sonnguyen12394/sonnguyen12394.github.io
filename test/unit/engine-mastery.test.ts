import { test } from 'node:test';
import assert from 'node:assert/strict';
import { record, stat, statusOf, prior, mergeStore, type MasteryStore } from '../../src/engine/mastery.ts';
import { migrateE, sanitizeE, mergeE, E_V } from '../../src/engine/state.ts';

const many = (store: MasteryStore, n: number, ok: (i: number) => boolean, extra: Partial<Parameters<typeof record>[1]> = {}, day = 100) => {
  for (let i = 0; i < n; i++) record(store, { node: 'u:a1-u1', level: 3, ok: ok(i), item: `w${i}`, qt: i % 2 ? 'mcq' : 'typed', ctx: `c${i % 4}`, ...extra }, day);
};

test('đúng tăng α, sai tăng β; đoán mò làm bằng chứng đúng yếu đi', () => {
  const a: MasteryStore = {}, b: MasteryStore = {};
  record(a, { node: 'u:x', level: 1, ok: true }, 1);
  record(b, { node: 'u:x', level: 1, ok: true, g: 0.5 }, 1);
  assert.equal(a['u:x']![1]!.a, 2);
  assert.equal(b['u:x']![1]!.a, 1.5);
  record(a, { node: 'u:x', level: 1, ok: false }, 1);
  assert.equal(a['u:x']![1]!.b, 1.9);   // nhầm tay s = 0,1
});

test('bằng chứng ở mức cao tính luôn cho mức thấp hơn, không lan lên mức cao hơn', () => {
  const s: MasteryStore = {};
  record(s, { node: 'g:p', level: 3, ok: true }, 1);
  assert.ok(s['g:p']![1] && s['g:p']![2] && s['g:p']![3]);
  assert.equal(s['g:p']![4], undefined);
});

test('lặp cùng câu trong 24 giờ chỉ được nửa trọng số', () => {
  const s: MasteryStore = {}, recent: Record<string, number> = {};
  record(s, { node: 'u:x', level: 1, ok: true, item: 'q1' }, 10, recent);
  record(s, { node: 'u:x', level: 1, ok: true, item: 'q1' }, 10, recent);
  assert.equal(s['u:x']![1]!.n, 1.5);
  record(s, { node: 'u:x', level: 1, ok: true, item: 'q1' }, 12, recent);   // hai ngày sau: đủ trọng số
  assert.equal(s['u:x']![1]!.n, 2.5);
});

test('Đạt cần cả m ≥ 0,8 và cận dưới ≥ 0,6: 2 câu đúng chưa đủ, 12/13 câu đúng thì đạt', () => {
  const s1: MasteryStore = {};
  many(s1, 2, () => true);
  assert.equal(statusOf(s1, 'u:a1-u1', 3).pass, false);
  const s2: MasteryStore = {};
  many(s2, 13, i => i !== 5);
  const st = statusOf(s2, 'u:a1-u1', 3);
  assert.ok(st.m >= 0.8 && st.lb >= 0.6 && st.pass, JSON.stringify(st));
});

test('confidence: thấp khi ít bằng chứng; cao khi nhiều dạng câu, nhiều ngữ cảnh, sd nhỏ', () => {
  const s: MasteryStore = {};
  many(s, 2, () => true);
  assert.equal(statusOf(s, 'u:a1-u1', 3).conf, 'low');
  many(s, 30, i => i % 10 !== 0, {}, 200);
  assert.equal(statusOf(s, 'u:a1-u1', 3).conf, 'high');
  const one: MasteryStore = {};
  for (let i = 0; i < 30; i++) record(one, { node: 'u:b', level: 1, ok: true, item: `q${i}`, qt: 'mcq', ctx: 'rec' }, 1);
  assert.equal(statusOf(one, 'u:b', 1).conf, 'mid');   // một dạng câu, một ngữ cảnh: chưa thể "cao"
});

test('tiên nghiệm chỉ đặt cho ô chưa có bằng chứng thật', () => {
  const s: MasteryStore = {};
  record(s, { node: 'u:x', level: 1, ok: false }, 1);
  prior(s, 'u:x', 3, 6, 0.5);
  assert.equal(s['u:x']![1]!.a, 1);           // giữ bằng chứng thật
  assert.equal(s['u:x']![3]!.a, 7);
  assert.ok(stat(s['u:x']![3]).pass);         // tiến độ cũ "đã qua, vững" ≈ đạt
});

test('state: v1 → v2 giữ mục tiêu, thêm kho mastery; lọc dữ liệu hỏng', () => {
  const v1 = { v: 1, goals: [{ id: 'vstep-b1', version: '1.0', since: 5, date: null }] };
  const e = migrateE(v1);
  assert.equal(e.v, E_V);
  assert.deepEqual(e.goals.map(g => g.id), ['vstep-b1']);
  assert.deepEqual(e.m, {});
  const dirty = sanitizeE({ v: 2, goals: [], m: { 'bad id': { 1: { a: 2 } }, 'u:ok': { 1: { a: 'x', b: 3, n: 1, q: ['mcq', 5], c: [], d: 3 }, 9: { a: 1 } } }, r: {} });
  assert.deepEqual(Object.keys(dirty.m), ['u:ok']);
  assert.deepEqual(dirty.m['u:ok']![1], { a: 1, b: 3, n: 1, q: ['mcq'], c: [], d: 3 });
});

test('gộp hai máy: mỗi ô lấy bản nhiều bằng chứng hơn, mục tiêu hợp lại', () => {
  const A: MasteryStore = {}, B: MasteryStore = {};
  many(A, 3, () => true);
  many(B, 8, () => true);
  record(A, { node: 'g:only-a', level: 2, ok: true }, 1);
  const m = mergeStore(A, B);
  assert.equal(m['u:a1-u1']![3]!.n, 8);
  assert.ok(m['g:only-a']);
  const e = mergeE({ v: 2, goals: [{ id: 'cefr-b1', version: '1.0', since: 3, date: null }], m: A, r: {} }, { v: 2, goals: [{ id: 'vstep-b1', version: '1.0', since: 1, date: null }], m: B, r: {} });
  assert.deepEqual(e.goals.map(g => g.id), ['vstep-b1', 'cefr-b1']);
});
