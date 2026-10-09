import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pick, linePoints, verdict, karaStars, sanitizeKara, mergeKara } from '../../src/engine/karaoke.ts';
import { accepted, diff, sanitizeShop, mergeShop } from '../../src/engine/workshop.ts';
import type { Dialog } from '../../src/engine/host.ts';

const dlg = (id: string, rp: string | null, fn: string[] = []): Dialog => ({ id, lv: 'A1', title: id, vi: id, place: '', fn, names: { A: 'A', B: 'B' }, lines: [{ s: 'A', t: 'Hi.', vi: '' }, { s: 'B', t: 'Hello.', vi: '' }], rp });

test('v81 Karaoke: chọn hội thoại chưa đóng vai trước, rồi khó / được; ưu tiên chức năng đang học; không lặp bài vừa hát', () => {
  assert.equal(pick([dlg('easy', 'easy'), dlg('hard', 'hard'), dlg('new', null)], [], 1)!.id, 'new');
  assert.equal(pick([dlg('ok', 'ok'), dlg('hard', 'hard')], [], 1)!.id, 'hard');
  assert.equal(pick([dlg('a', null), dlg('b', null, ['a1-thank'])], ['a1-thank'], 1)!.id, 'b');
  assert.equal(pick([dlg('a', null), dlg('b', null)], [], 1, 'a')!.id, 'b');
  assert.equal(pick([], [], 1), null);
});

test('v81 Karaoke: điểm câu theo tỉ lệ từ máy nghe ra, combo khi ≥ 0,8; kết quả như Đóng vai (dễ / được / khó)', () => {
  assert.equal(linePoints(1, 0), 100); assert.equal(linePoints(0.5, 3), 50); assert.equal(linePoints(0.9, 2), 110);
  assert.equal(verdict([1, 0.9]), 'easy'); assert.equal(verdict([0.7, 0.6]), 'ok'); assert.equal(verdict([0.2, 0]), 'hard'); assert.equal(verdict([]), 'hard');
  assert.equal(karaStars('easy'), 3); assert.equal(karaStars('hard'), 1);
  assert.deepEqual(sanitizeKara({ runs: 1.4, best: -3 }), { runs: 1, best: 0, lines: 0, day: 0 });
  assert.deepEqual(mergeKara({ runs: 2, best: 5, lines: 1, day: 3 }, { runs: 1, best: 9, lines: 4, day: 2 }), { runs: 2, best: 9, lines: 4, day: 3 });
});

test('v82 Xưởng sửa câu: chấp nhận câu đúng (bỏ qua hoa thường, dấu chấm cuối), chỉ ra từ cần sửa', () => {
  assert.equal(accepted('she likes music', ['She likes music.']), true);
  assert.equal(accepted("She's beautiful", ['She is beautiful.', "She's beautiful."]), true);
  assert.equal(accepted('She like music.', ['She likes music.']), false);
  assert.deepEqual(diff('She like music.', 'She likes music.'), [1]);
  assert.deepEqual(sanitizeShop({ packed: 3.6, best: 200 }), { runs: 0, packed: 4, best: 100, day: 0 });
  assert.deepEqual(mergeShop({ runs: 1, packed: 2, best: 3, day: 4 }, { runs: 2, packed: 1, best: 6, day: 1 }), { runs: 2, packed: 2, best: 6, day: 4 });
});
