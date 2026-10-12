import { test } from 'node:test';
import assert from 'node:assert/strict';
import { poolOf, grade, tierOf, pickItem, step, startLevel, maxLevel, coverage, areaOf, FORGEABLE, type FItem } from '../../src/engine/forge.ts';

// v129 Lò rèn năng lực (GAME-CRITERIA §16): đề lấy từ nội dung của nút, bậc = mức đạt thật, rèn từ dưới / vượt bậc, độ phủ cấp.
const SRC = {
  probe: [
    { id: 'p1', level: 1, g: 0.25, prompt: 'nghĩa của "apple"?', opts: ['táo', 'cam', 'lê', 'nho'], ans: 0 },
    { id: 'p2', level: 2, g: 0.25, prompt: 'chọn từ cho "táo"', opts: ['pear', 'apple', 'grape', 'lime'], ans: 1 },
    { id: 'p3', level: 3, g: 0, prompt: 'gõ "táo"', accept: ['apple'] },
  ],
  order: [{ id: 'o1', level: 3, g: 0, prompt: 'xếp câu', tokens: ['I', 'like', 'apples'], distract: ['likes'] }],
  fix: [{ id: 'f1', level: 4, prompt: 'sửa câu', bad: 'I likes apples.', accept: ['I like apples.'], why: 'I + like' }],
  transfer: [{ id: 't1', level: 3, g: 0, prompt: 'câu lạ', accept: ['apples'] }],
};

test('v129 đề lấy từ các nguồn của app, giữ mức và đoán mò của câu; câu ngữ cảnh mới đánh dấu novel', () => {
  const pool = poolOf(SRC, 3);
  assert.deepEqual(pool.map(x => [x.id, x.level, x.kind]), [['p1', 1, 'mcq'], ['p2', 2, 'mcq'], ['p3', 3, 'typed'], ['t1', 3, 'typed'], ['o1', 3, 'order'], ['f1', 4, 'fix']]);
  assert.equal(pool.find(x => x.id === 'p1')!.g, 0.25);
  assert.ok(pool.find(x => x.id === 't1')!.novel);
  const o = pool.find(x => x.id === 'o1')!;
  assert.deepEqual([...o.tiles!].sort(), ['I', 'apples', 'like', 'likes'], 'lá thừa (lỗi hay gặp) trộn vào');
  assert.equal(maxLevel(pool), 4);
});

test('v129 chấm: chọn, gõ (không phân biệt hoa thường, dấu chấm cuối), xếp lá, sửa câu', () => {
  const pool = poolOf(SRC, 3), by = (id: string) => pool.find(x => x.id === id)!;
  assert.ok(grade(by('p1'), { pick: 0 }).ok); assert.ok(!grade(by('p1'), { pick: 2 }).ok);
  assert.ok(grade(by('p3'), { text: ' Apple. ' }).ok); assert.ok(!grade(by('p3'), { text: 'aple' }).ok); assert.ok(!grade(by('p3'), { text: '' }).ok);
  const o = by('o1'), ord = ['I', 'like', 'apples'].map(w => o.tiles!.indexOf(w));
  assert.ok(grade(o, { order: ord }).ok);
  assert.ok(!grade(o, { order: ['I', 'likes', 'apples'].map(w => o.tiles!.indexOf(w)) }).ok);
  const f = grade(by('f1'), { text: 'i like apples' }); assert.ok(f.ok); assert.equal(f.right, 'I like apples.');
});

