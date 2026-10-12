import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dots, MAX_DOTS } from '../../src/engine/dots.ts';
import { world } from '../../src/engine/worldmap.ts';
import { town } from '../../src/engine/town.ts';
import { freshE } from '../../src/engine/state.ts';

const none = { story: false, bag: 0, fading: 0, puzzle: false, deco: false };

test('v131 chấm đỏ: chỉ khi có việc làm được ngay; không có việc thì không chấm', () => {
  assert.deepEqual(dots(none), []);
  assert.deepEqual(dots({ ...none, bag: 2 }), ['bag']);
  assert.deepEqual(dots({ ...none, puzzle: true }), ['puzzle']);
});

test('v131 chấm đỏ: tối đa 3 chấm, theo thứ tự lợi ích học (ôn từ sắp quên trước, trang trí sau cùng)', () => {
  const all = dots({ story: true, bag: 1, fading: 4, puzzle: true, deco: true });
  assert.equal(all.length, MAX_DOTS);
  assert.deepEqual(all, ['signs', 'story', 'bag']);
  assert.deepEqual(dots({ ...none, deco: true, puzzle: true }), ['puzzle', 'notice']);
});

test('v131 bản đồ: chấm đỏ gắn đúng công trình, ghim truyện là "Bạn & Tí"', () => {
  const w = world({ b: town(freshE()), act: 1, done: false, plan: [], played: [], next: null, dots: dots({ ...none, story: true, fading: 1 }) });
  assert.deepEqual(w.places.filter(p => p.dot).map(p => p.id).sort(), ['signs', 'story']);
  assert.equal(w.places.find(p => p.id === 'story')!.vi, 'Bạn & Tí');
  assert.equal(world({ b: town(freshE()), act: 0, done: false, plan: [], played: [], next: null }).places.filter(p => p.dot).length, 0);
});
