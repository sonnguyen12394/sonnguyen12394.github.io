import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resident, sideTasks, sideDone, CHAPTERS, ACTS, ACT_WORDS, FLAGS, storyAdd, tasksDone, ready, advance, revived, freshStory, sanitizeStory, mergeStory, storyNote, viewStory, finished, sceneOf, sceneArt, linesOf, cluesOf, settle, choose, sayOk, kindOf } from '../../src/engine/story.ts';

// v101 cốt truyện Phố Chữ: chương nối ba game; chương cuối mỗi khu cần kỹ năng vững thật; truyện không ghi bằng chứng.
test('v101/v128 nội dung: mở đầu + 4 khu × 4 chương; mỗi chương có cả ba nhiệm vụ (trừ mở đầu); chương cuối khu cần kỹ năng vững tăng dần', () => {
  assert.equal(CHAPTERS[0]!.act, 0);
  for (const a of [1, 2, 3, 4]) {
    const cs = CHAPTERS.filter(c => c.act === a);
    assert.equal(cs.length, 4, ACTS[a]);
    assert.ok(cs.slice(0, 3).every(c => !c.solid) && (cs[3]!.solid ?? 0) > 0, 'chỉ chương cuối khu cần kỹ năng vững');
    assert.ok(cs.every(c => c.need.dig > 0 && c.need.light > 0 && c.need.voice > 0), 'mỗi chương dùng cả ba game');
  }
  const gates = CHAPTERS.filter(c => c.solid).map(c => c.solid!);
  assert.deepEqual(gates, [...gates].sort((a, b) => a - b));
  // v128 tiếng Anh lớn lên theo khu: số từ tối đa của khu (Chợ 10 → Phố Đêm 16), kể cả các phương án lựa chọn.
  for (const c of CHAPTERS) for (const l of c.scene) {
    const cap = ACT_WORDS[c.act]!;
    assert.ok(l.en.length && l.vi.length); assert.ok(l.en.split(' ').length <= cap, `khu ${c.act} ≤ ${cap} từ: ${l.en}`);
    for (const [en, vi, v] of l.pick?.opts ?? []) { assert.ok(en.split(' ').length <= cap && vi.length); assert.ok(FLAGS[l.pick!.f].includes(v)); }
  }
});

test('v101 tiến độ: cộng đúng loại, chặn ở mức cần; đủ nhiệm vụ → xem cảnh → chương sau + xu; chương cuối khu cần kỹ năng vững', () => {
  const s = freshStory();
  assert.ok(ready(s, 0), 'mở đầu xem được ngay');
  assert.deepEqual(advance(s, 0), { coins: 0, act: null });
  assert.equal(s.ch, 1);
  const c = CHAPTERS[1]!;
  assert.equal(storyAdd(s, 'dig', c.need.dig - 1), false);
  assert.equal(storyAdd(s, 'dig', 5), true, 'vừa xong nhiệm vụ đào');
  assert.equal(s.prog.dig, c.need.dig, 'chặn ở mức cần');
  assert.equal(tasksDone(s), false); assert.equal(advance(s, 0), null);
  storyAdd(s, 'light', 9); storyAdd(s, 'voice', 9);
  assert.deepEqual(advance(s, 0), { coins: 20, act: null });
  // Tới chương cuối khu 1: đủ nhiệm vụ mà thiếu kỹ năng vững thì chưa xem được.
  while (s.ch < 4) { for (const k of ['dig', 'light', 'voice'] as const) storyAdd(s, k, 99); advance(s, 0); }
  for (const k of ['dig', 'light', 'voice'] as const) storyAdd(s, k, 99);
  const need = CHAPTERS[4]!.solid!;
  assert.equal(ready(s, need - 1), false);
  assert.deepEqual(advance(s, need), { coins: 50, act: 'Khu Chợ Sáng' });
  assert.deepEqual(revived(s), ['Khu Chợ Sáng']);
});

