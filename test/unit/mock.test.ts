import test from 'node:test';
import assert from 'node:assert/strict';
import { expandPart, numbering, scoreMock, mockAdj, testGroups, packsFor, meanB, type MockPart, type MockTest } from '../../src/exam/mock.ts';
import { checkMock } from '../../src/content/check.ts';
import { sanitizeX } from '../../src/exam/state.ts';
import type { Item } from '../../src/exam/content.ts';

const words = (n: number): string => Array.from({ length: n }, (_, i) => `word${i}`).join(' ');

function mc(id: string, b: number, ans = 'A'): Item {
  return { id, q: 'Which?', opts: [{ k: 'A', t: 'one' }, { k: 'B', t: 'two' }, { k: 'C', t: 'three' }], ans, b, ev: { p: 0, s: 'word0' }, why: 'Vì bài nói rõ.' };
}

// Một phần nghe IELTS 10 điểm: 5 câu trắc nghiệm + 1 câu chọn hai (2 điểm) + 3 câu điền.
function lPart(t: string, n: number, b: number, qt2 = 'l-mcq2'): MockPart {
  const id = `m-${t}-l${n}`;
  return {
    id, kind: 'listening', exams: ['ielts-ac', 'ielts-gt'], level: 'B2', band: 6, title: 'Part ' + n,
    script: [{ sp: 'N', t: 'Part ' + n, pause: 20 }, { sp: 'A', t: words(600) }],
    audio: { file: 'a/x.mp3', dur: 300, voices: ['af'] },
    sets: [
      { qtype: n % 2 ? 'l-mcq' : 'l-matching', instr: 'Choose the correct letter, A, B or C.', items: Array.from({ length: 5 }, (_, i) => mc(`${id}-0${i + 1}`, b)) },
      { qtype: qt2, instr: 'Choose TWO letters.', items: [{ ...mc(`${id}-07`, b), ans: ['A', 'B'] }] },
      { qtype: 'l-form', instr: 'Write ONE WORD ONLY.', items: [8, 9, 10].map(k => ({ id: `${id}-${k === 10 ? '' : '0'}${k}`, q: 'Name: ___', ans: { accept: ['word1'] }, limit: 1, b, ev: { p: 1, s: 'word1' }, why: 'Vì bài nói rõ.' })) },
    ],
  };
}

function rPart(t: string, n: number, k: number, b: number): MockPart {
  const id = `m-${t}-r${n}`;
  return {
    id, kind: 'reading', exams: ['ielts-ac'], level: 'B2', band: 6.5, title: 'Passage ' + n, paras: [words(400), words(400)],
    sets: [
      { qtype: 'r-tfng', instr: 'TRUE / FALSE / NOT GIVEN', items: Array.from({ length: k - 6 }, (_, i) => ({ ...mc(`${id}-${String(i + 1).padStart(2, '0')}`, b), opts: undefined, ans: 'TRUE' })), options: [{ k: 'TRUE', t: 'true' }, { k: 'FALSE', t: 'false' }, { k: 'NOT GIVEN', t: 'ng' }] },
      { qtype: n === 1 ? 'r-mcq' : n === 2 ? 'r-headings' : 'r-ynng', instr: 'Choose.', items: Array.from({ length: 6 }, (_, i) => mc(`${id}-${String(k - 5 + i).padStart(2, '0')}`, b)) },
    ],
  };
}

function build(t: string, bL: number[], bR: number[]): { test: MockTest; groups: ReturnType<typeof expandPart> } {
  const ls = [1, 2, 3, 4].map(n => lPart(t, n, bL[n - 1]!)), rs = [rPart(t, 1, 13, bR[0]!), rPart(t, 2, 13, bR[1]!), rPart(t, 3, 14, bR[2]!)];
  return { test: { id: t, exam: 'ielts-ac', title: 'Test ' + t, L: ls.map(p => p.id), R: rs.map(p => p.id) }, groups: [...ls, ...rs].flatMap(expandPart) };
}

