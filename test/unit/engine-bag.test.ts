import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MORPH, COLLOC, SENT, AFFIX, GEAR, freshBag, sanitizeBag, mergeBag, earned, have, canPay, pay, gemsOf, albumsOf, claimAlbum, statsOf, charLv, reqOk, lvOf,
  morphTask, morphPick, typedOk, colTask, colPick, sentTask, sentOk, soulOk, affixesOpen, CRAFT_COST, STARTER,
} from '../../src/engine/bag.ts';

// v128 Túi chữ · Xưởng của Tí · Chỉ số (GAME-CRITERIA §15): đồ là tiếng Anh, chế tạo là hành động ngôn ngữ, chỉ số là năng lực thật.
test('v128 nội dung: công thức hợp lệ (từ ghép ghép ra từ thật, phụ tố có khu mở, cụm và câu có nghĩa, câu lớn dần theo khu)', () => {
  for (const [base, aff, out, vi] of MORPH) {
    assert.ok(AFFIX.some(a => a[0] === aff), aff); assert.ok(vi.length);
    const core = aff.replace('-', '');
    assert.ok(aff.startsWith('-') ? out.startsWith(base.slice(0, -1)) && out.endsWith(core) : out.startsWith(core) && out.endsWith(base), `${base} ${aff} → ${out}`);
  }
  assert.equal(new Set(MORPH.map(m => m[2])).size, MORPH.length, 'không trùng kết quả');
  for (const [v, rest, vi] of COLLOC) { assert.ok(v && rest && vi); }
  for (const lv of [1, 2, 3, 4]) { assert.ok(SENT.filter(s => s[3] === lv).length >= 8, `khu ${lv} đủ câu`); assert.ok(COLLOC.filter(c => c[3] === lv).length >= 8); }
  for (const [, en] of SENT) assert.ok(en.split(' ').length >= 4 && en.split(' ').length <= 8, en);
  assert.deepEqual(affixesOpen(1), ['-er', '-y', 'un-']); assert.equal(affixesOpen(4).length, AFFIX.length);
});

test('v128 nguyên liệu suy ra từ việc học; trả khi chế tạo; làm sai không mất gì (nguyên liệu chỉ trừ ở hàm pay)', () => {
  const e = earned({ words: 7, sp: 3, ty: 5, recall: 2 }), s = freshBag();
  assert.deepEqual(e, { chu: STARTER + 7, noi: 3, muc: 5, nho: 2 });
  assert.ok(canPay(e, s, CRAFT_COST.sent));
  assert.ok(pay(e, s, { chu: 3, noi: 1 })); assert.equal(have(e, s, 'chu'), STARTER + 4); assert.equal(have(e, s, 'noi'), 2);
  assert.equal(pay(e, s, { noi: 5 }), false, 'không đủ thì không trừ'); assert.equal(have(e, s, 'noi'), 2);
  s.it.tu = 2; assert.ok(pay(e, s, { tu: 2 })); assert.equal(s.it.tu, 0);
  // Ký ức / lời nói bị cắt khỏi nhật ký (quá 120 ngày) thì không âm.
  assert.equal(have(earned({ words: 0, sp: 0, ty: 0, recall: 0 }), { ...s, sp: { ...s.sp, noi: 9 } }, 'noi'), 0);
});

test('v128 ngọc từ: độ hiếm = độ nhớ thật (số ngày khác nhau, khoảng cách); album 50% ⭐ / 100% 🏆, mỗi mốc thưởng một lần', () => {
  const led = [
    { ok: 1 as const, item: 'w:a:hunt', day: 10 },
    { ok: 1 as const, item: 'w:b:wheel', day: 10 }, { ok: 1 as const, item: 'w:b:signs', day: 12 },
    { ok: 1 as const, item: 'w:c:hunt', day: 10 }, { ok: 1 as const, item: 'w:c:hunt', day: 14 }, { ok: 1 as const, item: 'w:c:signs', day: 20 },
    { ok: 1 as const, item: 'w:d:hunt', day: 1 }, { ok: 1 as const, item: 'w:d:hunt', day: 5 }, { ok: 1 as const, item: 'w:d:hunt', day: 20 }, { ok: 1 as const, item: 'w:d:hunt', day: 40 },
    { ok: 0 as const, item: 'w:e:hunt', day: 3 }, { ok: 1 as const, item: 'g:x', day: 3 },
  ];
  const g = gemsOf(led, { f: { s: 1, d: 9 } });
  assert.deepEqual(['a', 'b', 'c', 'd'].map(id => g.get(id)!.tier), [0, 1, 2, 3]);
  assert.ok(!g.has('e'), 'trả lời sai không thành ngọc'); assert.ok(g.has('f'), 'cây trong Vườn từ là ngọc');
  const lex = [{ id: 'a', node: 'u:x' }, { id: 'b', node: 'u:x' }, { id: 'c', node: 'u:y' }, { id: 'z', node: 'u:y' }, { id: 'q', node: 'u:z' }];
  const al = albumsOf(lex, g, {});
  assert.deepEqual(al.map(a => [a.node, a.tier]), [['u:x', 2], ['u:y', 1]], 'album chưa có từ nào không hiện');
  const s = freshBag();
  assert.equal(claimAlbum(s, al[0]!), 50, '⭐ + 🏆 = 10 + 40'); assert.equal(claimAlbum(s, al[0]!), 0, 'nhận một lần');
  assert.equal(claimAlbum(s, al[1]!), 10);
});

