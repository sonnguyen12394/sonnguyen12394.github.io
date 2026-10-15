import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  FIGHTS, fightById, newFight, step, choose, simFight, winRate, edgeOf, atkOf, timeLeft, DT, T, TIER_MUL, type Gear, type Fight, type Enemy,
} from '../../src/engine/fight.ts';
import { CHAR_IDS } from '../../src/engine/fightmeta.ts';

// v134 Chiến Binh Chữ: trận kiểu Chaos Orbit (thay trận ngắm bắn v133). Thuần hàm, tất định; đồ quyết định phần lớn (C2).
const G0: Gear = { w: 0, giap: 0, khien: 0 };
const boss = fightById('k1-boss')!, l1 = fightById('k1-l1')!;
const still = { mx: 0, my: 0 };
const run = (f: Fight, sec: number, inp = still) => { for (let k = 0; k < sec / DT && !f.over; k++) { if (f.pick) choose(f, 0); else step(f, inp); } };
// Đặt một con quái đứng sát người chơi (để đo sát thương nhận).
const foe = (f: Fight, over: Partial<Enemy> = {}): Enemy => {
  f.en.length = 0;
  const x: Enemy = { type: 'normal', x: f.p.x, y: f.p.y, r: 13, hp: 1e9, max: 1e9, spd: 0, dmg: 10, xp: 0, gc: 0, kb: 0, boss: false, elite: false, slow: 1, slowT: 0, burn: 0, burnT: 0, hcd: 1e9, dead: false, flash: 0, mcd: 1e9, scd: 1e9, pulse: 0, ...over };
  f.en.push(x); return x; };

test('tất định: cùng hạt giống + cùng điều khiển = cùng kết quả', () => {
  const a = simFight(boss, { w: 2, giap: 0, khien: 0 }, 'avg', 9), b = simFight(boss, { w: 2, giap: 0, khien: 0 }, 'avg', 9);
  assert.deepEqual([a.over, a.why, a.t, a.kills, a.p.hp, a.p.level], [b.over, b.why, b.t, b.kills, b.p.hp, b.p.level]);
  const c = newFight(l1, G0, 3), d = newFight(l1, G0, 3);
  run(c, 10, { mx: 1, my: 0.3 }); run(d, 10, { mx: 1, my: 0.3 });
  assert.deepEqual(c.en.map(e => [e.x, e.y, e.hp]), d.en.map(e => [e.x, e.y, e.hp]));
});

test('Vũ khí: đúng bậc cần = ngang quái khu; thiếu bậc tụt mạnh (thiếu 2 bậc < 30%), dư bậc mạnh hơn', () => {
  assert.equal(edgeOf(boss, { w: 2 }), atkOf(2));
  const r = (w: number) => edgeOf(boss, { w }) / edgeOf(boss, { w: 2 });
  assert.ok(r(1) < 0.6 && r(1) > 0.45, `thiếu 1: ${r(1)}`);
  assert.ok(r(0) < 0.3, `thiếu 2: ${r(0)}`);
  assert.ok(r(3) > 1.8, `dư 1: ${r(3)}`);
  assert.ok(Math.abs(newFight(boss, { w: 3, giap: 0, khien: 0 }, 1).w.damage / newFight(boss, { w: 2, giap: 0, khien: 0 }, 1).w.damage - r(3)) < 1e-9);
  assert.ok(TIER_MUL > 1);
});

test('Giáp giảm sát thương nhận; DASH cho bất tử ngắn và có hồi chiêu', () => {
  const hit = (giap: number) => { const f = newFight(l1, { w: 0, giap, khien: 0 }, 1); foe(f); const h0 = f.p.hp; step(f, still); return h0 - f.p.hp; };
  assert.ok(hit(0) > 0); assert.ok(hit(3) < hit(0), `${hit(3)} < ${hit(0)}`);
  const f = newFight(l1, G0, 1); step(f, { mx: 1, my: 0, dash: true });
  assert.ok(f.p.iframe > 0 && f.p.dashCd > 0, 'dash: bất tử + hồi');
  foe(f); const h0 = f.p.hp; step(f, still); assert.equal(f.p.hp, h0, 'đang bất tử không mất máu');
  const cd = f.p.dashCd; step(f, { mx: 0, my: 0, dash: true }); assert.ok(f.p.dashCd < cd, 'đang hồi thì không dash lại');
});

test('lên cấp: dừng trận tới khi chọn 1 trong 3; chọn xong áp dụng nâng cấp', () => {
  const f = newFight(l1, G0, 4); f.en.length = 0; f.orbs.push({ x: f.p.x, y: f.p.y, v: 50, pull: true });
  step(f, still);
  assert.ok(f.pick && f.pick.opts.length === 3, 'mở 3 thẻ');
  const t = f.t; step(f, { mx: 1, my: 0 }); assert.equal(f.t, t, 'đang chọn thì trận dừng');
  const n = f.pick!.opts.indexOf('blade'), c0 = f.w.count;
  while (f.pick) choose(f, 0);
  assert.ok(f.p.level >= 2);
  if (n === 0) assert.equal(f.w.count, c0 + 1);
});

