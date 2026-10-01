import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { checkGroup, checkKeyBalance, checkLengthCue, levelReport, suggestVariants } from '../../src/content/check.ts';
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

test('suggestVariants: gợi ý từ bổ nghĩa đứng trước đáp án, bỏ qua mạo từ/động từ/đã chấp nhận', () => {
  const g = (q: string, accept: string[], line: string, limit = 3): Group => ({
    id: 'l-short-01', kind: 'listening', exams: ['ielts-ac'], qtype: 'l-short', level: 'B1', band: 5, mode: 'practice', title: 'T', instr: 'Answer.',
    script: [{ sp: 'A', t: line }], items: [{ id: 'x1', q, ans: { accept }, limit, b: 5, ev: { p: 0, s: line.slice(0, 5) }, why: 'vì vậy' }],
  });
  assert.match(suggestVariants([g('Where?', ['red barn'], 'It starts from the big red barn today.')])[0]!.msg, /big red barn/);
  assert.equal(suggestVariants([g('Where?', ['red barn', 'big red barn'], 'It starts from the big red barn.')]).length, 0);
  assert.equal(suggestVariants([g('What?', ['silver'], "so I'll take silver.")]).length, 0);           // động từ
  assert.equal(suggestVariants([g('When?', ['spring'], 'We came in the spring.')]).length, 0);           // mạo từ
  assert.equal(suggestVariants([g('What?', ['meal voucher'], 'You get a free meal voucher.', 2)]).length, 0); // vượt giới hạn
});

test('checkKeyBalance xét cả bài kiểm tra đầu vào (v42: từng 0/48 đáp án ở D mà không bị bắt)', () => {
  const mk = (keys: string[]): Group => ({
    id: 'pl-r-01', kind: 'reading', exams: ['ielts-ac'], qtype: 'pl-r', level: 'B1', band: 5, mode: 'place', title: 'T', instr: 'Choose.',
    paras: ['x'], items: keys.map((k, i) => ({ id: `p${i}`, q: 'Q?', b: 5, ev: { p: 0, s: 'xxx' }, why: 'vì thế', opts: ['A', 'B', 'C', 'D'].map(o => ({ k: o, t: o + i })), ans: k })),
  });
  assert.match(checkKeyBalance([mk(['B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'A', 'B', 'C', 'B'])]).map(i => i.msg).join(' | '), /3\/4 vị trí/);
});

test('checkLengthCue: chặn khi đáp án thường là phương án dài nhất', () => {
  const mk = (cued: number): Group => ({
    id: 'v-r-01', kind: 'reading', exams: ['vstep'], qtype: 'v-r', level: 'B1', band: 5, mode: 'practice', title: 'T', instr: 'Choose.',
    paras: ['x'], items: Array.from({ length: 12 }, (_, i) => ({ id: `c${i}`, q: 'Q?', b: 5, ev: { p: 0, s: 'xxx' }, why: 'vì thế',
      opts: [{ k: 'A', t: i < cued ? 'a much longer key option' : 'key' }, { k: 'B', t: 'short one' }, { k: 'C', t: 'short two' }, { k: 'D', t: i < cued ? 'short' : 'a much longer wrong option' }], ans: 'A' })),
  });
  assert.equal(checkLengthCue([mk(9)]).length, 1);
  assert.deepEqual(checkLengthCue([mk(3)]), []);
});

test('câu hỏi bỏ lửng: phương án phải nối tiếp được (v42: "…it may / Within one generation")', () => {
  const g = (q: string, opts: string[]): Group => ({
    id: 'r-mcq-09', kind: 'reading', exams: ['ielts-ac'], qtype: 'r-mcq', level: 'B2', band: 6, mode: 'practice', title: 'T', instr: 'Choose.',
    paras: [para], items: [{ id: 'r-mcq-09-1', q, b: 6, ev: { p: 0, s: 'the number of cyclists has doubled' }, why: 'Số người đi xe đạp tăng gấp đôi.',
      opts: opts.map((t, i) => ({ k: 'ABCD'[i]!, t })), ans: 'A', wrong: { B: 'Không được nhắc trong bài.', C: 'Không được nhắc trong bài.', D: 'Không được nhắc trong bài.' } }],
  });
  const bad = checkGroup(g('According to the text, the number of cyclists', ['has doubled.', 'Has fallen.', 'has stayed the same.', 'has tripled.']), list).map(i => i.msg).join(' | ');
  assert.match(bad, /bỏ lửng/);
  const ok = checkGroup(g('What does the text say about cyclists?', ['Their number has doubled.', 'Their number has fallen.', 'It stayed the same.', 'It has tripled.']), list).map(i => i.msg);
  assert.ok(!ok.some(m => /bỏ lửng/.test(m)));
  const names = checkGroup(g('The council says that', ['it will study the problem.', 'Malcolm McLean was right.', 'drivers are wrong.', 'lanes are cheap.']), list).map(i => i.msg);
  assert.ok(!names.some(m => /bỏ lửng/.test(m)));   // tên riêng (hai từ viết hoa liền nhau) được phép
});
