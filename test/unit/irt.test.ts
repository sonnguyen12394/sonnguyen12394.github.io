import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pCorrect, information, estimate, margin, bandOf, pickNext, type IrtItem, type Response } from '../../src/exam/irt.ts';

// Bộ sinh số giả ngẫu nhiên cố định để test lặp lại được.
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
}

test('xác suất đúng tăng theo năng lực, có sàn đoán mò', () => {
  const it: IrtItem = { b: 6, c: 0.25 };
  assert.ok(pCorrect(4, it) < pCorrect(6, it) && pCorrect(6, it) < pCorrect(8, it));
  assert.ok(pCorrect(0, it) >= 0.25);
  assert.equal(pCorrect(6, { b: 6 }), 0.5);
});

test('thông tin lớn nhất gần độ khó của câu', () => {
  const it: IrtItem = { b: 6 };
  assert.ok(information(6, it) > information(4, it));
  assert.ok(information(6, it) > information(8, it));
});

test('ước tính hội tụ về năng lực thật với sai số giảm dần', () => {
  const R = rng(42);
  for (const truth of [4, 5.5, 7, 8]) {
    const bank: IrtItem[] = Array.from({ length: 300 }, (_, i) => ({ b: 2.5 + (i % 13) * 0.5, c: i % 3 ? 0.25 : 0 }));
    const resp: Response[] = [];
    let est = estimate(resp);
    const used = new Set<IrtItem>();
    for (let k = 0; k < 40; k++) {
      const it = pickNext(est.theta, bank.filter(x => !used.has(x)), information, 3, R)!;
      used.add(it);
      resp.push({ item: it, correct: R() < pCorrect(truth, it) });
      est = estimate(resp);
    }
    assert.ok(Math.abs(est.theta - truth) < 1, `truth ${truth} est ${est.theta.toFixed(2)}`);
    assert.ok(est.se < 0.6, `se ${est.se}`);
  }
});

test('sai số hiển thị và band làm tròn', () => {
  assert.equal(margin(0.1), 0.5);
  assert.equal(margin(0.5), 1);
  assert.equal(margin(0.8), 1.5);
  assert.equal(bandOf(6.24), 6);
  assert.equal(bandOf(6.25), 6.5);
  assert.equal(bandOf(12), 9);
});