test('trận luyện tay: sống đủ thời gian là thắng; hết máu là thua', () => {
  const f = newFight(l1, G0, 2); f.en.length = 0; T.sp_r0 = T.sp_r1 = T.sp_r2 = T.sp_r3 = T.sp_r4 = T.sp_r5 = 0;
  try { run(f, l1.dur + 1); } finally { Object.assign(T, { sp_r0: 3.2, sp_r1: 4.8, sp_r2: 7, sp_r3: 10, sp_r4: 13, sp_r5: 16 }); }
  assert.equal(f.over, 'win'); assert.ok(timeLeft(f) <= 0);
  const g = newFight(l1, G0, 2); foe(g, { dmg: 1e6 }); step(g, still);
  assert.deepEqual([g.over, g.why], ['lose', 'dead']);
});

test('boss: ra đúng giờ; hạ boss là thắng; quá hạn là thua vì hết giờ; Khiên giảm Sóng rè', () => {
  const f = newFight(boss, { w: 9, giap: 9, khien: 0 }, 3);
  f.t = boss.dur - DT / 2; f.en.length = 0; step(f, still);
  assert.ok(f.boss, 'boss ra'); assert.equal(f.boss!.hp, Math.round(boss.boss!.hp * atkOf(boss.need)));
  f.boss!.hp = 1; f.boss!.x = f.p.x + f.w.radius; f.boss!.y = f.p.y; f.boss!.hcd = 0;
  run(f, 3); assert.equal(f.over, 'win');
  const g = newFight(boss, G0, 3); g.t = boss.dur; g.en.length = 0; step(g, still); g.boss!.hp = 1e12; g.p.hp = 1e9; g.p.maxHp = 1e9;
  run(g, boss.boss!.lim + 2); assert.deepEqual([g.over, g.why], ['lose', 'time']);
  const shock = (khien: number) => { const h = newFight(boss, { w: 2, giap: 0, khien }, 5); h.t = boss.dur; h.en.length = 0; step(h, still); const b = h.boss!; b.x = h.p.x + 120; b.y = h.p.y; b.scd = 0; b.mcd = 1e9; const h0 = h.p.hp; step(h, still); return h0 - h.p.hp; };
  assert.ok(shock(0) > 0); assert.ok(shock(3) < shock(0), `${shock(3)} < ${shock(0)}`);
});

// Khoá dải tỉ lệ thắng (C2, docs/KE-HOACH-A2.md; giữ đúng dải của bản v133): bot né giỏi / kém × chênh bậc Vũ khí so với bậc cần của boss Rè.
// Đổi tham số thì chạy lại tools/sim/fight.ts (npm run fightsim) và giữ được các dải này.
test('C2: đồ quyết định phần lớn, tay né lật được một bậc, không lật được hai bậc', () => {
  const N = 60, r = (d: number, a: 'good' | 'avg' | 'poor') => winRate(boss, { w: boss.need + d, giap: 0, khien: 0 }, a, N);
  const g0 = r(0, 'good'), gm1 = r(-1, 'good'), gm2 = r(-2, 'good'), p1 = r(1, 'poor'), p0 = r(0, 'poor');
  assert.ok(gm1 >= 0.2 && gm1 <= 0.45, `chênh −1, né giỏi: ${gm1}`);
  assert.ok(gm2 < 0.1, `chênh −2, né giỏi: ${gm2}`);
  assert.ok(p1 >= 0.55, `chênh +1, né kém: ${p1}`);
  assert.ok(g0 >= 0.7, `đúng bậc, né giỏi: ${g0}`);
  assert.ok(g0 - p0 >= 0.25, `đúng bậc: giỏi ${g0} − kém ${p0}`);
});
test('trận luyện tay thắng được ở bậc 0 khi né trung bình', () => {
  for (const id of ['k1-l1', 'k1-l2']) { const w = winRate(fightById(id)!, G0, 'avg', 40); assert.ok(w >= 0.85, `${id}: ${w}`); }
});
test('nhân vật ngang sức: tỉ lệ thắng boss (đúng bậc, né TB) lệch Orbiter ≤ 20 điểm', () => {
  const N = 30, base = winRate(boss, { w: 2, giap: 0, khien: 0 }, 'avg', N, 1, 'orbiter');
  for (const ch of CHAR_IDS) { const w = winRate(boss, { w: 2, giap: 0, khien: 0 }, 'avg', N, 1, ch); assert.ok(Math.abs(w - base) <= 0.2, `${ch}: ${w} so với ${base}`); }
});

test('mọi trận có định nghĩa hợp lệ', () => {
  assert.deepEqual(FIGHTS.map(f => f.id), ['k1-l1', 'k1-l2', 'k1-boss']);
  for (const f of FIGHTS) assert.ok(f.dur > 0 && f.rate > 0 && f.tip.length > 10);
});

test('P13: mô-đun trận không ghi bằng chứng (không nhập ingest / sổ bằng chứng)', () => {
  for (const f of ['fight.ts', 'fightmeta.ts', 'fightview.ts', 'fightctl.ts', 'cb.ts']) {
    const src = readFileSync(new URL(`../../src/engine/${f}`, import.meta.url), 'utf8');
    assert.ok(!/from '\.\/ev\/store\.ts'|\bingest\(/.test(src), `${f} không được gọi ingest`);
  }
});
