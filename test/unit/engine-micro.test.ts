import { test } from 'node:test';
import assert from 'node:assert/strict';
import { microDecide, microVerdict, MICRO } from '../../src/engine/micro.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv } from '../../src/engine/ev/store.ts';
import type { Level } from '../../src/engine/types.ts';

// v61 Micro-learning + chính sách ngắt (spec v2.4 §51–53; C161–C170, C317, C330–C332, MT5–MT6).

let T = 0;
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, ok: boolean, o: { node?: string; given?: string; src?: 'micro'; ch?: string; day?: number } = {}) =>
  ingest(st, m, { node: o.node ?? 'g:x', level: 3 as Level, ok, item: `i${++T}`, ...(o.given ? { given: o.given } : {}), ...(o.src ? { src: o.src, ch: o.ch } : {}) }, { dev: 'd', ts: ++T, day: o.day ?? 5 });
const decide = (st: ReturnType<typeof freshEv>, m: MasteryStore, extra: { inGame?: boolean; today?: number } = {}) =>
  microDecide({ ev: st, m, node: 'g:x', lv: 3, today: extra.today ?? 5, inGame: extra.inGame });

test('lỗi lẻ chỉ ghi nhận, không ngắt (C162)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 4; i++) put(st, m, true);
  put(st, m, false);
  assert.equal(decide(st, m).act, 'log');
});

test('còn ít bằng chứng mà đã sai 2 lần → hỏi thêm trước khi dạy (không dạy thứ có thể đã biết)', () => {
  const st = freshEv(), m: MasteryStore = {};
  put(st, m, false); put(st, m, false);
  assert.ok(stat(m['g:x']![3]).n < MICRO.minN);
  assert.equal(decide(st, m).act, 'probe');
});

test('lỗi lặp lại có ý nghĩa → mời bí kíp; trong lượt game thì hoãn tới cuối lượt (C164–C165)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 3; i++) put(st, m, i === 0);
  put(st, m, false);
  const d = decide(st, m);
  assert.equal(d.act, 'offer');
  const g = decide(st, m, { inGame: true });
  assert.equal(g.act, 'log'); assert.equal(g.defer, true);
});

test('cùng một câu trả lời sai lặp lại (hiểu sai) → bí kíp nhắm đúng cách hiểu sai đó (C115, C292)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 4; i++) put(st, m, true);
  put(st, m, false, { given: 'is' }); put(st, m, false, { given: ' IS ' });
  const d = decide(st, m);
  assert.equal(d.act, 'offer'); assert.equal(d.mis, 'is');
  // Đang Đạt chắc mà sai một câu: không ngắt (nếu sai tiếp, cơ chế mâu thuẫn §69 / §58 mở lại nút rồi mới mời bí kíp).
  const s2 = freshEv(), m2: MasteryStore = {};
  for (let i = 0; i < 30; i++) put(s2, m2, true);
  put(s2, m2, false, { given: 'a' });
  assert.equal(stat(m2['g:x']![3]).state, 'mastered');
  assert.equal(decide(s2, m2).act, 'log');
});

test('thiếu tiền đề đã kiểm chứng → dừng lại học phần nền ngay, đích là phần nền (C163, §50)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 4; i++) put(st, m, false);
  st.hyp['g:x'] = { kind: 'prereq', cause: 'g:base', day: 5 };
  const d = decide(st, m);
  assert.equal(d.act, 'now'); assert.equal(d.target, 'g:base');
});

test('không làm phiền: đã học bí kíp phần này hôm nay thì chỉ ghi nhận; hôm sau mời lại (C166)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 6; i++) put(st, m, i % 3 === 0);
  assert.equal(decide(st, m).act, 'offer');
  put(st, m, true, { src: 'micro', ch: 'micro/g:x' });
  assert.equal(decide(st, m).act, 'log');
  assert.equal(decide(st, m, { today: 6 }).act, 'offer');
});

test('câu kiểm tra ngay sau bí kíp tính như có trợ giúp: nhẹ hơn, không là "đúng ở câu mới" (§53)', () => {
  const st = freshEv(), m: MasteryStore = {};
  const ev = ingest(st, m, { node: 'g:y', level: 3, ok: true, item: 'q1', src: 'micro', ctx: 'micro', hint: true }, { dev: 'd', ts: 1, day: 1 });
  assert.equal(ev!.asst, 1);
  assert.ok(ev!.w < 1);
  assert.equal(microVerdict(3, 3), 'fixed'); assert.equal(microVerdict(2, 3), 'partial'); assert.equal(microVerdict(1, 3), 'not-yet');
});
