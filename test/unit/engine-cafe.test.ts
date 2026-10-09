import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stars, face, decorOf, DECOR, FACES, sanitizeCafe, mergeCafe } from '../../src/engine/cafe.ts';

test('v75 Quán Cà Phê: sai 0 sao (không trừ), đúng 1, chuỗi ≥ 3 được 2; khách theo seed; trang trí mở theo tổng sao', () => {
  assert.equal(stars(false, 5), 0); assert.equal(stars(true, 1), 1); assert.equal(stars(true, 3), 2);
  assert.equal(face(7, 2), face(7, 2)); assert.ok(FACES.includes(face(1, 0)));
  assert.ok(FACES.every(f => [...f].length === 1), 'emoji một ký tự, không ghép ZWJ');
  assert.equal(decorOf(0).length, 0); assert.equal(decorOf(DECOR[1]!.at).length, 2);
});

test('v75 Quán Cà Phê: bản lưu telemetry — sanitize / gộp hai máy lấy lớn nhất', () => {
  assert.equal(sanitizeCafe(null), undefined);
  assert.deepEqual(sanitizeCafe({ stars: 3.4, runs: -2 }), { stars: 3, runs: 0, best: 0, day: 0 });
  assert.deepEqual(mergeCafe({ stars: 10, runs: 2, best: 4, day: 3 }, { stars: 7, runs: 5, best: 6, day: 1 }), { stars: 10, runs: 5, best: 6, day: 3 });
});