test('v128 chỉ số thật: kỹ năng vững / Bảng đo H đã đo; chưa đủ số liệu thì Lv 0 (không lấy ước tính); trang bị chỉ phát huy khi đủ', () => {
  assert.equal(lvOf(0), 0); assert.equal(lvOf(3), 2); assert.equal(lvOf(75), 10);
  const rows = statsOf({ pass: { u: 6, g: 1, ph: 0, fn: 0 }, h: { H1: { score: 4, measured: true }, H5: { score: 6, measured: false }, H7: { score: 6, measured: false }, H6: { score: 3, measured: true } } });
  const lv = Object.fromEntries(rows.map(r => [r.id, r.lv]));
  assert.deepEqual(lv, { voc: 3, gra: 1, pro: 0, spk: 4, lis: 0, mem: 3, use: 0 });
  assert.match(rows.find(r => r.id === 'lis')!.next, /chưa đủ số liệu/);
  assert.equal(charLv(rows), 1 + Math.floor(11 / 3));
  const pick = GEAR.find(x => x.id === 'pick1')!, pick2 = GEAR.find(x => x.id === 'pick2')!;
  assert.ok(reqOk(pick, rows)); assert.ok(!reqOk(pick2, rows));
  assert.ok(GEAR.every(x => Object.keys(x.req).length > 0), 'trang bị nào cũng cần chỉ số thật');
});

test('v128 chế tạo: ghép từ (chọn phụ tố, tự gõ), ghép cụm (động từ đúng), đúc câu (xếp lá) + thổi hồn', () => {
  const t = morphTask(1, 42, new Set(['teach']));
  assert.ok(t.opts.includes(t.aff) && t.opts.length >= 3 && affixesOpen(1).includes(t.aff));
  assert.ok(morphPick(t, t.aff).ok);
  const wrong = t.opts.find(o => o !== t.aff)!; const w = morphPick(t, wrong); assert.equal(w.ok, false); assert.ok(w.why.length);
  const care = { base: 'care', aff: '-ful', out: 'careful', vi: 'cẩn thận', opts: ['-ful', '-less'] };
  assert.match(morphPick(care, '-less').why, /careless.*bất cẩn/, 'từ thật khác nghĩa: nói rõ');
  assert.ok(typedOk('careful', ' Careful ')); assert.ok(!typedOk('careful', 'carefull'));
  for (let sd = 1; sd < 30; sd++) { const c = colTask(2, sd); assert.equal(new Set(c.opts).size, 4); assert.ok(c.opts.includes(c.verb)); assert.ok(colPick(c, c.verb).ok); }
  assert.match(colPick({ verb: 'make', rest: 'a mistake', vi: 'mắc lỗi', opts: [] }, 'do').why, /make a mistake/);
  const s = sentTask(1, 7, 'Bà Lan');
  assert.notEqual(s.tiles.join(' '), s.en, 'lá chữ đã xáo');
  const order = s.en.split(' ').map(w => s.tiles.indexOf(w));
  assert.ok(sentOk(s, order));
  assert.ok(soulOk('Can I have some roses, please?', 'can i have some roses please', 'type'));
  assert.ok(!soulOk('Can I have some roses, please?', 'can i have roses please', 'type'), 'gõ lại phải đủ cả câu');
  assert.ok(soulOk('Can I have some roses, please?', 'can I have some roses', 'mic'), 'máy nghe: ≥ 75% từ');
});

test('v128 lưu / gộp hai máy', () => {
  const a = freshBag(); a.sp.chu = 5; a.it.loi = 2; a.gear = ['pick1']; a.alb = { 'u:x': 1 }; a.words = ['teacher'];
  const b = freshBag(); b.sp.chu = 3; b.it.loiv = 1; b.gear = ['tea']; b.alb = { 'u:x': 2, 'u:y': 1 }; b.words = ['sunny'];
  const m = mergeBag(a, b)!;
  assert.equal(m.sp.chu, 5); assert.equal(m.it.loi, 2); assert.equal(m.it.loiv, 1);
  assert.deepEqual(m.gear.sort(), ['pick1', 'tea']); assert.deepEqual(m.alb, { 'u:x': 2, 'u:y': 1 }); assert.deepEqual(m.words.sort(), ['sunny', 'teacher']);
  const z = sanitizeBag({ sp: { chu: -3, noi: 'x' }, it: { tu: 2.6 }, gear: ['pick1', 'hack', 'pick1'], alb: { 'u:x': 5, bad: 1 }, words: ['ok', 'NO!', 3] })!;
  assert.deepEqual([z.sp.chu, z.sp.noi, z.it.tu, z.gear, z.alb, z.words], [0, 0, 3, ['pick1'], { 'u:x': 2 }, ['ok']]);
  assert.equal(sanitizeBag(null), undefined);
});
