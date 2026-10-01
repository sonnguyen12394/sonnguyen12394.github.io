import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newCard, review, retrievability, interval } from '../../src/exam/fsrs.ts';
import { itemStats, corr, shouldHide, MIN_N } from '../../src/exam/stats.ts';

test('FSRS: R(S,S)=0.9, khoảng cách tăng khi nhớ, về 0 khi quên', () => {
  assert.ok(Math.abs(retrievability(10, 10) - 0.9) < 1e-9);
  assert.equal(interval(10), 10);
  let c = newCard(3, 100);
  const first = c.due - 100;
  c = review(c, 3, c.due);
  const second = c.due - c.last;
  assert.ok(second > first, `${first} → ${second}`);
  const forgot = review(c, 1, c.due);
  assert.equal(forgot.due, forgot.last);
  assert.ok(forgot.s < c.s);
  assert.equal(forgot.lapses, 1);
  const easy = review(newCard(3, 0), 4, 3), hard = review(newCard(3, 0), 2, 3);
  assert.ok(easy.s > hard.s);
});

test('phân tích câu: tương quan và tạm ẩn câu phân biệt kém', () => {
  assert.equal(corr([0, 1, 0, 1], [1, 3, 1, 3]), 1);
  assert.equal(corr([1, 1, 1], [1, 2, 3]), null);
  // câu "bad": người giỏi (điểm cao) lại hay sai → độ phân biệt âm
  const rows: Array<Record<string, 0 | 1>> = [];
  for (let i = 0; i < 60; i++) {
    const good = i % 2 === 0;
    rows.push({ q1: good ? 1 : 0, q2: good ? 1 : 0, q3: good ? 1 : 0, bad: good ? 0 : 1 });
  }
  const s = itemStats(rows);
  assert.equal(s.q1!.n, 60);
  assert.ok(s.q1!.rpb! > 0.9);
  assert.ok(s.bad!.rpb! < 0);
  assert.equal(shouldHide(s.bad), true);
  assert.equal(shouldHide(s.q1), false);
  assert.equal(shouldHide({ n: MIN_N - 1, p: 0.5, rpb: -0.5 }), false);
});
