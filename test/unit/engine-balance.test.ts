import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rate } from '../../tools/sim/levels.ts';
import { findPathVia, goalCells, keepGoalReachable, goalWord, sawtooth, N, COLS, ROWS, type Cell } from '../../src/engine/wordhunt.ts';

// v98 (GAME-CRITERIA §10.10): độ khó Mỏ Chữ cân bằng mô phỏng (người chơi giả điển hình chơi bằng đúng hàm của game). Khoá dải tỉ lệ thắng
// để sửa luật sau này không làm vỡ nhịp răng cưa: màn từ là màn thở, màn rương không còn "gần như không qua được", màn mốc khó hơn đầu chương.
test('v98 cân độ khó: màn từ ≥ 90 %, trung bình màn mục tiêu 60–90 %, màn mốc 30 ≤ 80 %, không màn nào dưới 40 %', () => {
  const ls = [4, 5, 6, 8, 11, 14, 17, 26, 29, 30, 35, 40];
  const w = Object.fromEntries(ls.map(L => [L, rate(L, 24).win]));
  for (const L of ls) assert.ok(w[L]! >= 0.4, `màn ${L}: ${w[L]}`);
  assert.ok(w[6]! >= 0.9, 'màn từ là màn thở');
  const goals = ls.filter(L => L !== 6), avg = goals.reduce((a, L) => a + w[L]!, 0) / goals.length;
  assert.ok(avg >= 0.6 && avg <= 0.9, `trung bình ${avg}`);
  assert.ok(w[30]! <= 0.8, `màn mốc 30 phải siết (≤ 80 %): ${w[30]}`);
});

test('v98 nhịp răng cưa: đầu chương nới lượt, màn mốc siết; rương thêm lượt', () => {
  assert.ok(sawtooth(11, 'ice') > sawtooth(17, 'ice'));
  assert.ok(sawtooth(20, 'ice') < sawtooth(19, 'ice'));
  assert.equal(sawtooth(14, 'chest') - sawtooth(14, 'words'), 2);
});

test('v98 bảo đảm nước đi: rương kẹt ở hàng sát đáy → có từ 3 chữ đi qua đúng ô bên dưới; goalWord chọn từ phá ô then chốt', () => {
  const g: Cell[] = Array.from({ length: N }, (_, i) => ({ ch: 'q', sp: '' as const, id: i }));
  const c = (ROWS - 2) * COLS + 2; g[c] = { ch: '', sp: 'chest', id: 999 };
  const under = (ROWS - 1) * COLS + 2, ice = new Array<boolean>(N).fill(false);
  assert.deepEqual(goalCells(g, ice), [under]);
  assert.equal(findPathVia(g, 'cat', under), null, 'lưới toàn q: chưa có đường');
  assert.equal(keepGoalReachable(g, ice, ['cat', 'dog'], 3, new Set()), 1);
  const w = goalWord(g, ice, ['cat', 'dog'])!;
  assert.ok(w.path.includes(under), 'gợi ý đi qua ô dưới rương');
  assert.equal(keepGoalReachable(g, ice, ['cat', 'dog'], 4, new Set()), 0, 'đã có đường thì không gieo nữa');
});
