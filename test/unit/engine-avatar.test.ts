import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  avatar, tierOf, gearOf, tiers, power, freshAv, sanitizeAv, mergeAv, canBuy, buy, toggleWear, fresh, markSeen, randomLook, itemVi,
  SLOTS, FASH, LEFT, RIGHT, LOOK_MAX,
} from '../../src/engine/avatar.ts';
import type { StatRow } from '../../src/engine/bag.ts';
import { sanitizeE, mergeE, freshE } from '../../src/engine/state.ts';
import { muted, musicOff, soundFrom, toggleMusic } from '../../src/engine/sfx.ts';

const rows = (lv: number): StatRow[] => (['voc', 'gra', 'pro', 'spk', 'lis', 'mem', 'use'] as const).map(id => ({ id, lv, next: '', measured: true }));
const look = { h: 1, hc: 2, sk: 3, ey: 1, mo: 2 };
const layers = (svg: string) => [...svg.matchAll(/data-l="([a-z]+)"/g)].map(m => m[1]);

test('v132 C3/C5: 7 ô trang bị, mỗi ô gắn đúng một chỉ số thật; bậc theo Lv (gỗ 1–2 … kim cương 9–10), Lv 0 = chưa có', () => {
  assert.equal(SLOTS.length, 7);
  assert.deepEqual([...LEFT, ...RIGHT].sort(), [...SLOTS].sort());
  assert.deepEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(tierOf), [0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5]);
  const g = gearOf(rows(7));
  assert.equal(new Set(g.map(r => r.slot)).size, 7);
  assert.ok(g.every(r => r.lv === 7 && r.tier === 4));
  assert.equal(itemVi('pen', 7), 'Bút Vàng +7');
  assert.equal(itemVi('hat', 0), 'Mũ (chưa có)');
});

test('v132 C4: Lực chữ là một con số suy ra từ chỉ số thật, tăng khi chỉ số tăng', () => {
  assert.equal(power(rows(0)), 0);
  assert.ok(power(rows(3)) > power(rows(2)));
  assert.equal(power(rows(10)), 7 * (1000 + 1000));
});

test('v132 C2: nhân vật ghép ≥ 8 lớp theo đúng thứ tự (cánh sau lưng, mặt trước tóc, bút ở trên cùng); không id trùng', () => {
  const full = avatar(look, tiers(gearOf(rows(9))), { label: 'Bạn' });
  const L = layers(full);
  assert.ok(L.length >= 8, L.join(','));
  const at = (k: string) => L.indexOf(k);
  assert.ok(at('wing') < at('coat') && at('coat') < at('face') && at('face') < at('hair') && at('hair') < at('hat') && at('hat') < at('pen'));
  assert.ok(!/\sid="/.test(full), 'SVG nhân vật không dùng id (vẽ nhiều lần trên một trang)');
  assert.match(full, /role="img" aria-label="Bạn"/);
  assert.match(full, /class="av glow"/);                 // kim cương: hào quang
  const bare = avatar(look, {});
  assert.ok(!layers(bare).includes('wing') && !layers(bare).includes('pen'));
  assert.match(bare, /aria-hidden="true"/);
});

test('v132 C7: thời trang đè lớp trang bị; tắt "hiện thời trang" thì thấy lại trang bị', () => {
  const t = tiers(gearOf(rows(5)));
  const plain = avatar(look, t), worn = avatar(look, t, { wear: { hat: 'f-non' } }), hidden = avatar(look, t, { wear: { hat: 'f-non' }, showF: false });
  assert.notEqual(plain, worn);
  assert.equal(plain, hidden);
});

test('v132 C7: mua bằng xu kiếm được; không đủ xu / đã có thì không mua; mua xong tự mặc; ví trừ đúng', () => {
  const av = freshAv(3), f = FASH.find(x => x.id === 'f-non')!;
  assert.deepEqual(canBuy(av, 'f-non', f.price - 1), { ok: false, why: 'coins' });
  assert.equal(buy(av, 'f-non', f.price - 1), false);
  assert.equal(av.spent, 0);
  assert.equal(buy(av, 'f-non', 500), true);
  assert.equal(av.spent, f.price);
  assert.equal(av.wear.hat, 'f-non');
  assert.deepEqual(canBuy(av, 'f-non', 500), { ok: false, why: 'owned' });
  assert.equal(toggleWear(av, 'f-non'), 'off');
  assert.equal(av.wear.hat, undefined);
  assert.equal(toggleWear(av, 'f-cap'), null);            // chưa mua thì không mặc được
  assert.equal(canBuy(av, 'nope', 999).ok, false);
});

test('v132 C5: lên bậc chỉ ăn mừng một lần (đã xem thì thôi), tụt chỉ số không đòi lại', () => {
  const av = freshAv(1);
  assert.deepEqual(fresh(av, gearOf(rows(0))), []);
  const g = gearOf(rows(3));
  assert.equal(fresh(av, g).length, 7);
  markSeen(av, g);
  assert.deepEqual(fresh(av, g), []);
  assert.deepEqual(fresh(av, gearOf(rows(2))), []);
  assert.equal(fresh(av, gearOf(rows(5))).length, 7);
});

test('v132 bản lưu: dữ liệu hỏng về mặc định an toàn; đồ lạ / mặc đồ chưa mua bị bỏ; lưu qua sanitizeE và gộp hai máy', () => {
  assert.equal(sanitizeAv(null), undefined);
  const s = sanitizeAv({ look: { h: 99, hc: -3, sk: 'x', ey: 1.4, mo: 2 }, fash: ['f-non', 'hack', 'f-non'], wear: { hat: 'f-non', coat: 'f-suit', wing: 'f-non' }, spent: -5, seen: { pen: 9, bad: 3 }, made: 'yes' })!;
  assert.deepEqual(s.look, { h: LOOK_MAX.h - 1, hc: 0, sk: 0, ey: 1, mo: 2 });
  assert.deepEqual(s.fash, ['f-non']);
  assert.deepEqual(s.wear, { hat: 'f-non' });
  assert.equal(s.spent, 0); assert.deepEqual(s.seen, { pen: 5 }); assert.equal(s.made, false);
  const e = sanitizeE({ ...freshE(), av: { ...freshAv(2), made: true, spent: 60, fash: ['f-non'] } });
  assert.equal(e.av?.spent, 60);
  const a = { ...freshAv(1), made: true, look: { ...look }, fash: ['f-cap'], spent: 40 }, b = { ...freshAv(2), fash: ['f-non'], spent: 60 };
  const m = mergeAv(a, b)!;
  assert.deepEqual(m.look, look); assert.deepEqual(m.fash.sort(), ['f-cap', 'f-non']); assert.equal(m.spent, 60); assert.equal(m.made, true);
  assert.equal(mergeE({ ...freshE(), av: a }, { ...freshE(), av: b }).av?.spent, 60);
  assert.deepEqual(randomLook(42), randomLook(42));
});

test('v132 M7: một công tắc âm thanh: engine nghe theo cài đặt của app khi đã nối host', () => {
  let cfg = { sfx: true, music: true };
  soundFrom(() => cfg, on => { cfg = { ...cfg, music: on }; });
  assert.equal(muted(), false); assert.equal(musicOff(), false);
  cfg = { sfx: false, music: true };
  assert.equal(muted(), true);
  assert.equal(toggleMusic(), false); assert.equal(musicOff(), true);
  assert.equal(toggleMusic(), true); assert.equal(musicOff(), false);
  soundFrom(null);
});