test('mở rộng phần: mỗi bộ câu thành một nhóm, dùng chung ngữ liệu, biết thuộc phần nào', () => {
  const gs = expandPart(lPart('a1', 1, 5));
  assert.deepEqual(gs.map(g => g.id), ['m-a1-l1-a', 'm-a1-l1-b', 'm-a1-l1-c']);
  assert.ok(gs.every(g => g.part === 'm-a1-l1' && g.mode === 'mock' && g.script === gs[0]!.script && g.audio?.file === 'a/x.mp3'));
  assert.equal(gs[1]!.qtype, 'l-mcq2');
  assert.equal(expandPart({ ...lPart('a1', 1, 5), sets: [lPart('a1', 1, 5).sets[0]!] })[0]!.id, 'm-a1-l1');
});

test('đánh số câu liên tục 1–40, câu chọn hai chiếm hai số', () => {
  const { test: t, groups } = build('a1', [5, 5.5, 6, 6.5], [6, 6.5, 7]);
  const num = numbering(testGroups(t, 'L', groups));
  assert.deepEqual(num.get('m-a1-l1-01'), [1, 1]);
  assert.deepEqual(num.get('m-a1-l1-07'), [6, 7]);
  assert.deepEqual(num.get('m-a1-l1-10'), [10, 10]);
  assert.deepEqual(num.get('m-a1-l4-10'), [40, 40]);
  assert.deepEqual(packsFor({ ...t, id: 'g1', exam: 'ielts-gt' }, 'L'), ['m-a1']);
});

test('chấm đề: số câu đúng → band theo bảng chính thức; điều chỉnh của đề; dạng câu yếu nhất lên đầu', () => {
  const { test: t, groups } = build('a1', [5, 5.5, 6, 6.5], [6, 6.5, 7]);
  const parts = testGroups(t, 'L', groups), given: Record<string, string | string[]> = {};
  for (const g of parts.flat()) for (const it of g.items) given[it.id] = typeof it.ans === 'string' ? it.ans : Array.isArray(it.ans) ? it.ans : it.ans.accept[0]!;
  // sai hết câu điền (3 câu × 4 phần = 12) → 28/40 → band 6,5 (bảng IDP: 26–29)
  for (const g of parts.flat()) if (g.qtype === 'l-form') for (const it of g.items) given[it.id] = 'nope';
  const s = scoreMock(t, 'L', parts, given);
  assert.equal(s.of, 40); assert.equal(s.got, 28); assert.equal(s.score, 6.5); assert.equal(s.official, true);
  assert.equal(s.byType[0]!.qtype, 'l-form'); assert.equal(s.byType[0]!.got, 0);
  const s2 = scoreMock(t, 'L', parts, given, 2);
  assert.equal(s2.score, 7); assert.equal(s2.official, false);
  const v = scoreMock({ ...t, exam: 'vstep' }, 'L', parts, given);
  assert.equal(v.score, 7);   // 28/40 × 10 = 7
});

test('điều chỉnh bảng theo dữ liệu chỉ khi mọi câu đủ 50 lượt; đề khó hơn được cộng', () => {
  const tests = [{ id: 'a1', items: ['x1', 'x2'] }, { id: 'a2', items: ['y1', 'y2'] }];
  assert.equal(mockAdj(tests, () => ({ n: 10, p: 0.5 })), null);
  const p: Record<string, number> = { x1: 0.9, x2: 0.9, y1: 0.1, y2: 0.3 };
  const a = mockAdj(tests, id => ({ n: 80, p: p[id]! }))!;
  assert.ok(a.a2! > 0 && a.a1! < 0);
});

