import { test } from 'node:test';
import assert from 'node:assert/strict';
import { layout, size, points, sanitizeBubbles, mergeBubbles, WORDS } from '../../src/engine/bubbles.ts';

test('v76 Bắt Âm: bố cục 3 bong bóng theo seed, không chồng nhau; điểm sai = 0 (không trừ); cỡ theo chuỗi có giới hạn', () => {
  const l = layout(3, 1);
  assert.deepEqual(l, layout(3, 1)); assert.equal(l.length, 3);
  assert.ok(l[0]!.x < l[1]!.x && l[1]!.x < l[2]!.x && l[1]!.x - l[0]!.x >= 20);
  assert.equal(points(false, 5), 0); assert.equal(points(true, 1), 10); assert.equal(points(true, 3), 20);
  assert.equal(size(0), 1); assert.ok(size(50) <= 1.35);
  assert.equal(WORDS, 10);
});

test('v76 Bắt Âm: bản lưu telemetry — màn bắt đầu từ 1, gộp hai máy lấy lớn nhất', () => {
  assert.equal(sanitizeBubbles('x'), undefined);
  assert.deepEqual(sanitizeBubbles({ best: 9, stage: 0 }), { best: 9, runs: 0, stage: 1, day: 0 });
  assert.deepEqual(mergeBubbles({ best: 1, runs: 3, stage: 4, day: 2 }, { best: 5, runs: 1, stage: 2, day: 9 }), { best: 5, runs: 3, stage: 4, day: 9 });
});
