import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHAPTERS, ACTS, storyAdd, tasksDone, ready, advance, revived, freshStory, sanitizeStory, mergeStory, storyNote, viewStory, finished } from '../../src/engine/story.ts';

// v101 cốt truyện Phố Chữ: chương nối ba game; chương cuối mỗi khu cần kỹ năng vững thật; truyện không ghi bằng chứng.
test('v101 nội dung: mở đầu + 3 khu × 4 chương; mỗi chương có cả ba nhiệm vụ (trừ mở đầu); chương cuối khu cần kỹ năng vững tăng dần', () => {
  assert.equal(CHAPTERS[0]!.act, 0);
  for (const a of [1, 2, 3]) {
    const cs = CHAPTERS.filter(c => c.act === a);
    assert.equal(cs.length, 4, ACTS[a]);
    assert.ok(cs.slice(0, 3).every(c => !c.solid) && (cs[3]!.solid ?? 0) > 0, 'chỉ chương cuối khu cần kỹ năng vững');
    assert.ok(cs.every(c => c.need.dig > 0 && c.need.light > 0 && c.need.voice > 0), 'mỗi chương dùng cả ba game');
  }
  const gates = CHAPTERS.filter(c => c.solid).map(c => c.solid!);
  assert.deepEqual(gates, [...gates].sort((a, b) => a - b));
  for (const c of CHAPTERS) for (const l of c.scene) { assert.ok(l.en.length && l.vi.length); assert.ok(l.en.split(' ').length <= 14, `câu A1 ngắn: ${l.en}`); }
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
  assert.ok(finished(s)); assert.match(viewStory(s, 0), /Còn tiếp/);
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
