import { test } from 'node:test';
import assert from 'node:assert/strict';
import { town, freshTown, canDeco, buyDeco, spend, decoPrice, sanitizeTown, mergeTown, DECO, SPOTS } from '../../src/engine/town.ts';
import { freshE, sanitizeE, mergeE } from '../../src/engine/state.ts';

test('v91 Phố: mỗi công trình 4 món trang trí, món thứ k cần ★ thứ k và đủ xu; giá tăng dần; mua thì ghi sổ chi', () => {
  assert.deepEqual(Object.keys(DECO).sort(), SPOTS.map(s => s.game).sort());
  assert.ok(Object.values(DECO).every(d => d.length === 4));
  const e = freshE(); e.gq = { stars: 23, runs: 4, best: 6, day: 1 };   // quán 2 ★
  const cafe = town(e).find(b => b.game === 'cafe')!, t = freshTown();
  assert.equal(canDeco(t, cafe, 10).why, 'cần 30 xu');
  assert.equal(buyDeco(t, cafe, 100), true);
  assert.equal(buyDeco(t, cafe, 70), true);
  assert.deepEqual([t.deco.cafe, t.spent], [2, decoPrice(0) + decoPrice(1)]);
  assert.equal(canDeco(t, cafe, 1000).why, 'cần ★ thứ 3', 'món thứ 3 chờ ★ thứ 3');
  const fog = town(e).find(b => b.game === 'fog')!;
  assert.equal(canDeco(t, fog, 1000).ok, false, 'công trình chưa xây thì chưa trang trí');
});

test('v91 sổ chi chung: hồi tim chỉ khi đủ xu; lưu / gộp hai máy không mất món đã mua', () => {
  const t = freshTown();
  assert.equal(spend(t, 20, 25), false); assert.equal(t.spent, 0);
  assert.equal(spend(t, 30, 25), true); assert.equal(t.spent, 25);
  assert.equal(sanitizeTown(null), undefined);
  assert.deepEqual(sanitizeTown({ spent: -3, deco: { cafe: 9, nope: 2 } }), { spent: 0, deco: { cafe: 4 } });
  assert.deepEqual(mergeTown({ spent: 50, deco: { cafe: 1 } }, { spent: 90, deco: { cafe: 2, garden: 1 } }), { spent: 90, deco: { cafe: 2, garden: 1 } });
  const m = mergeE(sanitizeE({ ...freshE(), tw: { spent: 30, deco: { cafe: 1 } } }), { ...freshE(), tw: { spent: 60, deco: { board: 1 } } });
  assert.deepEqual(m.tw, { spent: 60, deco: { cafe: 1, board: 1 } });
});