test('v101 hết truyện → "còn tiếp"; ghi chú nhiệm vụ trong game; lưu / gộp hai máy', () => {
  const s = freshStory(); s.ch = CHAPTERS.length;
  assert.ok(finished(s)); assert.match(viewStory(s, 0), /Hết mùa 1/); assert.match(viewStory(s, 0), /data-e="bgopen"/);
  const t = freshStory(); t.ch = 1; t.prog.dig = 2;
  assert.match(storyNote(t, 'dig'), /Đào chữ cho Bà Lan: 2\/3/);
  assert.match(storyNote(freshStory(), 'dig'), /Bà Lan: 0\/3/, 'mở đầu: nhiệm vụ chương 1 đã hiện');
  const p = freshStory(); storyAdd(p, 'dig', 2); assert.equal(p.prog.dig, 2, 'chơi trước khi xem mở đầu vẫn được tính');
  advance(p, 0); assert.equal(p.ch, 1); assert.equal(p.prog.dig, 2, 'xem mở đầu xong giữ tiến độ');
  assert.deepEqual(sanitizeStory({ ch: 99, prog: { dig: -1, light: 'x', voice: 3 } }), { ch: CHAPTERS.length, prog: { dig: 0, light: 0, voice: 3 } });
  assert.equal(mergeStory({ ch: 3, prog: { dig: 0, light: 0, voice: 0 } }, { ch: 2, prog: { dig: 9, light: 9, voice: 9 } })!.ch, 3);
  assert.deepEqual(mergeStory({ ch: 2, prog: { dig: 1, light: 3, voice: 0 } }, { ch: 2, prog: { dig: 4, light: 0, voice: 2 } })!.prog, { dig: 4, light: 3, voice: 2 });
  const html = viewStory({ ch: 4, prog: { dig: 99, light: 99, voice: 99 } }, 0);
  assert.match(html, /🔒/); assert.doesNotMatch(html, /data-e="stscene"/, 'thiếu kỹ năng vững: chưa có nút xem cảnh');
});

test('v103 việc phụ: cư dân của chương (không phải Tí / mọi người); mỗi việc thưởng một lần mỗi chương; sang chương mới làm lại được', () => {
  const s = freshStory();
  assert.deepEqual(resident(s), ['🌸', 'Bà Lan'], 'mở đầu: cư dân của chương 1');
  assert.equal(sideTasks(s).length, 3);
  assert.ok(sideTasks(s).some(t => t.k === 'gift' && t.start === 'bgcraft'), 'v128: tặng Lời đúc ở Xưởng');
  assert.equal(sideDone(s, 'letter'), true); assert.equal(sideDone(s, 'letter'), false, 'chỉ thưởng một lần');
  assert.ok(sideTasks(s).find(t => t.k === 'letter')!.done);
  advance(s, 0); assert.equal(s.ch, 1); assert.ok(sideTasks(s).find(t => t.k === 'letter')!.done, 'xem mở đầu xong vẫn giữ việc phụ chương 1');
  for (const k of ['dig', 'light', 'voice'] as const) storyAdd(s, k, 99);
  advance(s, 0); assert.equal(s.ch, 2);
  assert.deepEqual(resident(s), ['🥖', 'Chú Tư']);
  assert.equal(sideDone(s, 'letter'), true, 'chương mới: làm lại được');
  const t = freshStory(); t.ch = 4; assert.equal(resident(t), null, 'chương của Tí: không có việc phụ'); assert.equal(sideDone(t, 'cafe'), false);
  assert.deepEqual(sanitizeStory({ ch: 2, prog: {}, side: { letter: 2, cafe: 'x' } })!.side, { letter: 2 });
});

