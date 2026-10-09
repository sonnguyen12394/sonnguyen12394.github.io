import { test } from 'node:test';
import assert from 'node:assert/strict';
import { N, SHAPES, freshBlocks, deal, canPlace, place, fits, anyFits, trayEmpty, anchor, sanitizeBlocks, mergeBlocks, bumpStreak, freshBlocksSave, type Piece } from '../../src/engine/blocks.ts';
import { planFloor, QUEST_VER, type Enc } from '../../src/engine/quest.ts';
import { rank } from '../../src/engine/nba.ts';

test('v72 Xếp Khối: cùng seed → cùng chuỗi khối; khối thường độc lập với câu hỏi (chỉ phụ thuộc seed và số lần chia)', () => {
  const a = freshBlocks(42), b = freshBlocks(42);
  assert.deepEqual(deal(a), deal(b));
  assert.deepEqual(deal(a), deal(b));
  const c = freshBlocks(42); deal(c);
  const sp = deal(c, 'bomb');   // đúng → thêm khối đặc biệt, 3 khối thường không đổi
  assert.equal(sp.length, 4); assert.equal(sp[3]!.sp, 'bomb');
  assert.deepEqual(sp.slice(0, 3), a.tray.slice(0, 3));
});

test('v72 Xếp Khối: đặt khối, đầy hàng / cột thì xoá, combo, điểm; không đặt chồng hoặc ra ngoài bàn', () => {
  const st = freshBlocks(1), bar: Piece = { s: SHAPES.findIndex(x => x.length === 4 && x.every(([r]) => r === 0)), c: 1 };
  st.tray = [bar, bar];
  assert.equal(canPlace(st.g, bar, 0, 5), false, 'ra ngoài bàn');
  assert.ok(place(st, 0, 0, 0));
  assert.equal(place(st, 1, 0, 2), null, 'chồng lên khối');
  const r = place(st, 1, 0, 4)!;
  assert.equal(r.cleared, 1); assert.equal(st.g.slice(0, N).every(v => v === 0), true, 'hàng đầy đã xoá');
  assert.equal(st.combo, 1); assert.ok(st.score >= 8 + 10);
  assert.ok(trayEmpty(st));
});

test('v72 Xếp Khối: bom nổ 3 × 3, sét xoá hàng + cột; hết chỗ thì anyFits = false', () => {
  const st = freshBlocks(3);
  st.g = Array(N * N).fill(2);
  const big: Piece = { s: SHAPES.length - 1, c: 1 };
  st.tray = [big];
  assert.equal(fits(st.g, big), false); assert.equal(anyFits(st), false);
  st.tray = [{ s: 0, c: 0, sp: 'bomb' }];
  const b = place(st, 0, 4, 4)!;
  assert.equal(b.boom.length >= 9, true);
  st.g = Array(N * N).fill(3); st.tray = [{ s: 0, c: 0, sp: 'bolt' }];
  place(st, 0, 2, 5);
  for (let k = 0; k < N; k++) { assert.equal(st.g[2 * N + k], 0); assert.equal(st.g[k * N + 5], 0); }
});

test('v72 Xếp Khối: ô neo là ô đầu tiên của hình (khối lệch không bị đặt sai chỗ)', () => {
  for (let s = 0; s < SHAPES.length; s++) { const [r, c] = anchor({ s, c: 1 }); assert.ok(SHAPES[s]!.some(([a, b]) => a === r && b === c)); }
});

test('v72 Xếp Khối: bản lưu chỉ là telemetry — sanitize, gộp hai máy, chuỗi ngày không phạt', () => {
  assert.equal(sanitizeBlocks(null), undefined);
  assert.deepEqual(sanitizeBlocks({ best: -5, runs: 'x', day: 3.4, streak: 2 }), { best: 0, runs: 0, day: 3, streak: 2 });
  assert.deepEqual(mergeBlocks({ best: 10, runs: 2, day: 5, streak: 3 }, { best: 30, runs: 1, day: 4, streak: 9 }), { best: 30, runs: 2, day: 5, streak: 3 });
  const s = freshBlocksSave(); bumpStreak(s, 10); bumpStreak(s, 10); assert.equal(s.streak, 1); bumpStreak(s, 11); assert.equal(s.streak, 2); bumpStreak(s, 20); assert.equal(s.streak, 1);
});

test('v72: thứ tự cảnh của game khác (Xếp Khối) dùng chung bộ chọn nội dung của tháp; id lượt có tiền tố game', () => {
  const open = ['u:a', 'u:b', 'u:c'].map((node, i) => ({ node, level: 3 as const, minutes: 10, score: 3 - i, dep: 3 - i, goals: ['g'] }));
  const acts = rank({ open, probe: null, review: { items: 0, mins: 0, risk: 0 }, verify: [] });
  const order: Enc[] = ['chest', 'monster', 'monster', 'camp', 'boss'];
  const plan = planFloor({ acts, open, review: ['u:r'], can: () => true, started: () => true, floor: 3, order, tag: 'b' });
  assert.equal(plan.length, 5);
  assert.equal(plan[0]!.gameType, 'chest'); assert.equal(plan[0]!.node, 'u:r');
  assert.ok(plan.every(c => c.id.startsWith(`${QUEST_VER}:b3:`)));
  // Tháp không đổi khi không truyền order / tag
  const tower = planFloor({ acts, open, review: [], can: () => true, started: () => true, floor: 3 });
  assert.equal(tower.length, 8); assert.ok(tower.every(c => c.id.startsWith(`${QUEST_VER}:3:`)));
});