test('v129 bậc = mức cao nhất đang Đạt; chọn câu đúng mức, thiếu thì mức dưới, tránh câu vừa gặp, ưu tiên câu lạ ở mức cao', () => {
  assert.equal(tierOf(() => false), 0);
  assert.equal(tierOf(l => l <= 3), 3);
  const pool = poolOf(SRC, 3);
  assert.equal(pickItem(pool, 2, new Set(), new Set(), 0)!.id, 'p2');
  assert.equal(pickItem(pool, 5, new Set(), new Set(), 0)!.id, 'f1', 'không có mức 5 → mức 4');
  assert.equal(pickItem(pool, 1, new Set(['p1']), new Set(), 0)!.id, 'p1', 'chỉ còn câu đã gặp thì vẫn dùng');
  const l3 = [0, 1, 2].map(s => pickItem(pool, 3, new Set(['p3']), new Set(), s)!.id);
  assert.ok(l3.every(id => id !== 'p3'), 'tránh câu vừa trả lời');
  assert.equal(pickItem(pool, 1, new Set(), new Set(['p1']), 0), null, 'hết câu chưa dùng ở mức ≤ 1');
  const hi: FItem[] = [{ id: 'a', level: 4, g: 0, kind: 'typed', prompt: '', accept: ['x'] }, { id: 'b', level: 4, g: 0, kind: 'typed', prompt: '', accept: ['x'], novel: true }];
  assert.equal(pickItem(hi, 4, new Set(), new Set(), 0)!.id, 'b');
});

test('v129 hai cách rèn: từ dưới đi từng bậc (đúng 2 câu liền thì lên); vượt bậc bắt đầu ở mức mục tiêu, sai thì lùi một bậc', () => {
  assert.equal(startLevel('up', 0, 3, 4), 1); assert.equal(startLevel('up', 2, 3, 4), 3);
  assert.equal(startLevel('jump', 0, 3, 4), 3); assert.equal(startLevel('jump', 3, 3, 4), 4); assert.equal(startLevel('jump', 0, 4, 2), 2, 'không quá mức có câu');
  let r = { mode: 'up' as const, cur: 1, top: 3, streak: 0 };
  r = { ...r, ...step(r, true) }; assert.deepEqual([r.cur, r.streak], [1, 1]);
  r = { ...r, ...step(r, true) }; assert.deepEqual([r.cur, r.streak], [2, 0]);
  r = { ...r, ...step(r, false) }; assert.deepEqual([r.cur, r.streak], [2, 0], 'từ dưới: sai thì ở lại');
  let j = { mode: 'jump' as const, cur: 3, top: 4, streak: 0 };
  j = { ...j, ...step(j, false) }; assert.equal(j.cur, 2);
  j = { ...j, ...step(j, false) }; j = { ...j, ...step(j, false) }; assert.equal(j.cur, 1, 'không dưới mức 1');
  const t = { mode: 'up' as const, cur: 3, top: 3, streak: 1 }; assert.equal(step(t, true).cur, 3, 'không quá mức cao nhất');
});

test('v129 bản đồ phủ: nhóm theo loại kỹ năng, đếm đã đạt, liệt kê phần thiếu; chỉ u/g/ph/fn rèn được', () => {
  const rows = [
    { node: 'u:food', vi: 'Đồ ăn', need: 3 as const, tier: 3, pass: true, area: areaOf('u:food') },
    { node: 'u:home', vi: 'Nhà', need: 3 as const, tier: 1, pass: false, area: areaOf('u:home') },
    { node: 'g:past', vi: 'Quá khứ', need: 3 as const, tier: 0, pass: false, area: areaOf('g:past') },
    { node: 'cd:a2-r1', vi: 'Đọc thông báo', need: 3 as const, tier: 0, pass: false, area: areaOf('cd:a2-r1') },
  ];
  const cv = coverage(rows);
  assert.deepEqual([cv.done, cv.total], [1, 4]);
  assert.deepEqual(cv.by.map(b => [b.area, b.done, b.total]), [['u', 1, 2], ['g', 0, 1], ['other', 0, 1]]);
  assert.deepEqual(cv.missing.map(m => m.node), ['u:home', 'g:past', 'cd:a2-r1']);
  assert.ok(FORGEABLE.test('u:x') && FORGEABLE.test('fn:x') && !FORGEABLE.test('cd:x') && !FORGEABLE.test('x:read'));
});
