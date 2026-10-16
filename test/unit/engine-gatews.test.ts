import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GATE_WS, NEXT_LV, wsPct, wordsOf } from '../../src/engine/gatews.ts';
import { GATE, GATE_FORMS, sanitizeGate } from '../../src/engine/gate.ts';

test('v140 thi chuyển cấp: mỗi bộ A1 / A2 có 2 bài Viết + 1 bài Nói, đúng cấp, mã không trùng, đủ ý và cụm', () => {
  const ids = new Set<string>();
  for (const goal of ['cefr-a1', 'cefr-a2']) for (const form of GATE_FORMS[goal]!) {
    const ts = GATE_WS[form]!;
    assert.ok(ts, form);
    assert.deepEqual(ts.map(t => t.kind), ['w', 'w', 's'], form);
    for (const t of ts) {
      assert.equal(t.lv, goal === 'cefr-a1' ? 'A1' : 'A2', t.id);
      assert.ok(!ids.has(t.id), t.id); ids.add(t.id);
      assert.ok(t.c.length >= 3 && t.u.length >= 3, t.id);
      assert.ok(t.min >= 20 && t.max > t.min, t.id);
    }
  }
  // A2 Key: tin nhắn ≥ 25 từ, chuyện ≥ 35 từ
  assert.deepEqual(GATE_WS['a2-1']!.filter(t => t.kind === 'w').map(t => t.min), [25, 35]);
});

test('v140 chấm Viết = 60% luật + 40% ý tự đánh dấu; Nói = 30% đủ số từ + 70% ý; bài trống thì thấp', () => {
  const [w, , s] = GATE_WS['a2-1']!;
  const all = w!.c.map(() => true), none = w!.c.map(() => false);
  assert.equal(wsPct(w!, 40, [[true, 'a'], [true, 'b']], all), 1);
  assert.equal(wsPct(w!, 40, [[true, 'a'], [false, 'b']], none), 0.3);
  assert.equal(wsPct(s!, 40, [], s!.c.map(() => true)), 1);
  assert.equal(wsPct(s!, 15, [], s!.c.map(() => false)), 0.15);
  assert.equal(wordsOf("I'm going to the park, then I’ll eat."), 8);
});

test('v140 mở khi vững ≥ 80%; qua thì lên cấp kế; kết quả lưu phần Viết / Nói qua sanitize', () => {
  assert.equal(GATE.open, 0.8);
  assert.equal(NEXT_LV['cefr-a1'], 'cefr-a2');
  assert.equal(NEXT_LV['cefr-a2'], 'cefr-b1');
  const base = { form: 'a2-1', goal: 'cefr-a2', day: 5, n: 22, ok: 18, theta: 3, se: 0.4, p: 0.9, lo: 2.5, hi: 3.5, passed: true, secs: 600, sk: {} };
  const sv = sanitizeGate({ done: { 'a2-1': { ...base, ws: [{ id: 'g-a2-1-w1', kind: 'w', pct: 0.8, words: 30 }, { id: 'x', kind: 'z', pct: 2 }, { id: 'g-a2-1-s1', kind: 's', pct: 1.7, words: 40 }] } } })!;
  assert.deepEqual(sv.done['a2-1']!.ws, [{ id: 'g-a2-1-w1', kind: 'w', pct: 0.8, words: 30 }, { id: 'g-a2-1-s1', kind: 's', pct: 1, words: 40 }]);
  assert.equal(sanitizeGate({ done: { 'a2-1': base } })!.done['a2-1']!.ws, undefined);
});
