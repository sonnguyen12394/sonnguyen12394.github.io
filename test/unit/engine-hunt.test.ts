import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { COLS, ROWS, N, adjacent, findPath, newLevel, applyWord, keepSolvable, points, huntStars, huntCurve, dailyHunt, wordOf, sanitizeHunt, mergeHunt, freshHuntSave, type Mission } from '../../src/engine/wordhunt.ts';
import type { Lex } from '../../src/engine/wordwheel.ts';

const WL = JSON.parse(readFileSync('content/wordlist.json', 'utf8')) as Record<string, string>;
const LEX: Lex[] = Object.entries(WL).map(([en, lv], i) => ({ en, vi: `nghĩa ${en}`, lv, node: `u:x${i % 50}`, id: en }));
const M = (en: string, target = true): Mission => ({ en, vi: 'nghĩa', node: 'u:t', id: en, target });

test('v95 Mỏ Chữ: ô kề nhau gồm cả chéo, không gồm chính nó', () => {
  assert.equal(adjacent(0, 1), true); assert.equal(adjacent(0, COLS + 1), true); assert.equal(adjacent(0, 2), false);
  assert.equal(adjacent(COLS - 1, COLS), false, 'không nối mép phải sang mép trái');
  assert.equal(adjacent(5, 5), false);
});

test('v95 Mỏ Chữ: màn mới gieo đủ từ nhiệm vụ thành đường kề; ưu tiên từ của cụm engine chọn; cùng seed cùng màn', () => {
  const pool = ['cat', 'milk', 'bread', 'apple', 'water', 'rice'].map(w => M(w)).concat(['house', 'green'].map(w => M(w, false)));
  for (let s = 1; s < 40; s++) {
    const lv = newLevel(s, pool, { missions: 4, maxLen: 5, spare: 6 })!;
    assert.ok(lv); assert.equal(lv.grid.length, N); assert.equal(lv.missions.length, 4);
    assert.ok(lv.missions.every(m => m.target), 'đủ từ của cụm thì không lấy từ ngoài');
    for (const m of lv.missions) { const p = findPath(lv.grid, m.en)!; assert.ok(p, `${m.en} có đường (seed ${s})`); assert.equal(wordOf(lv.grid, p), m.en); for (let k = 1; k < p.length; k++) assert.ok(adjacent(p[k - 1]!, p[k]!)); }
    assert.equal(lv.moves, 4 * 2 + 6);
  }
  assert.deepEqual(newLevel(5, pool, { missions: 3, maxLen: 5, spare: 6 }), newLevel(5, pool, { missions: 3, maxLen: 5, spare: 6 }));
});

test('v95 Mỏ Chữ: vỡ ô → chữ trên rơi xuống, lấp đủ lưới; từ ≥ 5 chữ để lại đá quý; đá quý vỡ cả hàng', () => {
  const lv = newLevel(3, [M('bread'), M('milk'), M('cat')], { missions: 3, maxLen: 5, spare: 6 })!;
  const p = findPath(lv.grid, 'bread')!;
  const a = applyWord(lv.grid, p, 9, lv.nextId);
  assert.equal(a.grid.length, N); assert.ok(a.grid.every(Boolean));
  assert.equal(a.broken.length, 5);
  assert.equal(a.grid.filter(x => x.sp === 'gem').length, 1, 'từ 5 chữ để lại một đá quý');
  assert.equal(new Set(a.grid.map(x => x.id)).size, N, 'id ô không trùng');
  // Ô không vỡ giữ nguyên chữ, chỉ rơi xuống trong cột.
  const kept = lv.grid.filter((_, i) => !p.includes(i)).map(x => x.id);
  assert.ok(kept.every(id => a.grid.some(x => x.id === id)));
  const gi = a.grid.findIndex(x => x.sp === 'gem'), g2 = a.grid.map(x => ({ ...x }));
  const rowOf = Math.floor(gi / COLS), b = applyWord(g2, [gi], 4, a.nextId);
  assert.equal(b.broken.length, COLS, 'ô đá quý vỡ cả hàng');
  assert.ok(b.broken.every(i => Math.floor(i / COLS) === rowOf));
});

test('v95 Mỏ Chữ: nhiệm vụ còn lại luôn tìm được (gieo lại nếu bị phá)', () => {
  const lv = newLevel(11, [M('milk'), M('cat'), M('rice')], { missions: 3, maxLen: 5, spare: 6 })!;
  let g = lv.grid, id = lv.nextId;
  for (let k = 0; k < 15; k++) {   // phá ngẫu nhiên nhiều lần
    const a = applyWord(g, [k % N, (k * 7 + 3) % N].filter((v, i, xs) => xs.indexOf(v) === i), 100 + k, id); g = a.grid; id = a.nextId;
    keepSolvable(g, lv.missions, 200 + k);
    for (const m of lv.missions) assert.ok(findPath(g, m.en), `${m.en} còn đường sau lần phá ${k}`);
  }
});

