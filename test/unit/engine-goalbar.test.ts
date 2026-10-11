import { test } from 'node:test';
import assert from 'node:assert/strict';
import { goalSummary, viewGoalBar, goalLine, goalText, NEAR_N } from '../../src/engine/goalbar.ts';
import type { ECtx } from '../../src/engine/views.ts';

const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const ctx = { host: { esc }, e: { goals: [] }, route: 'quest' } as unknown as ECtx;
const miss = (n: number) => Array.from({ length: n }, (_, i) => ({ vi: `Năng lực ${i + 1}`, pct: 90 - i }));
const base = { id: 'cefr-a2', vi: 'CEFR A2', sk: { solid: 12, total: 40, week: 3, claimed: 5 }, ready: { done: 2, total: 9, achieved: false }, missing: miss(5), review: 4 };

test('v110 goalSummary: mốc gần = 3 năng lực gần đạt nhất, đếm phần còn lại; claimed không vượt phần chưa vững', () => {
  const s = goalSummary(base);
  assert.deepEqual(s.near, ['Năng lực 1', 'Năng lực 2', 'Năng lực 3']);
  assert.equal(s.near.length, NEAR_N);
  assert.equal(s.more, 2);
  assert.deepEqual([s.solid, s.total, s.week, s.done, s.need, s.review, s.achieved], [12, 40, 3, 2, 9, 4, false]);
  assert.equal(goalSummary({ ...base, sk: { solid: 38, total: 40, week: 0, claimed: 9 } }).claimed, 2);
  assert.equal(goalSummary({ ...base, ready: null }).need, 0);
});

test('v110 thẻ Mục tiêu: tên mục tiêu, số vững thật, +tuần, gần đạt nhất; chạm mở trang mục tiêu; không báo phần trăm readiness', () => {
  const h = viewGoalBar(ctx, goalSummary(base));
  assert.match(h, /🎯 Mục tiêu: CEFR A2/);
  assert.match(h, /12\/40 kỹ năng đã vững/);
  assert.match(h, /\+3 tuần này/);
  assert.match(h, /Gần đạt nhất:<\/b> Năng lực 1; Năng lực 2; Năng lực 3/);
  assert.match(h, /và 2 năng lực khác/);
  assert.match(h, /data-r="goal\/cefr-a2"/);
  assert.match(h, /2\/9 năng lực của mục tiêu đã Đạt · 4 phần đã học đang sắp quên/);
  assert.match(h, /5 kỹ năng app đoán bạn đã biết/);
  assert.doesNotMatch(h, /<p[ >]/, 'trong nút không có thẻ p');
  assert.doesNotMatch(h, /Sẵn sàng: \d+%/);
  const z = viewGoalBar(ctx, goalSummary({ ...base, sk: { solid: 0, total: 40, week: 0, claimed: 0 }, missing: [] }));
  assert.match(z, /tuần này chưa vững thêm phần nào/);
  assert.doesNotMatch(z, /Gần đạt nhất/);
  const d = viewGoalBar(ctx, goalSummary({ ...base, ready: { done: 9, total: 9, achieved: true } }));
  assert.match(d, /✓ Đã đạt CEFR A2/);
  assert.match(d, /Chọn mục tiêu tiếp/);
});

test('v110 dòng màn kết: vững thêm khi có, nói thật khi chưa, Can-Do cho game kỹ năng; tên được thoát', () => {
  const s = goalSummary(base);
  assert.match(goalLine(esc, s, { full: ['Thì quá khứ', 'Màu sắc'], part: [] }, 7), /⬆ Vững thêm 2: Thì quá khứ, Màu sắc/);
  const none = goalLine(esc, s, { full: [], part: [] }, 6);
  assert.match(none, /Ván này thêm 6 câu bằng chứng, chưa đủ để vững thêm kỹ năng nào/);
  assert.match(none, /Gần đạt nhất: Năng lực 1/);
  assert.match(goalLine(esc, s, { full: [], part: [] }, null), /Can-Do/);
  assert.match(goalLine(esc, s, { full: [], part: [] }, 0), /chưa có câu tính vào năng lực/);
  assert.match(goalLine(esc, s, { full: ['<b>x</b>'], part: [] }, 1), /&lt;b&gt;x&lt;\/b&gt;/);
  const st = goalLine(esc, s, { full: [], part: ['Đồ ăn'] }, 6);
  assert.match(st, /↗ Tiến một bậc: Đồ ăn\. Mục tiêu cần mức cao hơn/);
  assert.doesNotMatch(st, /chưa đủ để vững/, 'không nói hai ý ngược nhau');
  assert.equal(goalText(s, []), '🎯 CEFR A2: 12/40 kỹ năng đã vững');
  assert.equal(goalText(s, ['a', 'b', 'c', 'd']), '🎯 CEFR A2: vững thêm a, b, c… (12/40)');
});

test('v111 thẻ Mục tiêu: báo phần học tủ và nhịp theo hạn chót (khi người học đặt hạn)', () => {
  const s = goalSummary({ ...base, rote: ['Đồ ăn', 'Màu sắc', 'Số đếm'], due: { days: 30, mins: 900 } });
  const h = viewGoalBar(ctx, s);
  assert.match(h, /⚠ 3 phần đang nhớ câu cũ, chưa dùng được ở câu lạ: Đồ ăn; Màu sắc…/);
  assert.match(h, /Còn 30 ngày tới hạn: cần khoảng 30 phút mỗi ngày\./);
  assert.match(viewGoalBar(ctx, goalSummary({ ...base, due: { days: 5, mins: 900 } })), /180 phút mỗi ngày \(nhiều: cân nhắc lùi hạn\)/);
  assert.match(viewGoalBar(ctx, goalSummary({ ...base, due: { days: 0, mins: 900 } })), /Đã tới hạn/);
  assert.doesNotMatch(viewGoalBar(ctx, goalSummary(base)), /⏰|⚠/);
});
