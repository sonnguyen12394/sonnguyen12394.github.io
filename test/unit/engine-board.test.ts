import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TILES, SIZE, roll, move, build, canBuild, price, toll, freshBoardSave, sanitizeBoard, mergeBoard, HOME_BONUS } from '../../src/engine/board.ts';
import { picker, planFloor, type Enc } from '../../src/engine/quest.ts';
import { rank } from '../../src/engine/nba.ts';

test('v73 Bàn Cờ: xúc xắc theo seed (1–6), đi vòng, về Nhà / đi qua nhà mình được xu, không bao giờ trừ xu', () => {
  const xs = Array.from({ length: 200 }, (_, n) => roll(7, n));
  assert.ok(xs.every(d => d >= 1 && d <= 6)); assert.deepEqual(xs, Array.from({ length: 200 }, (_, n) => roll(7, n)));
  assert.equal(new Set(xs).size, 6);
  const s = freshBoardSave(); s.pos = SIZE - 2; s.lots[2] = 2;
  const m = move(s, 5);   // 14 → 15, 0 (Nhà), 1, 2 (nhà cấp 2) → dừng ở 3
  assert.equal(m.to, 3); assert.equal(m.lap, true); assert.equal(m.bonus, HOME_BONUS + toll(2)); assert.equal(s.laps, 1);
  assert.ok(m.bonus >= 0);
});

test('v73 Bàn Cờ: xây nhà chỉ ở lô đất, đủ xu, tối đa cấp 3; xu đã tiêu được ghi lại', () => {
  const s = freshBoardSave(), lot = TILES.findIndex(t => t.t === 'lot'), enc = TILES.findIndex(t => t.t === 'enc');
  assert.equal(canBuild(s, enc, 999), false);
  assert.equal(canBuild(s, lot, price(0) - 1), false);
  assert.equal(build(s, lot, 1000), price(0)); assert.equal(build(s, lot, 1000), price(1)); assert.equal(build(s, lot, 1000), price(2));
  assert.equal(build(s, lot, 1e6), 0); assert.equal(s.lots[lot], 3); assert.equal(s.spent, price(0) + price(1) + price(2));
});

test('v73 Bàn Cờ: bản lưu sanitize / gộp hai máy (không tiêu hai lần, nhà lấy cấp cao hơn)', () => {
  assert.equal(sanitizeBoard('x'), undefined);
  const a = sanitizeBoard({ pos: 99, lots: [5, 0, 9], spent: -3, runs: 2 })!;
  assert.equal(a.pos, SIZE - 1); assert.equal(a.lots[0], 0, 'ô Nhà không có nhà'); assert.equal(a.lots[2], 3); assert.equal(a.spent, 0);
  const b = { ...freshBoardSave(), lots: Array(SIZE).fill(0).map((_, i) => (i === 6 ? 2 : 0)), spent: 120, runs: 5 };
  const m = mergeBoard(a, b)!;
  assert.equal(m.lots[2], 3); assert.equal(m.lots[6], 2); assert.equal(m.spent, 120); assert.equal(m.runs, 5);
});

test('v73: xúc xắc chỉ đổi LOẠI cảnh — phần học ưu tiên của lộ trình vẫn đến theo đúng thứ tự NBA, đi đường nào cũng vậy', () => {
  const open = ['u:a', 'u:b', 'u:c', 'u:d', 'u:e'].map((node, i) => ({ node, level: 3 as const, minutes: 10, score: 5 - i, dep: 5 - i, goals: ['g'] }));
  const acts = rank({ open, probe: null, review: { items: 0, mins: 0, risk: 0 }, verify: [] });
  const base = { acts, open, review: ['u:r1', 'u:r2'], can: () => true, started: () => true, floor: 1 };
  const learnOrder = (seq: Enc[]) => { const p = picker(base); return seq.map(k => p(k)).filter(c => c?.gameType === 'monster').map(c => c!.node); };
  const a = learnOrder(['monster', 'chest', 'monster', 'camp', 'monster']), b = learnOrder(['chest', 'chest', 'monster', 'monster', 'scout', 'monster']);
  assert.deepEqual(a, ['u:a', 'u:b', 'u:c']); assert.deepEqual(b.slice(0, 3), a, 'cùng thứ tự, chỉ khác số lượt');   // trinh sát không có gì để dò → quái kế tiếp
  // planFloor (tháp) vẫn cho đúng kết quả như trước khi tách picker
  assert.equal(planFloor(base).length, 8);
});
