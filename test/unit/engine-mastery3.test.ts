import { test } from 'node:test';
import assert from 'node:assert/strict';
import { betaQuantile, betaCdf, stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv, setPrior, misconceptions } from '../../src/engine/ev/store.ts';
import { RULE } from '../../src/engine/ev/evaluate.ts';
import type { Observation } from '../../src/engine/ev/types.ts';

// v55 Mastery & Inference v3 (spec v2.4 §41, §44–45, §69, §82; C261–C280, MT4, MT11).

let T = 0;
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, o: Partial<Observation> & { ok: boolean }, day = 10) =>
  ingest(st, m, { node: 'g:x', level: 3, item: `i${T}`, ...o } as Observation, { dev: 'dev001', ts: ++T, day });
const cell = (m: MasteryStore, lv = 3) => stat(m['g:x']?.[lv as 3]);

test('phân vị Beta chính xác: khớp giá trị đã biết, đơn điệu; chặt hơn xấp xỉ chuẩn cũ ở n nhỏ', () => {
  assert.ok(Math.abs(betaQuantile(0.1, 1, 1) - 0.1) < 1e-9);
  assert.ok(Math.abs(betaQuantile(0.5, 2, 2) - 0.5) < 1e-9);
  assert.ok(Math.abs(betaCdf(0.3, 1, 1) - 0.3) < 1e-12);
  for (let a = 2; a < 30; a++) assert.ok(betaQuantile(0.1, a + 1, 2) > betaQuantile(0.1, a, 2));
  const a = 3, b = 1, s = a + b, normal = a / s - 1.2816 * Math.sqrt((a * b) / (s * s * (s + 1)));
  assert.ok(betaQuantile(0.1, a, b) < normal);   // 2 câu đúng: cận dưới thật 0,46 < 0,50 của xấp xỉ chuẩn
});

test('một lỗi đơn lẻ không làm mất Đạt (MT4, §41); trả lời đúng không bao giờ làm mastery giảm (C267)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 20; i++) put(st, m, { ok: true });
  put(st, m, { ok: false, item: 'i1' });   // câu cũ, không phải câu mới
  assert.ok(cell(m).pass);
  let prev = cell(m).m;
  for (let i = 0; i < 40; i++) { put(st, m, { ok: true }); const now = cell(m).m; assert.ok(now >= prev - 1e-12); prev = now; }
});

test('hồi phục sau nhiều lần sai (C275): giảm bằng chứng cũ ngược chiều giúp Đạt lại sau ≤ 50 lượt đúng (không giảm thì kẹt)', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 60; i++) put(st, m, { ok: false });
  let k = 0;
  while (!cell(m).pass && k < 200) { put(st, m, { ok: true }); k++; }
  assert.ok(cell(m).pass && k <= 50, `cần ${k} lượt`);
  const st2 = freshEv(), m2: MasteryStore = {};
  for (let i = 0; i < 60; i++) ingest(st2, m2, { node: 'g:x', level: 3, ok: false, item: `a${i}` }, { dev: 'd', ts: i, day: 1, rule: { ...RULE, decay: 1 } });
  for (let i = 0; i < k; i++) ingest(st2, m2, { node: 'g:x', level: 3, ok: true, item: `b${i}` }, { dev: 'd', ts: 100 + i, day: 1, rule: { ...RULE, decay: 1 } });
  assert.equal(stat(m2['g:x']![3]).pass, false);   // không giảm theo lượt thì vẫn bị khoá ở trạng thái cũ
});

test('model disagreement (§69, MT11): Đạt rồi sai 2 lần ở câu mới → mở lại; đúng 2 lần ở câu mới → xác nhận lại', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 25; i++) put(st, m, { ok: true });
  assert.equal(cell(m).state, 'mastered');
  put(st, m, { ok: false });
  assert.equal(cell(m).state, 'mastered');        // một lỗi: chưa đủ
  put(st, m, { ok: false });
  assert.equal(cell(m).state, 'reopened');
  assert.equal(cell(m).pass, false);
  assert.equal(cell(m).conf, 'low');
  assert.ok(st.led.some(e => e.tier === 3 && e.why === 'disagree'));
  put(st, m, { ok: true }); put(st, m, { ok: true });
  assert.equal(cell(m).state, 'mastered');
});

test('mức 4–5 cần ít nhất một lần đúng ở câu mới không trợ giúp (C180); tiên nghiệm là "suy ra", không phải Đạt thật', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 20; i++) put(st, m, { ok: true, level: 4, hint: true, w: 3 });
  assert.equal(cell(m, 4).state, 'verify');
  assert.equal(cell(m, 4).pass, false);
  put(st, m, { ok: true, level: 4 });
  assert.equal(cell(m, 4).state, 'mastered');
  const s2 = freshEv(), m2: MasteryStore = {};
  setPrior(s2, m2, 'u:y', 3, 6, 0.5, 'diag', 1);
  assert.equal(stat(m2['u:y']![3]).state, 'inferred');
  assert.equal(stat(m2['u:y']![3]).conf, 'low');
});

test('hiểu sai (misconception): cùng một phương án sai ≥ 2 lần thành giả thuyết; trả lời đúng làm yếu dần', () => {
  const st = freshEv(), m: MasteryStore = {};
  put(st, m, { ok: false, given: 'He go' });
  assert.deepEqual(misconceptions(st, 'g:x'), []);
  put(st, m, { ok: false, given: 'he go ' });
  put(st, m, { ok: false, given: 'He goes to' });
  assert.deepEqual(misconceptions(st, 'g:x').map(x => x.t), ['He go']);
  for (let i = 0; i < 4; i++) put(st, m, { ok: true });
  assert.deepEqual(misconceptions(st, 'g:x'), []);
});
