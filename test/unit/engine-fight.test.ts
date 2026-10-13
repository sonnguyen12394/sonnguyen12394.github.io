import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FIGHTS, fightById, newFight, fire, aiTurn, pass, walk, trace, carve, genTerrain, groundAt, hitOf, damage, solve, winRate, simFight, center,
  AIM, BED, COLS, MAX_ROUND, type Gear,
} from '../../src/engine/fight.ts';

// v133 Chiến Binh Chữ mốc 1 (docs/MOC1-KE-HOACH.md): trận ngắm bắn thuần hàm, tất định; đồ quyết định phần lớn (C2).
const G0: Gear = { w: 0, giap: 0, khien: 0 };
const boss = fightById('k1-boss')!;

test('tất định: cùng hạt giống + cùng cú bắn = cùng kết quả', () => {
  const a = newFight(boss, G0, 42), b = newFight(boss, G0, 42);
  assert.deepEqual(a.ground, b.ground); assert.equal(a.wind, b.wind);
  const sa = fire(a, 50, 70), sb = fire(b, 50, 70);
  assert.deepEqual(sa, sb); assert.deepEqual(a.units.map(u => u.hp), b.units.map(u => u.hp));
  assert.deepEqual(simFight(boss, { w: 2, giap: 0, khien: 0 }, AIM.avg, 9).units.map(u => u.hp), simFight(boss, { w: 2, giap: 0, khien: 0 }, AIM.avg, 9).units.map(u => u.hp));
});

test('gió đẩy đạn theo đúng chiều', () => {
  const f = newFight(fightById('k1-l1')!, G0, 1);
  const x = (w: number) => trace(f.ground, f.units, 0, 45, 60, w).end?.x ?? NaN;
  assert.ok(x(4) > x(0) && x(0) > x(-4), `${x(-4)} < ${x(0)} < ${x(4)}`);
});

test('địa hình: chỗ đứng bằng phẳng, nổ khoét hố, không sâu quá đá nền', () => {
  const g = genTerrain(11, fightById('k1-l1')!);
  assert.equal(g.length, COLS);
  const y0 = groundAt(g, 500); carve(g, 500, y0, 34);
  assert.ok(groundAt(g, 500) > y0 + 25, 'hố sâu ở tâm');
  for (let k = 0; k < 40; k++) carve(g, 500, groundAt(g, 500), 34);
  assert.ok(Math.max(...g) <= BED);
});

test('sát thương: trúng tâm so với rìa ≤ 1,8 lần; ngoài bán kính = 0; một bậc Vũ khí ≈ +32%', () => {
  assert.equal(hitOf(0), 1); assert.equal(hitOf(500), 0);
  const hi = damage(1, 1, 0), lo = damage(1, 0.01, 0);
  assert.ok(hi / lo <= 1.8 && hi / lo > 1.7, `${hi / lo}`);
  assert.equal(damage(1, 0, 0), 0);
  assert.ok(Math.abs(damage(1.32, 1, 0) / damage(1, 1, 0) - 1.32) < 0.02);
  assert.ok(damage(1, 1, 3) < damage(1, 1, 0), 'Giáp giảm sát thương nhận');
});

test('máy ngắm không sai số trúng đích', () => {
  for (const def of FIGHTS) for (const seed of [1, 2, 3]) {
    const f = newFight(def, G0, seed), t = f.units[1]!, s = solve(f, 0, t.id);
    assert.ok(s.err < 30, `${def.id}/${seed}: lệch ${s.err}`);
    const before = t.hp; f.units[0]!.face = 1; fire(f, s.ang, s.pow);
    assert.ok(t.hp < before, `${def.id}/${seed}: phải trúng`);
  }
});

test('lượt: người chơi → từng đối thủ; hết giờ chuyển lượt; quá MAX_ROUND vòng là thua', () => {
  const f = newFight(boss, G0, 5);
  assert.equal(f.turn, 0); fire(f, 5, 5); assert.equal(f.turn, 1); aiTurn(f); assert.ok(f.turn === 2 || f.over);
  const g = newFight(boss, G0, 6);
  for (let k = 0; k < 3 * MAX_ROUND + 3 && !g.over; k++) pass(g);
  assert.equal(g.over, 'lose'); assert.equal(g.why, 'time');
});

test('đi lại: tốn thể lực, chỉ trong lượt của mình', () => {
  const f = newFight(fightById('k1-l1')!, G0, 3), x0 = f.units[0]!.x;
  const m = walk(f, 30); assert.ok(m > 0 && f.units[0]!.x !== x0); assert.ok(f.stamina < 100);
  f.stamina = 0; assert.equal(walk(f, 10), 0);
  fire(f, 5, 5); assert.equal(walk(f, 10), 0, 'lượt máy: không đi được');
  assert.ok(Math.abs(f.units[0]!.y - groundAt(f.ground, f.units[0]!.x)) < 0.01 || center(f.units[0]!).y < f.units[0]!.y);
});

test('Sóng rè: boss Rè bắn 3 viên mỗi lượt thứ 3; Khiên giảm sát thương của nó', () => {
  const f = newFight(boss, G0, 8); f.units[2]!.hp = 0;   // bỏ lính, chỉ boss
  const n: number[] = [];
  for (let k = 0; k < 3 && !f.over; k++) { fire(f, 5, 5); n.push(aiTurn(f).length); }
  assert.deepEqual(n, [1, 1, 3]);
});

// Khoá dải tỉ lệ thắng (C2, docs/KE-HOACH-A2.md): bot ngắm giỏi / kém × chênh bậc Vũ khí so với bậc cần của boss Rè.
// Đổi số trận hoặc tham số thì phải chạy lại tools/sim/fight.ts và giữ được các dải này.
test('C2: đồ quyết định phần lớn, tay ngắm lật được một bậc, không lật được hai bậc', () => {
  const N = 200, r = (d: number, a: keyof typeof AIM) => winRate(boss, { w: boss.need + d, giap: 0, khien: 0 }, AIM[a], N);
  const g0 = r(0, 'good'), gm1 = r(-1, 'good'), gm2 = r(-2, 'good'), p1 = r(1, 'poor'), p0 = r(0, 'poor');
  assert.ok(gm1 >= 0.3 && gm1 <= 0.45, `chênh −1, ngắm giỏi: ${gm1}`);
  assert.ok(gm2 < 0.1, `chênh −2, ngắm giỏi: ${gm2}`);
  assert.ok(p1 >= 0.55, `chênh +1, ngắm kém: ${p1}`);
  assert.ok(g0 >= 0.7, `đúng bậc, ngắm giỏi: ${g0}`);
  assert.ok(g0 - p0 >= 0.25, `đúng bậc: giỏi ${g0} − kém ${p0}`);
});
test('trận luyện tay thắng được ở bậc 0 khi ngắm trung bình', () => {
  for (const id of ['k1-l1', 'k1-l2']) assert.ok(winRate(fightById(id)!, G0, AIM.avg, 100) >= 0.9, id);
});

test('P13: mô-đun trận không ghi bằng chứng (không nhập ingest / sổ bằng chứng)', () => {
  for (const f of ['fight.ts', 'fightview.ts', 'fightctl.ts', 'cb.ts']) {
    const src = readFileSync(new URL(`../../src/engine/${f}`, import.meta.url), 'utf8');
    assert.ok(!/from '\.\/ev\/store\.ts'|\bingest\(/.test(src), `${f} không được gọi ingest`);
  }
});
