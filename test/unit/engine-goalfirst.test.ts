import { test } from 'node:test';
import assert from 'node:assert/strict';
import { autoGoal, startDiag, finished, QUICK_PROBES, MAX_PROBES } from '../../src/engine/diag.ts';

// v64 goal-first: mục tiêu tự đặt sau bài dò = cấp CEFR kế tiếp của phần yếu nhất; bài dò ngắn cho người mới.

test('mục tiêu tự đặt = cấp kế tiếp của phần yếu nhất (từ vựng, ngữ pháp, Nghe/Đọc)', () => {
  assert.equal(autoGoal(0, 0), 'cefr-a1', 'chưa biết gì → A1');
  assert.equal(autoGoal(1, 1), 'cefr-a2', 'đã qua A1 → A2');
  assert.equal(autoGoal(2.5, 1.5), 'cefr-b1', 'ngữ pháp yếu hơn quyết định: biết A2 → B1');
  assert.equal(autoGoal(3, 3, ['A2', null]), 'cefr-b1', 'Nghe/Đọc A2 kéo mục tiêu về B1');
  assert.equal(autoGoal(5, 5), 'cefr-c2');
  assert.equal(autoGoal(9, 9), 'cefr-c2', 'không vượt C2');
});

test('bài dò ngắn dừng sau tối đa 8 phần; bài dò đầy đủ vẫn 16', () => {
  const q = startDiag(0, 0, QUICK_PROBES), f = startDiag(0, 0);
  assert.equal(q.max, QUICK_PROBES); assert.equal(f.max, undefined);
  q.probed = Array.from({ length: QUICK_PROBES }, (_, i) => `u:${i}`);
  assert.equal(finished(q, 1, 99), true);
  f.probed = Array.from({ length: QUICK_PROBES }, (_, i) => `u:${i}`);
  assert.equal(finished(f, 1, 99), false);
  f.probed = Array.from({ length: MAX_PROBES }, (_, i) => `u:${i}`);
  assert.equal(finished(f, 1, 99), true);
});