test('v115 khu truyện = cấp: chương cuối khu có cổng chỉ xem được khi đã qua trận cổng; khu không cổng giữ điều kiện kỹ năng vững', () => {
  const s = freshStory(), last = Math.max(...CHAPTERS.map(c => c.act));
  const gate = (passed: boolean) => (act: number) => (act === last ? { lv: 'A2', passed } : null);
  advance(s, 0, gate(false));
  while (CHAPTERS[s.ch]!.act < last || !CHAPTERS[s.ch]!.solid) { for (const k of ['dig', 'light', 'voice'] as const) storyAdd(s, k, 99); assert.ok(advance(s, 99, gate(false)), `chương ${s.ch} không có cổng`); }
  for (const k of ['dig', 'light', 'voice'] as const) storyAdd(s, k, 99);
  assert.equal(ready(s, 99, gate(false)), false, 'chưa qua cổng: đủ nhiệm vụ, đủ kỹ năng vẫn chưa xem được');
  assert.equal(advance(s, 99, gate(false)), null);
  const html = viewStory(s, 99, gate(false));
  assert.match(html, /thi chuyển cấp A2/); assert.match(html, /data-r="gate"/); assert.doesNotMatch(html, /data-e="stscene"/);
  assert.equal(ready(s, 0, gate(true)), false, 'qua cổng vẫn cần đủ kỹ năng vững của chương');
  assert.deepEqual(advance(s, 99, gate(true)), { coins: 50, act: ACTS[last] });
  assert.equal(finished(s), true);
});

test('v118 sceneOf: khu, chương, cư dân của màn Hôm nay; mở đầu sẵn sàng xem cảnh; hết truyện thì "Còn tiếp"', () => {
  const s0 = sceneOf(freshStory(), 0);
  assert.equal(s0.act, 0); assert.equal(s0.no, 0); assert.equal(s0.title, 'Sương Câm'); assert.equal(s0.ready, true);
  const s1 = sceneOf({ ch: 1, prog: { dig: 0, light: 0, voice: 0 } }, 0);
  assert.deepEqual([s1.act, s1.zone, s1.no, s1.title, s1.who?.[1], s1.ready], [1, ACTS[1], 1, 'Hoa không tên', 'Bà Lan', false]);
  const s5 = sceneOf({ ch: 5, prog: { dig: 0, light: 0, voice: 0 } }, 0);
  assert.equal(s5.zone, 'Bến Cảng');
  const end = sceneOf({ ch: CHAPTERS.length, prog: { dig: 0, light: 0, voice: 0 } }, 0);
  assert.equal(end.done, true); assert.equal(end.who, null);
  assert.equal(sceneOf(undefined, 0).act, 0);
});

test('v118 sceneArt: mỗi khu một hình SVG tĩnh (không script, không liên kết ngoài)', () => {
  const arts = [0, 1, 2, 3].map(sceneArt);
  for (const a of arts) { assert.match(a, /^<svg /); assert.doesNotMatch(a, /<script|href=|\son\w+=/); }
  assert.notEqual(arts[1], arts[2]); assert.notEqual(arts[2], arts[3]);
});

test('v128 truyện có bí ẩn, cú lật, lựa chọn, câu bạn tự nói, kỷ vật và cảnh kết', () => {
  assert.ok(CHAPTERS.every(c => c.clue), 'chương nào cũng để lại kỷ vật');
  assert.ok(CHAPTERS.filter(c => c.act > 0).every(c => c.scene.some(l => l.me)), 'chương nào cũng có câu người chơi tự nói');
  const picks = CHAPTERS.flatMap(c => c.scene.filter(l => l.pick).map(l => l.pick!.f));
  assert.deepEqual(picks.sort(), ['f1', 'f2', 'f3'], 'ba lựa chọn');
  // Cú lật giữa truyện (chương cuối khu 2): Tí thú nhận Mờ là bạn cũ.
  const mid = CHAPTERS.find(c => c.act === 2 && c.solid)!;
  assert.ok(mid.scene.some(l => /Mờ/.test(l.en) && /friend/.test(l.en)));
  // Câu phụ thuộc lựa chọn: mỗi phương án đều có lời riêng ở cảnh kết.
  const fin = CHAPTERS[CHAPTERS.length - 1]!;
  for (const [f, vs] of Object.entries(FLAGS)) for (const v of vs) assert.ok(fin.scene.some(l => l.if?.[0] === f && l.if[1] === v) || CHAPTERS.some(c => c.scene.some(l => l.if?.[0] === f && l.if[1] === v)), `${f}=${v} có lời riêng`);
  const a = linesOf(fin, { f1: 'truth', f2: 'soft', f3: 'song' }), b = linesOf(fin, { f1: 'secret', f2: 'loud', f3: 'book' });
  assert.notDeepEqual(a.map(l => l.en), b.map(l => l.en), 'cảnh kết đổi theo lựa chọn');
  assert.equal(a.filter(l => l.if).length, 3);
});

