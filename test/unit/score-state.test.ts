import { test } from 'node:test';
import assert from 'node:assert/strict';
import { norm, countWords, textCorrect, markItem } from '../../src/exam/score.ts';
import { migrateX, sanitizeX, mergeX, freshX } from '../../src/exam/state.ts';
import type { Group, Item } from '../../src/exam/content.ts';

const g: Group = { id: 'g1', kind: 'reading', exams: ['ielts-ac'], qtype: 'r-sentence', level: 'B2', band: 6, mode: 'practice', title: 't', instr: 'i', paras: ['x'], items: [] };
const it = (ans: Item['ans'], extra: Partial<Item> = {}): Item => ({ id: 'i1', q: 'q', ans, b: 6, ev: { p: 0, s: 'x' }, why: 'v', ...extra });

test('chuẩn hoá và đếm từ theo quy ước IELTS', () => {
  assert.equal(norm('  The “Library”. '), 'the "library');
  assert.equal(norm('1,500'), '1500');
  assert.equal(norm('well-known'), 'well known');
  assert.deepEqual(countWords('well-known city'), { words: 2, nums: 0 });
  assert.deepEqual(countWords('15 May'), { words: 1, nums: 1 });
});

test('câu điền: đúng chính tả, đúng giới hạn từ, chấp nhận mạo từ', () => {
  const a = { accept: ['library'] };
  assert.equal(textCorrect('Library', a, 2), true);
  assert.equal(textCorrect('the library', a, 2), true);
  assert.equal(textCorrect('the library', a, 1), false);   // vượt giới hạn
  assert.equal(textCorrect('libary', a, 2), false);        // sai chính tả
  assert.equal(textCorrect('', a, 2), false);
  assert.equal(textCorrect('15 May', { accept: ['15 May', 'May 15'] }, 1, true), true);
  assert.equal(textCorrect('15 May', { accept: ['15 May'] }, 1, false), false);
});

test('chấm trắc nghiệm một và nhiều đáp án', () => {
  assert.deepEqual(markItem(it('B', { opts: [{ k: 'A', t: 'a' }, { k: 'B', t: 'b' }] }), g, 'B'), { got: 1, of: 1 });
  assert.deepEqual(markItem(it('B'), g, 'A'), { got: 0, of: 1 });
  assert.deepEqual(markItem(it(['A', 'C']), g, ['C', 'A']), { got: 2, of: 2 });
  assert.deepEqual(markItem(it(['A', 'C']), g, ['A', 'B']), { got: 1, of: 2 });
  assert.deepEqual(markItem(it(['A', 'C']), g, ['A', 'B', 'C']), { got: 0, of: 2 });
  assert.deepEqual(markItem(it({ accept: ['river'] }, { limit: 1 }), g, 'River'), { got: 1, of: 1 });
  assert.deepEqual(markItem(it({ accept: ['river'] }), g, undefined), { got: 0, of: 1 });
});

test('dữ liệu ôn thi: nâng cấp, lọc dữ liệu xấu, gộp hai máy không mất gì', () => {
  assert.deepEqual(migrateX(undefined), freshX());
  const bad = sanitizeX({ v: 1, exam: 'toefl', mins: 99999, attempts: [{ id: '<x>', exam: 'vstep' }, { id: 'm1', exam: 'vstep', total: 40, correct: 99, day: 5 }], nb: { 'ok-1': { s: -5 }, '!!': {} } });
  assert.equal(bad.exam, '');
  assert.equal(bad.mins, 600);
  assert.equal(bad.attempts.length, 1);
  assert.equal(bad.attempts[0]!.correct, 40);
  assert.deepEqual(Object.keys(bad.nb), ['ok-1']);
  assert.equal(bad.nb['ok-1']!.s, 0.1);
  const a = sanitizeX({ v: 1, exam: 'ielts-ac', attempts: [{ id: 'm1', exam: 'ielts-ac', day: 1, total: 40, correct: 30, skill: 'R' }], nb: { q1: { last: 5, s: 2 } } });
  const b = sanitizeX({ v: 1, exam: 'vstep', share: true, attempts: [{ id: 'm1', exam: 'ielts-ac', day: 1, total: 40, correct: 30, skill: 'R' }, { id: 'm2', exam: 'ielts-ac', day: 2, total: 40, correct: 20, skill: 'L' }], nb: { q1: { last: 9, s: 7 }, q2: { last: 1 } } });
  const m = mergeX(a, b);
  assert.equal(m.exam, 'ielts-ac');
  assert.equal(m.share, false);
  assert.equal(m.attempts.length, 2);
  assert.equal(m.nb.q1!.s, 7);
  assert.ok(m.nb.q2);
});