test('v95 Mỏ Chữ: điểm, sao, đường cong, thử thách ngày, lưu', () => {
  assert.ok(points('bread', false, 0) > points('milk', false, 0) * 1.5);
  assert.equal(points('cat', true, 0), 2 * points('cat', false, 0));
  assert.equal(points('cat', false, 6) - points('cat', false, 0), 30);
  assert.deepEqual([huntStars(8, 14), huntStars(3, 14), huntStars(0, 14)], [3, 2, 1]);
  assert.ok(huntCurve(30).missions >= huntCurve(1).missions && huntCurve(30).spare <= huntCurve(1).spare);
  const d = dailyHunt(20371, LEX)!; assert.ok(d); assert.deepEqual(dailyHunt(20371, LEX), d); assert.ok(d.missions.every(m => !m.target));
  assert.equal(ROWS * COLS, N);
  assert.equal(sanitizeHunt({ lv: 0 })!.lv, 1);
  assert.equal(mergeHunt({ ...freshHuntSave(), lv: 4 }, { ...freshHuntSave(), lv: 7 })!.lv, 7);
});

test('v96 Mỏ Chữ: loại màn xoay vòng, màn mốc mỗi 10 màn có hình băng thiết kế tay', async () => {
  const { goalOf, iceMask, ICE_SHAPES } = await import('../../src/engine/wordhunt.ts');
  assert.deepEqual([1, 2, 3].map(goalOf), ['words', 'words', 'words'], '3 màn đầu chỉ tìm từ (làm quen)');
  assert.deepEqual(new Set([4, 5, 6, 7, 8, 9].map(goalOf)), new Set(['words', 'ice', 'chest']));
  assert.equal(goalOf(10), 'ice'); assert.equal(goalOf(20), 'ice');
  const tim = iceMask(10, 1), want = ICE_SHAPES.tim!.join('').split('').map(c => c === '#');
  assert.deepEqual(tim, want, 'màn 10 = hình trái tim');
  const m = iceMask(7, 3); for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) assert.equal(m[r * COLS + c], m[r * COLS + COLS - 1 - c], 'băng thường đối xứng trái – phải');
});

test('v96 Mỏ Chữ: rương không có chữ, không bị gieo đè, không bị đá quý phá; tới đáy thì thu và lưới lấp lại', async () => {
  const { goalLevel, collectChests, breakIce, usable } = await import('../../src/engine/wordhunt.ts');
  const pool = ['cat', 'milk', 'bread', 'rice', 'tea'].map(w => M(w));
  let lv = null; let L = 4; while (!lv || lv.goal !== 'chest') { lv = goalLevel(L, pool, { missions: 3, maxLen: 5, spare: 6 }, L); L++; }
  const chestIdx = lv.grid.map((c, i) => (c.sp === 'chest' ? i : -1)).filter(i => i >= 0);
  assert.equal(chestIdx.length, lv.chests); assert.ok(chestIdx.every(i => i < COLS), 'rương ở hàng trên cùng');
  assert.ok(lv.grid.filter(c => c.sp === 'chest').every(c => !usable(c) && c.ch === ''));
  for (const m of lv.missions) assert.ok(findPath(lv.grid, m.en), 'nhiệm vụ vẫn có đường khi có rương');
  // Đẩy rương xuống: phá cả cột bên dưới rương đầu.
  const c0 = chestIdx[0]! % COLS, below = Array.from({ length: ROWS - 1 }, (_, r) => (r + 1) * COLS + c0);
  const a = applyWord(lv.grid, below, 7, lv.nextId, true);
  assert.equal(a.grid[(ROWS - 1) * COLS + c0]!.sp, 'chest', 'rương rơi xuống đáy');
  const col2 = collectChests(a.grid, 9, a.nextId);
  assert.ok(col2.got >= 1); assert.equal(col2.grid.length, N); assert.ok(col2.grid.every(Boolean));
  const ice = [true, false, true]; assert.equal(breakIce(ice, [0, 1]), 1); assert.deepEqual(ice, [false, false, true]);
});

test('v96 Mỏ Chữ: đá quý phá hàng chừa rương; goalWord ưu tiên từ có trên lưới chạm băng / dưới rương', async () => {
  const { goalLevel, goalWord } = await import('../../src/engine/wordhunt.ts');
  const pool = ['cat', 'milk', 'bread', 'rice', 'tea'].map(w => M(w));
  let lv = null; let L = 4; while (!lv || lv.goal !== 'chest') { lv = goalLevel(L, pool, { missions: 3, maxLen: 5, spare: 6 }, L); L++; }
  const ci = lv.grid.findIndex(c => c.sp === 'chest'), gi = ci % COLS === 0 ? 1 : ci - 1;   // ô đá quý cùng hàng với rương
  const g = lv.grid.map((c, i) => (i === gi ? { ...c, sp: 'gem' as const } : c));
  const a = applyWord(g, [gi], 5, lv.nextId, true);
  assert.equal(a.grid.filter(c => c.sp === 'chest').length, lv.chests, 'đá quý không phá rương');
  assert.ok(!a.gemRow.includes(ci));
  // goalWord: chỉ trả từ có đường thật trên lưới; có băng thì chọn từ đi qua ô băng.
  const words = lv.missions.map(m => m.en), ice = new Array<boolean>(N).fill(false), p0 = findPath(lv.grid, words[0]!)!;
  ice[p0[0]!] = true;
  const w = goalWord(lv.grid, ice, words)!;
  assert.ok(w && findPath(lv.grid, w.word));
  assert.ok(w.path.some(i => ice[i] || i % COLS === ci % COLS), 'ưu tiên từ phá băng hoặc kéo rương');
  assert.equal(goalWord(lv.grid, ice, ['zzzzz']), null, 'không có từ trên lưới → null');
});
