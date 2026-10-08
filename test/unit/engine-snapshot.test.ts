import { test } from 'node:test';
import assert from 'node:assert/strict';
import type { MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv, mergeEv, LED_MAX } from '../../src/engine/ev/store.ts';
import { addSnap, replay, SNAP_MAX } from '../../src/engine/ev/snapshot.ts';
import { sanitizeEv } from '../../src/engine/ev/sanitize.ts';

// v54 (spec v2.4 §28 L4, §37, HG30, MT20): Decision Snapshot — mọi quyết định quan trọng giải thích và tái tạo được.

const ctx = (i: number, day = 10) => ({ dev: 'dev001', ts: 1000 + i, day });

test('nút đổi trạng thái Đạt → snapshot có số liệu, ngưỡng, luật, id bằng chứng; tái tạo ra đúng quyết định', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 12; i++) ingest(st, m, { node: 'u:x', level: 1, ok: true, item: `q${i}` }, ctx(i));
  const s = st.snap.find(x => x.kind === 'mastery' && x.subj === 'u:x' && x.dec === 'PASS');
  assert.ok(s, 'phải có snapshot Đạt');
  assert.equal(replay(s!), 'PASS');
  assert.ok(s!.evs.length > 0 && s!.evs.every(id => st.led.some(e => e.id === id)));
  assert.deepEqual(s!.thr, { m: 0.8, lb: 0.6 });
  assert.match(s!.rule, /^ev\d/);
  // Snapshot giữ đúng α, β của ô lúc quyết định (đối chiếu được về sau, MT20)
  assert.ok(s!.m!.a > 1 && s!.m!.b === 1);
  // Mất Đạt khi bằng chứng trái chiều đủ mạnh → snapshot FAIL
  for (let i = 0; i < 12; i++) ingest(st, m, { node: 'u:x', level: 1, ok: false, item: `z${i}` }, ctx(100 + i, 20));
  const f = st.snap.filter(x => x.subj === 'u:x' && x.kind === 'mastery').at(-1)!;
  assert.equal(f.dec, 'FAIL');
  assert.equal(replay(f), 'FAIL');
});

test('bằng chứng mà snapshot tham chiếu sống qua đợt dọn sổ (critical evidence, C109)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 12; i++) ingest(st, m, { node: 'u:keep', level: 1, ok: true, item: `k${i}` }, ctx(i, 1));
  const s = st.snap.find(x => x.subj === 'u:keep')!;
  for (let i = 0; i < LED_MAX + 500; i++) ingest(st, m, { node: `u:n${i % 300}`, level: 1, ok: i % 4 !== 0, item: `f${i}` }, ctx(1000 + i, 2 + Math.floor(i / 400)));
  assert.ok(st.led.length <= LED_MAX);
  for (const id of s.evs) assert.ok(st.led.some(e => e.id === id), `mất bằng chứng ${id}`);
});

test('tái tạo quyết định NBA, kiểm tra bỏ qua, Readiness từ dữ liệu trong snapshot', () => {
  const base = { ts: 1, day: 1, evs: [], rule: 'r' };
  assert.equal(replay({ ...base, id: 'a', kind: 'nba', subj: 'u:b', dec: 'CHOSEN', alt: [{ node: 'u:a', score: 0.1, dep: 1, min: 10 }, { node: 'u:b', score: 0.3, dep: 3, min: 10 }] }), 'CHOSEN');
  assert.equal(replay({ ...base, id: 'b', kind: 'nba', subj: 'u:a', dec: 'CHOSEN', alt: [{ node: 'u:a', score: 0.1, dep: 1, min: 10 }, { node: 'u:b', score: 0.3, dep: 3, min: 10 }] }), 'MISMATCH');
  assert.equal(replay({ ...base, id: 'c', kind: 'testout', subj: 'u:a', dec: 'PASS', info: { got: 3, of: 3, pass: 'yes' } }), 'PASS');
  assert.equal(replay({ ...base, id: 'd', kind: 'testout', subj: 'u:a', dec: 'FAIL', info: { got: 2, of: 3, pass: 'no' } }), 'FAIL');
  assert.equal(replay({ ...base, id: 'e', kind: 'readiness', subj: 'cefr-a1', dec: 'NOT_READY', info: { p: 0.4, need: 1, achieved: 'no' } }), 'NOT_READY');
  assert.equal(replay({ ...base, id: 'f', kind: 'readiness', subj: 'cefr-a1', dec: 'ACHIEVED', info: { p: 1, need: 1, achieved: 'yes' } }), 'ACHIEVED');
});

test('bỏ trùng snapshot khi quyết định không đổi; có trần; gộp hai máy hợp snapshot; lọc snapshot rác', () => {
  const st = freshEv(), s = { ts: 5, day: 1, kind: 'readiness' as const, subj: 'cefr-a1', dec: 'NOT_READY', info: { p: 0.2 }, evs: [], rule: 'r' };
  assert.ok(addSnap(st, s));
  assert.equal(addSnap(st, s), null);
  assert.ok(addSnap(st, { ...s, info: { p: 0.3 } }));
  for (let i = 0; i < SNAP_MAX + 50; i++) addSnap(st, { ...s, ts: 10 + i, kind: 'nba', subj: `u:${i}`, dec: 'CHOSEN' });
  assert.ok(st.snap.length <= SNAP_MAX);
  assert.ok(st.snap.some(x => x.kind === 'readiness'), 'snapshot readiness không bị đẩy ra trước NBA');
  const other = freshEv();
  addSnap(other, { ...s, ts: 99999, subj: 'cefr-a2' });
  assert.ok(mergeEv(st, other).snap.some(x => x.subj === 'cefr-a2'));
  const dirty = sanitizeEv({ snap: [{ id: 'x', kind: 'hack', subj: 'a', dec: 'b' }, { id: 'y', kind: 'nba', subj: 'u:a', dec: 'CHOSEN', ts: 1, evs: [1, 'e1'], alt: [{ node: 'bad id' }, { node: 'u:b', score: 1 }] }] });
  assert.equal(dirty.snap.length, 1);
  assert.deepEqual(dirty.snap[0]!.evs, ['e1']);
  assert.deepEqual(dirty.snap[0]!.alt!.map(a => a.node), ['u:b']);
});