test('v128 lựa chọn: chọn hợp lệ; bỏ qua cảnh thì chọn sẵn phương án đầu; lưu / gộp cờ; kỷ vật theo chương đã qua', () => {
  const s = freshStory();
  assert.equal(choose(s, 'f1', 'nope'), false); assert.equal(choose(s, 'f1', 'secret'), true); assert.equal(s.f?.f1, 'secret');
  const t = freshStory(); t.ch = CHAPTERS.findIndex(c => c.scene.some(l => l.pick?.f === 'f2'));
  for (const k of ['dig', 'light', 'voice'] as const) storyAdd(t, k, 99);
  assert.ok(advance(t, 99)); assert.equal(t.f?.f2, 'loud', 'chưa chọn: lấy phương án đầu');
  settle(t, CHAPTERS[CHAPTERS.length - 2]!); assert.equal(t.f?.f3, 'book');
  assert.deepEqual(sanitizeStory({ ch: 3, prog: {}, f: { f1: 'truth', f2: 'x', zz: 'y' } })!.f, { f1: 'truth' });
  assert.deepEqual(mergeStory({ ch: 9, prog: { dig: 0, light: 0, voice: 0 }, f: { f1: 'truth' } }, { ch: 13, prog: { dig: 0, light: 0, voice: 0 }, f: { f2: 'soft' } })!.f, { f1: 'truth', f2: 'soft' });
  assert.equal(cluesOf(freshStory()).length, 0); assert.equal(cluesOf({ ch: 3, prog: { dig: 0, light: 0, voice: 0 } }).length, 3);
  assert.equal(cluesOf({ ch: CHAPTERS.length, prog: { dig: 0, light: 0, voice: 0 } }).length, CHAPTERS.length);
});

test('v128 câu bạn nói: khớp khi đủ ~75% từ; mỗi khu chỉ sang một game "trả câu nói" riêng', () => {
  assert.ok(sayOk('Roses and lilies! Fresh flowers!', 'roses and lilies fresh flowers').ok);
  assert.ok(sayOk("I make mistakes too. Everyone does. It's OK.", "I make mistakes too everyone does it's ok").ok);
  assert.ok(!sayOk('Can I have two, please?', 'two').ok);
  assert.deepEqual(sayOk('Can I have two, please?', 'can I have please').miss, ['two']);
  assert.equal(kindOf('voice', 1).start, 'cdstart'); assert.equal(kindOf('voice', 2).start, 'tkstart'); assert.equal(kindOf('voice', 3).start, 'akstart'); assert.equal(kindOf('dig', 3).start, 'hnstart');
  assert.match(viewStory({ ch: 5, prog: { dig: 0, light: 0, voice: 0 } }, 0), /data-e="tkstart"/);
  assert.equal(sceneOf({ ch: CHAPTERS.length, prog: { dig: 0, light: 0, voice: 0 } }, 0).zone, 'Phố Đêm');
  assert.equal(ACTS.length, 5);
  assert.match(sceneArt(4), /^<svg /); assert.notEqual(sceneArt(4), sceneArt(3));
});
