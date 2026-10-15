import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  addRun, pickChar, freshCb, essOf, addEss, wornW, canForge, forge, sanitizeCb, mergeCb, nextFight, unlocked, reward, tipOf, loseAdvice, fightStats, fbText, addFb, logFight,
  ESS_DAY, W_COST, W_MAX, FB_MAX, LOG_MAX,
} from '../../src/engine/cb.ts';
import { fightById } from '../../src/engine/fight.ts';
import { charOpen, freshBest } from '../../src/engine/fightmeta.ts';

// v133 Chiến Binh Chữ mốc 1: ô Vũ khí. Hai cổng: tinh hoa (chỉ từ trả lời đúng ở lò) + chỉ số thật (Từ vựng Lv ≥ bậc mới mặc được).
const ok = { node: 'u:a1.food', ok: true, ctx: 'wheel', nov: false, day: 10 };

test('tinh hoa: chỉ câu đúng, nút từ vựng, ở lò; câu mới ×2, gợi ý ×0,5, theo Thợ rèn ×1,25', () => {
  assert.equal(essOf(ok, null), 1);
  assert.equal(essOf({ ...ok, ok: false }, null), 0);
  assert.equal(essOf({ ...ok, node: 'g:a1.be' }, null), 0, 'nút ngữ pháp không cho tinh hoa Vũ khí');
  assert.equal(essOf({ ...ok, ctx: 'diag' }, null), 0, 'chẩn đoán không phải lò');
  assert.equal(essOf({ ...ok, ctx: undefined }, null), 0);
  assert.equal(essOf({ ...ok, nov: true }, null), 2);
  assert.equal(essOf({ ...ok, hint: true }, null), 0.5);
  assert.equal(essOf(ok, { day: 10, game: 'wheel' }), 1.25);
  assert.equal(essOf(ok, { day: 9, game: 'wheel' }), 1, 'gợi ý hôm khác không tính');
  assert.equal(essOf({ ...ok, ctx: 'learn' }, { day: 10, game: 'garden' }), 1.25);
});
test('tinh hoa: trần mỗi ngày, sang ngày mới đặt lại', () => {
  const s = freshCb();
  for (let k = 0; k < 100; k++) addEss(s, 2, 10);
  assert.equal(s.ess, ESS_DAY); assert.equal(addEss(s, 1, 10), 0);
  assert.equal(addEss(s, 1, 11), 1); assert.equal(s.ess, ESS_DAY + 1);
});
test('rèn: cần tinh hoa + xu; mặc được khi Từ vựng Lv ≥ bậc; xu / thời gian không vượt khoá', () => {
  const s = freshCb();
  assert.deepEqual(canForge(s, 1000), { ok: false, why: 'ess', lack: W_COST[1]!.ess });
  s.ess = 8; assert.deepEqual(canForge(s, 5), { ok: false, why: 'coins', lack: 15 });
  assert.ok(forge(s, 1000)); assert.equal(s.w, 1); assert.equal(s.ess, 0); assert.equal(s.spent, 20);
  assert.equal(wornW(s, 0), 0, 'đã rèn, chưa mặc được');
  assert.equal(wornW(s, 1), 1);
  s.ess = 1e4; while (forge(s, 1e9)) { /* rèn hết */ }
  assert.equal(s.w, W_MAX); assert.equal(canForge(s, 1e9).ok, false);
  assert.equal(wornW(s, 2), 2, 'xu và tinh hoa vô hạn vẫn không vượt chỉ số thật');
  assert.equal(wornW(s, 99), W_MAX);
});
test('bản lưu: lọc rác, gộp hai máy không cộng trùng', () => {
  assert.equal(sanitizeCb(null), undefined);
  const x = sanitizeCb({ w: 9, ess: -3, clr: ['k1-l1', 'zz'], log: [{ id: 'k1-l1', r: 'w', d: 3 }, { id: '<b>', r: 'w' }], fb: [{ at: 'fight', id: 'k1-l1', s: 9, t: 'x'.repeat(500) }], tip: { day: 2, game: 'wheel' } })!;
  assert.equal(x.w, W_MAX); assert.equal(x.ess, 0); assert.deepEqual(x.clr, ['k1-l1']); assert.equal(x.log.length, 1); assert.equal(x.fb[0]!.s, 5); assert.equal(x.fb[0]!.t.length, 200);
  const a = { ...freshCb(), w: 1, got: 10, ess: 4, clr: ['k1-l1'] }, b = { ...freshCb(), w: 2, got: 6, ess: 1, clr: ['k1-l2'], spent: 80 };
  const m = mergeCb(a, b)!;
  assert.equal(m.w, 2); assert.equal(m.ess, 4); assert.equal(m.spent, 80); assert.deepEqual(m.clr.sort(), ['k1-l1', 'k1-l2']);
});
test('trận kế tiếp, mở khoá, thưởng lần đầu', () => {
  const s = freshCb();
  assert.equal(nextFight(s).id, 'k1-l1'); assert.ok(!unlocked(s, 'k1-boss'));
  s.clr = ['k1-l1', 'k1-l2']; assert.equal(nextFight(s).id, 'k1-boss'); assert.ok(unlocked(s, 'k1-boss'));
  const d = fightById('k1-boss')!; assert.equal(reward(s, d), d.coins + d.first); s.clr.push(d.id); assert.equal(reward(s, d), d.coins);
});
test('thua boss: thiếu bậc thì chỉ thẳng Vũ khí; đủ bậc thì do tay né', () => {
  const d = fightById('k1-boss')!, s = freshCb();
  const a = loseAdvice(d, 0, s, 0, 0);
  assert.ok(a.gap && /Vũ khí của bạn bậc 0, Tiếng Ồn Rè cần bậc 2/.test(a.text)); assert.equal(a.act, 'lo');
  s.ess = 10; assert.equal(loseAdvice(d, 0, s, 100, 0).act, 'forge');
  s.w = 2; const b = loseAdvice(d, 1, s, 0, 1); assert.ok(/đã rèn bậc 2 nhưng mới mặc được bậc 1/.test(b.text)); assert.equal(b.act, 'lo');
  assert.equal(loseAdvice(d, 2, s, 0, 2).act, 'retry'); assert.ok(/tay né/.test(loseAdvice(d, 2, s, 0, 2).text));
});
test('Thợ rèn gợi ý: tưới cây đến hạn → Vườn từ; thiếu chỉ số → Vườn từ; còn lại Vòng Chữ / Mỏ Chữ thay nhau', () => {
  const s = freshCb(), base = { s, vocLv: 3, vocLeft: 0, coins: 0, garden: 0, last: '' };
  assert.equal(tipOf({ ...base, garden: 2 }).forge, 'garden');
  assert.equal(tipOf({ ...base, vocLv: 0, vocLeft: 1 }).forge, 'garden');
  assert.equal(tipOf({ ...base, last: 'wheel' }).forge, 'hunt'); assert.equal(tipOf({ ...base, last: 'hunt' }).forge, 'wheel');
  assert.equal(tipOf({ ...base, dirGame: 'hunt' }).forge, 'hunt');
  assert.ok(/Tiếng Ồn Rè cần Vũ khí bậc 2/.test(tipOf(base).why));
  s.ess = 8; const t = tipOf({ ...base, coins: 100 }); assert.ok(t.ready && /rèn Vũ khí bậc 1 ngay/.test(t.why), t.why);
});
test('số liệu trận và góp ý: giới hạn, văn bản gửi đi không có dữ liệu học', () => {
  const s = freshCb();
  for (let k = 0; k < LOG_MAX + 5; k++) logFight(s, { d: k, id: 'k1-boss', w: k % 3, need: 2, r: k % 2 ? 'w' : 'l', n: 4, acc: 0.5, t1: 5 + (k % 4), sec: 90 });
  for (let k = 0; k < FB_MAX + 3; k++) addFb(s, { d: 1, at: 'fight', id: 'k1-boss', s: 4, t: 'vui' });
  assert.equal(s.log.length, LOG_MAX); assert.equal(s.fb.length, FB_MAX);
  const st = fightStats(s.log); assert.equal(st.n, LOG_MAX); assert.ok(st.bySide.some(b => b.d === -2) && st.t1 !== null);
  const txt = fbText(s, 'v133'); assert.ok(/chênh bậc -2/.test(txt) && /★★★★☆ vui/.test(txt)); assert.ok(!/u:|g:|ev|mastery/.test(txt));
});