test('luật đề thi thử: đúng định dạng thì qua; sai tổng, lệch độ khó, phần mồ côi, khó giảm dần thì báo', () => {
  const A = build('a1', [5, 5.5, 6, 6.5], [6, 6.5, 7]), B = build('a2', [5, 5.5, 6, 6.5], [6, 6.5, 7]);
  assert.deepEqual(checkMock([A.test, B.test], [...A.groups, ...B.groups]), []);
  const C = build('a3', [6, 6.5, 7, 7.5], [7, 7.5, 8]);
  const msgs = checkMock([A.test, B.test, C.test], [...A.groups, ...B.groups, ...C.groups]).map(i => i.msg).join('\n');
  assert.match(msgs, /độ khó trung bình .* lệch/);
  const short = { ...A.test, R: A.test.R.slice(0, 2) };
  const m2 = checkMock([short], A.groups).map(i => `${i.where}: ${i.msg}`).join('\n');
  assert.match(m2, /a1\/R: tổng 26 điểm, định dạng cần 40/);
  assert.match(m2, /m-a1-r3: phần đề không thuộc đề nào/);
  const D = build('a4', [7, 6.5, 6, 5], [6, 6.5, 7]);
  assert.match(checkMock([D.test], D.groups).map(i => i.msg).join('\n'), /khó hơn câu cuối/);
  const bad = expandPart({ ...rPart('a1', 1, 13, 6), sets: [{ ...rPart('a1', 1, 13, 6).sets[1]!, items: [mc('m-a1-x-01', 6)] }] });
  assert.match(checkMock([], bad).map(i => i.msg).join('\n'), /bắt đầu bằng id phần/);
  assert.ok(Math.abs(meanB(testGroups(A.test, 'L', A.groups)) - 5.75) < 1e-9);
});

test('đề thi thử: danh sách dùng chung xếp theo thứ tự đáp án thì báo (đoán theo thứ tự được)', async () => {
  const { checkGroup } = await import('../../src/content/check.ts');
  const g = expandPart({ ...rPart('a1', 2, 13, 6), sets: [{ qtype: 'r-headings', instr: 'Choose the correct heading.', options: [{ k: 'i', t: 'one' }, { k: 'ii', t: 'two' }, { k: 'iii', t: 'three' }, { k: 'iv', t: 'four' }],
    items: ['i', 'ii', 'iii'].map((a, n) => ({ ...mc(`m-a1-r2-0${n + 1}`, 6), opts: undefined, ans: a, wrong: { iv: 'Không phải ý chính của đoạn.' } })) }] })[0]!;
  assert.match(checkGroup(g, null).map(i => i.msg).join('\n'), /theo đúng thứ tự/);
  const ok = { ...g, items: g.items.map((it, n) => ({ ...it, ans: ['ii', 'i', 'iii'][n]! })) };
  assert.doesNotMatch(checkGroup(ok, null).map(i => i.msg).join('\n'), /theo đúng thứ tự/);
});

test('bài đang làm dở được làm sạch khi nạp (dữ liệu ngoài không tin cậy)', () => {
  const x = sanitizeX({ v: 3, mockRun: { t: 'a1', sk: 'R', part: 2, left: 99e9, given: { 'm-a1-r1-01': 'TRUE', 'bad id!': 'x', 'm-a1-r1-02': ['A', 'B'], 'm-a1-r1-03': 'x'.repeat(500) }, marked: ['m-a1-r1-01', 5] }, mockLog: { 'a1-R': { d: 3, given: { 'm-a1-r1-01': 'A' } }, 'zz': { d: 1 } } });
  assert.equal(x.mockRun!.sk, 'R');
  assert.equal(x.mockRun!.left, 4 * 3600e3);
  assert.deepEqual(Object.keys(x.mockRun!.given).sort(), ['m-a1-r1-01', 'm-a1-r1-02']);
  assert.deepEqual(x.mockRun!.marked, ['m-a1-r1-01']);
  assert.deepEqual(Object.keys(x.mockLog), ['a1-R']);
  assert.equal(sanitizeX({ v: 3, mockRun: { t: 'A1!', sk: 'R' } }).mockRun, null);
});
