import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deal, judge, stars, family, distinct, sanitizePuzzle, mergePuzzle, type PzGroup } from '../../src/engine/puzzle.ts';

const grp = (node: string, topic: string, ws: string[]): PzGroup => ({ node, topic, vi: topic, words: ws.map(w => ({ id: w, en: w, vi: w })) });

test('v77 Câu đố ngày: 16 ô theo seed, mỗi nhóm đúng 4 ô; chấm đúng / gần đúng (3 cùng nhóm) / sai', () => {
  const a = deal(42, 4), b = deal(42, 4);
  assert.deepEqual(a, b); assert.equal(a.length, 16);
  for (let g = 0; g < 4; g++) assert.equal(a.filter(t => t[0] === g).length, 4);
  assert.deepEqual(judge([2, 2, 2, 2]), { res: 'ok', g: 2 });
  assert.equal(judge([1, 1, 1, 3]).res, 'near');
  assert.equal(judge([0, 0, 1, 1]).res, 'no');
  assert.equal(judge([0, 0, 0]).res, 'no');
});

test('v77: sai không mất gì — chỉ bớt sao, luôn có ít nhất 1 sao', () => {
  assert.equal(stars(0), 3); assert.equal(stars(2), 2); assert.equal(stars(9), 1);
});

test('v77: họ chủ đề — cụm gần nghĩa cùng họ, cụm trừu tượng không dùng; khớp đầu từ (weather ≠ eat, transport ≠ sport)', () => {
  assert.equal(family('Days of the Week'), 'time'); assert.equal(family('Months and Seasons (1)'), 'time'); assert.equal(family('Telling the Time'), 'time');
  assert.equal(family('Food & Drink'), 'food'); assert.equal(family('Fruit and Vegetables'), 'food'); assert.equal(family('Meals'), 'food');
  assert.equal(family('Weather & Seasons'), 'nature'); assert.equal(family('Directions & Transport'), 'travel');
  assert.equal(family('Articles and Determiners'), null); assert.equal(family('Personal Pronouns'), null);
  assert.equal(family('Phrasal Verbs: Work and Study'), null); assert.equal(family('Idioms: Study and Work'), null);
  assert.equal(family('Injuries and Treatment'), 'body'); assert.equal(family('Free Time'), 'leisure');
});

test('v77: bàn chỉ có cụm khác họ và không trùng chữ', () => {
  const gs = [
    grp('u:1', 'Days of the Week', ['monday', 'tuesday', 'friday', 'sunday']),
    grp('u:2', 'Months and Dates (2)', ['june', 'july', 'march', 'april']),        // cùng họ "time" → bỏ
    grp('u:3', 'Food', ['bread', 'rice', 'egg', 'soup']),
    grp('u:4', 'Personal Pronouns', ['he', 'she', 'it', 'we']),                    // trừu tượng → bỏ
    grp('u:5', 'Animals', ['cat', 'dog', 'egg', 'cow']),                           // trùng "egg" → bỏ
    grp('u:6', 'Animals', ['cat', 'dog', 'bird', 'cow']),
    grp('u:7', 'Clothes', ['shirt', 'hat', 'coat', 'shoe']),
  ];
  assert.deepEqual(distinct(gs).map(g => g.node), ['u:1', 'u:3', 'u:6', 'u:7']);
});

test('v77: bản lưu telemetry — sanitize / gộp hai máy lấy lớn nhất', () => {
  assert.equal(sanitizePuzzle('x'), undefined);
  assert.deepEqual(sanitizePuzzle({ runs: 2.6, best: 9, days: -1 }), { runs: 3, best: 3, days: 0, last: 0, stars: 0 });
  assert.deepEqual(mergePuzzle({ runs: 1, best: 2, days: 4, last: 10, stars: 5 }, { runs: 3, best: 1, days: 2, last: 12, stars: 4 }), { runs: 3, best: 2, days: 4, last: 12, stars: 5 });
});
