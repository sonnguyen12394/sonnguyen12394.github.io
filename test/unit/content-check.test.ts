import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkGroup, checkKeyBalance, levelReport } from '../../src/content/check.ts';
import { levelOf, tokens, candidates } from '../../src/content/lemma.ts';
import type { Group } from '../../src/exam/content.ts';

const list = JSON.parse(readFileSync(new URL('../../content/wordlist.json', import.meta.url), 'utf8')) as Record<string, string>;

const para = 'Many people in the city now ride bicycles to work. The local council has built new cycle lanes, and the number of cyclists has doubled in two years. However, some drivers complain that the lanes make traffic worse at busy times. The council says it will study the problem next year before it builds more lanes.';
const good = (): Group => ({
  id: 'test-tfng-01', kind: 'reading', exams: ['ielts-ac'], qtype: 'r-tfng', level: 'B2', band: 5.5, mode: 'place',
  title: 'Cycling in the city', instr: 'Do the following statements agree with the information in the text?', paras: [para],
  options: [{ k: 'TRUE', t: 'TRUE' }, { k: 'FALSE', t: 'FALSE' }, { k: 'NOT GIVEN', t: 'NOT GIVEN' }],
  items: [{
    id: 'test-tfng-01-1', q: 'The number of cyclists has fallen.', ans: 'FALSE', b: 5,
    ev: { p: 0, s: 'the number of cyclists has doubled in two years' },
    why: 'Bài nói số người đi xe đạp đã tăng gấp đôi, trái với "fallen" (giảm).',
    wrong: { TRUE: 'Ngược nghĩa với bài: bài nói tăng gấp đôi.', 'NOT GIVEN': 'Bài có nói rõ về số người đi xe đạp nên không phải "không có thông tin".' },
  }],
});

test('nhóm đúng chuẩn không có lỗi', () => {
  assert.deepEqual(checkGroup(good(), list), []);
});

test('bắt lỗi: đáp án không có trong phương án, thiếu giải thích tiếng Việt, câu trích sai', () => {
  const g = good();
  g.items[0]!.ans = 'MAYBE';
  g.items[0]!.why = 'Because the text says so.';
  g.items[0]!.ev.s = 'this sentence is not in the text';
  const msgs = checkGroup(g, list).map(i => i.msg).join('\n');
  assert.match(msgs, /không có trong phương án/);
  assert.match(msgs, /tiếng Việt/);
  assert.match(msgs, /không nằm nguyên văn/);
});

test('bắt lỗi: phương án sai không có lời giải thích, bản dịch lệch số dòng, độ dài sai chuẩn', () => {
  const g = good();
  delete g.items[0]!.wrong;
  g.vi = ['một', 'hai'];
  g.paras = ['Too short.'];
  g.items[0]!.ev.s = 'Too short';
  const msgs = checkGroup(g, null).map(i => i.msg).join('\n');
  assert.match(msgs, /vì sao phương án sai/);
  assert.match(msgs, /bản dịch có 2 dòng/);
  assert.match(msgs, /độ dài/);
});

test('câu điền: đáp án phải trong giới hạn từ, có trong bài, máy chấm bắt câu sai', () => {
  const g = good();
  g.qtype = 'r-sentence'; delete g.options;
  g.items = [{ id: 'test-s-1', q: 'The council has built new ___.', ans: { accept: ['cycle lanes'] }, limit: 1, b: 5, ev: { p: 0, s: 'has built new cycle lanes' }, why: 'Bài nói hội đồng đã xây làn xe đạp mới.' }];
  let msgs = checkGroup(g, list).map(i => i.msg).join('\n');
  assert.match(msgs, /vượt giới hạn từ/);
  g.items[0]!.limit = 2;
  assert.deepEqual(checkGroup(g, list), []);
  g.items[0]!.ans = { accept: ['bike roads'] };
  msgs = checkGroup(g, list).map(i => i.msg).join('\n');
  assert.match(msgs, /nguyên văn trong bài/);
});

test('kiểm cấp độ: bài B1 chứa nhiều từ C1–C2 bị bắt; từ được phép (allow) không tính', () => {
  const g = good();
  g.level = 'A2';
  g.paras = ['The ubiquitous juxtaposition of ostensibly benign paradigms exacerbates the conundrum. ' + para];
  g.items[0]!.ev.s = 'the number of cyclists has doubled in two years';
  const r = levelReport(g, list);
  assert.ok(r.ratio > 0.05, String(r.ratio));
  assert.ok(r.overWords.includes('ubiquitous'));
  const msgs = checkGroup(g, list).map(i => i.msg).join('\n');
  assert.match(msgs, /vượt cấp A2/);
});

test('tách từ và tìm dạng gốc', () => {
  assert.deepEqual(tokens('Lan went to Hanoi. She is happy.').map(t => [t.w, t.proper]), [['Lan', false], ['went', false], ['to', false], ['Hanoi', true], ['She', false], ['is', false], ['happy', false]]);
  assert.ok(candidates('studies').includes('study'));
  assert.ok(candidates('stopped').includes('stop'));
  assert.ok(candidates('making').includes('make'));
  assert.equal(levelOf('went', list), 'A1');
  assert.equal(levelOf('the', list), 'A1');
  assert.equal(levelOf('xyzzyq', list), null);
});

test('checkKeyBalance: chặn khi đáp án dồn về một vị trí, cho qua khi rải đều', () => {
  const mk = (keys: string[], multi = false): Group => ({
    id: 'r-mcq-01', kind: 'reading', exams: ['ielts-ac'], qtype: multi ? 'r-mcq2' : 'r-mcq', level: 'B2', band: 6, mode: 'practice', title: 'T', instr: 'Choose.',
    paras: ['x'], items: keys.map((k, i) => ({
      id: `q${i}`, q: 'Q', b: 6, ev: { p: 0, s: 'xxx' }, why: 'vì thế',
      opts: ['A', 'B', 'C', 'D', 'E'].slice(0, multi ? 5 : 4).map(o => ({ k: o, t: o + i })),
      ans: multi ? k.split(',') : k,
    })),
  });
  const skew = mk(['B', 'B', 'B', 'C', 'B', 'A', 'B', 'C', 'B', 'A', 'B', 'C']);
  const msgs = checkKeyBalance([skew]).map(i => i.msg).join(' | ');
  assert.match(msgs, /chỉ nằm ở 3\/4 vị trí/);
  assert.match(msgs, /58%/);
  assert.deepEqual(checkKeyBalance([mk(['A', 'B', 'C', 'D', 'B', 'A', 'D', 'C', 'C', 'D', 'A', 'B'])]), []);
  assert.equal(checkKeyBalance([mk(['B,D', 'B,D', 'A,C', 'B,D', 'C,E', 'A,B'], true)]).length, 1);
  assert.deepEqual(checkKeyBalance([mk(['B,D', 'A,E', 'A,C', 'B,C', 'C,E', 'A,B'], true)]), []);
});
