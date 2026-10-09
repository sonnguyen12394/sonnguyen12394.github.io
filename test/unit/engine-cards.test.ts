import { test } from 'node:test';
import assert from 'node:assert/strict';
import { score, offer, deal, check, target, CHARMS, TABLES, PLAYS, sanitizeCards, mergeCards } from '../../src/engine/cards.ts';

test('v74 Bài Câu: sai = 0 điểm (không trừ); đúng = 10 chip / lá × (1 + chuỗi); bùa chỉ đổi cách tính điểm', () => {
  const p = { ok: true, tiles: 6, question: false, negative: false, first: false };
  assert.deepEqual(score({ ...p, ok: false }, 3, ['long']), { chips: 0, mult: 0, total: 0 });
  assert.equal(score(p, 0, []).total, 60);
  assert.equal(score(p, 2, []).total, 180);
  assert.equal(score({ ...p, tiles: 7 }, 0, ['long']).total, 140);
  assert.equal(score({ ...p, question: true }, 0, ['ask']).chips, 100);
  assert.equal(score(p, 1, ['chain']).mult, 4);
  assert.ok(target(0) < target(1) && target(1) < target(2));
  assert.equal(TABLES * PLAYS, 9);
});

test('v74 Bài Câu: trộn lá và bùa theo seed (độc lập với người học); lá nhiễu nằm trong tay; so câu bỏ qua hoa thường / dấu cuối', () => {
  const t = ['She', 'is', 'a', 'doctor.'], hand = deal(5, 0, t, ['are']);
  assert.deepEqual(hand, deal(5, 0, t, ['are']));
  assert.deepEqual([...hand].sort(), [...t, 'are'].sort());
  assert.equal(check(['she', 'is', 'a', 'doctor'], t), -1);
  assert.equal(check(['She', 'are', 'a', 'doctor.'], t), 1);
  assert.equal(check(['She', 'is', 'a'], t), 3, 'thiếu lá cuối');
  const o = offer(9, 0, []);
  assert.equal(o.length, 2); assert.notEqual(o[0]!.id, o[1]!.id);
  assert.ok(offer(9, 1, CHARMS.slice(0, 5).map(c => c.id)).every(c => c.id === CHARMS[5]!.id));
});

test('v74 Bài Câu: bản lưu telemetry — sanitize / gộp hai máy lấy lớn nhất', () => {
  assert.equal(sanitizeCards(1), undefined);
  assert.deepEqual(sanitizeCards({ best: -1, runs: 2.6, wins: 'x' }), { best: 0, runs: 3, wins: 0, day: 0 });
  assert.deepEqual(mergeCards({ best: 5, runs: 1, wins: 0, day: 3 }, { best: 2, runs: 4, wins: 2, day: 1 }), { best: 5, runs: 4, wins: 2, day: 3 });
});
