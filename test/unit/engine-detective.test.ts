import { test } from 'node:test';
import assert from 'node:assert/strict';
import { choose, order, options, evidence, sentences, solved, caseStars, sanitizeCase, mergeCase } from '../../src/engine/detective.ts';
import type { ReadText, ReadQ } from '../../src/engine/host.ts';

const q = (k: string, a: string, w = ['x', 'y']): ReadQ => ({ k, q: 'Q ' + a, a, w, why: '' });
const t = (id: string, best: number | null, mine = false): ReadText => ({ id, src: 'lr', lv: 'A1', title: id, tvi: '', kind: 'Bài đọc', mine, best, paras: ['A.'], lines: null, qs: [q('detail', 'a'), q('main', 'b')] });

test('v78 chọn bài: chưa làm (bài của unit đã học trước) → chưa đạt điểm thấp → đã đạt; không lặp bài vừa làm', () => {
  const xs = [t('done', 0.9), t('weak', 0.4), t('new', null), t('mine', null, true)];
  assert.equal(choose(xs, 1)!.id, 'mine');
  assert.equal(choose(xs.filter(x => !x.mine), 1)!.id, 'new');
  assert.equal(choose([t('done', 0.9), t('weak', 0.4)], 1)!.id, 'weak');
  assert.equal(choose([t('a', null), t('b', 0.5)], 3, 'a')!.id, 'b');
  assert.equal(choose([], 1), null);
});

test('v78 manh mối: câu ý chính làm kết luận cuối; ≥ 3 lựa chọn, đáp án đúng vị trí, theo seed', () => {
  const qs = order([q('main', 'M'), q('detail', 'D1'), q('infer', 'I')]);
  assert.deepEqual(qs.map(x => x.a), ['D1', 'I', 'M']);
  const o = options(q('detail', 'right', ['w1', 'w2']), 7);
  assert.equal(o.opts.length, 3); assert.equal(o.opts[o.ans], 'right'); assert.deepEqual(options(q('detail', 'right', ['w1', 'w2']), 7), o);
});

test('v78 tô sáng: câu trong bài chứa đáp án', () => {
  const paras = ['In my family we eat three meals a day. For lunch I eat at school, but dinner is at home. My mother cooks.'];
  assert.equal(sentences(paras).length, 3);
  assert.equal(evidence(paras, { k: 'detail', q: 'Where does the writer eat lunch?', a: 'At school', w: [], why: '' }), 1);
});

test('v78 phá án khi đúng lần đầu ≥ 2/3; sao luôn ≥ 1; bản lưu telemetry gộp lấy lớn nhất', () => {
  assert.equal(solved(2, 3), true); assert.equal(solved(1, 3), false); assert.equal(solved(0, 0), false);
  assert.equal(caseStars(3, 3), 3); assert.equal(caseStars(2, 3), 2); assert.equal(caseStars(0, 3), 1);
  assert.equal(sanitizeCase(1), undefined);
  assert.deepEqual(sanitizeCase({ runs: 2.2, solved: -1 }), { runs: 2, solved: 0, stars: 0, day: 0 });
  assert.deepEqual(mergeCase({ runs: 3, solved: 1, stars: 4, day: 2 }, { runs: 1, solved: 2, stars: 9, day: 5 }), { runs: 3, solved: 2, stars: 9, day: 5 });
});