// v134: nhân vật (ngang sức, mở bằng việc làm trong trận), thành tích, kỷ lục; lưu / hợp hai máy.
test('kỷ lục + thành tích + mở nhân vật; lưu sạch, hợp hai máy', () => {
  const s = freshCb();
  assert.equal(s.ch, 'orbiter'); assert.ok(!charOpen('sprinter', s.best)); assert.ok(!pickChar(s, 'xx'));
  const got = addRun(s, { id: 'k1-boss', win: true, t: 130, kills: 320, combo: 55, evos: 1, boss: true });
  assert.deepEqual(got.sort(), ['boss', 'combo50', 'evo', 'k300', 'run1', 'surv2']);
  assert.deepEqual(addRun(s, { id: 'k1-l1', win: false, t: 10, kills: 2, combo: 1, evos: 0, boss: false }), []);
  assert.ok(charOpen('sprinter', s.best) && charOpen('berserker', s.best) && charOpen('revenant', s.best) && !charOpen('gambler', s.best));
  assert.ok(pickChar(s, 'sprinter')); assert.equal(s.ch, 'sprinter');
  const x = sanitizeCb({ ...s, ch: 'hack', ach: ['boss', 'zz', 'boss'], best: { ...s.best, boss: -4, kills: 'x' }, pos: { x: 10, y: 'a' } })!;
  assert.equal(x.ch, 'orbiter'); assert.deepEqual(x.ach, ['boss']); assert.equal(x.best.boss, 0); assert.equal(x.best.kills, 0); assert.equal(x.pos, null);
  const old = sanitizeCb({ w: 1, clr: [] })!;   // bản lưu v133 chưa có trường mới
  assert.deepEqual([old.ch, old.ach, old.best.runs, old.pos], ['orbiter', [], 0, null]);
  const m = mergeCb({ ...freshCb(), ach: ['run1'], best: { ...freshBest(), kills: 9, boss: 1 } }, { ...freshCb(), ach: ['boss'], best: { ...freshBest(), kills: 4, t: 99 } })!;
  assert.deepEqual(m.ach.sort(), ['boss', 'run1']); assert.deepEqual([m.best.kills, m.best.boss, m.best.t], [9, 1, 99]);
});
