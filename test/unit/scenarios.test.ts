import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../../src/engine/sim/sim.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { freshEv, ingest, recomputeAll, misconceptions, verify } from '../../src/engine/ev/store.ts';
import { sanitizeEv } from '../../src/engine/ev/sanitize.ts';
import { RULE } from '../../src/engine/ev/evaluate.ts';
import { replay } from '../../src/engine/ev/snapshot.ts';
import { index } from '../../src/engine/graph.ts';
import { plan } from '../../src/engine/path.ts';
import { newCard, review, retrievability } from '../../src/exam/fsrs.ts';
import { startDiag, nextProbe, answer, finished, level, type Cand } from '../../src/engine/diag.ts';

// 10 Scenario (Conformance v2.4) và 20 Meta-Test (Evaluation Framework, Phần N) chạy trên learner mô phỏng có trạng thái thật biết
// trước, qua engine thật. Chứng minh THUẬT TOÁN hành xử đúng (L2–L3); không chứng minh hiệu quả học trên người thật (L4–L5).
// Meta-Test cần trình duyệt nằm ở e2e: MT14 offline → test/e2e/offline.spec.ts; MT16 migrate bản lưu thật → test/e2e/evidence.spec.ts.

const L0 = (seed: number, p: Partial<S.Profile> = {}) => new S.Learner({ ...S.DEFAULT_PROFILE, learn: 0, ...p }, S.rng(seed));

test('S1 / MT1 — learner mới tinh: từ con số 0 đi tới đích của mục tiêu bằng lộ trình thích ứng', () => {
  const r = S.pathEfficiency(201, -1);
  assert.ok(r.adaptiveDone, 'phải đạt hết năng lực mục tiêu');
});

test('S2 / MT2 — learner đã biết phần lớn: bỏ qua thứ đã biết, tốn ít công sức hơn giáo trình cố định rõ rệt', () => {
  const r = S.pathEfficiencyAvg(10, 2);
  assert.ok(r.ratio < 0.8, `thích ứng / cố định = ${r.ratio.toFixed(2)}`);
});

test('S3 / MT8 — biết ≠ làm được: nhận ra/nhớ ra tốt nhưng dùng có kiểm soát kém → mức 3 Đạt, mức 4 chưa', () => {
  const E = S.newEngine();
  for (let i = 0; i < 20; i++) ingest(E.st, E.m, { node: 'g:p', level: 3, ok: true, item: `r${i}`, qt: 'cloze' }, { dev: 's', ts: i, day: 1 });
  for (let i = 0; i < 10; i++) ingest(E.st, E.m, { node: 'g:p', level: 4, ok: i % 4 === 0, item: `u${i}`, qt: 'write' }, { dev: 's', ts: 100 + i, day: 1 });
  assert.equal(stat(E.m['g:p']![3]).pass, true);
  assert.equal(stat(E.m['g:p']![4]).pass, false);
});

test('MT7 — nhận ra tốt nhưng nhớ ra kém: mức 1 Đạt, mức 3 chưa (sai ở mức cao không kéo mức thấp)', () => {
  const E = S.newEngine();
  for (let i = 0; i < 15; i++) ingest(E.st, E.m, { node: 'u:w', level: 1, ok: true, item: `a${i}`, g: 0.25 }, { dev: 's', ts: i, day: 1 });
  for (let i = 0; i < 12; i++) ingest(E.st, E.m, { node: 'u:w', level: 3, ok: false, item: `b${i}` }, { dev: 's', ts: 50 + i, day: 1 });
  assert.equal(stat(E.m['u:w']![1]).pass, true);
  assert.equal(stat(E.m['u:w']![3]).pass, false);
});

test('S4 / MT4 — 20 đúng, 1 sai: không kết luận "chưa biết"', () => {
  const E = S.newEngine(), L = L0(4, { slip: 0 });
  L.know('u:x', true);
  for (let i = 0; i < 20; i++) S.ask(E, L, 'u:x', 3, 1, { mc: false });
  ingest(E.st, E.m, { node: 'u:x', level: 3, ok: false, item: 'u:x#1' }, { dev: 's', ts: 999, day: 1 });
  assert.ok(S.passed(E, 'u:x', 3));
});

test('S5 / MT5 / MT6 — sai liên tiếp cùng một kiểu: chưa Đạt, có giả thuyết hiểu sai cụ thể để can thiệp', () => {
  const E = S.newEngine(), L = L0(5);
  L.know('g:t', false, 'He go');
  for (let i = 0; i < 6; i++) S.ask(E, L, 'g:t', 3, 1, { mc: false });
  assert.equal(S.passed(E, 'g:t', 3), false);
  assert.deepEqual(misconceptions(E.st, 'g:t').map(x => x.t), ['He go']);
});

test('S6 / MT9 — luyện tốt nhưng thất bại ở câu mới: mâu thuẫn → hạ tin cậy, mở lại', () => {
  const E = S.newEngine();
  for (let i = 0; i < 25; i++) ingest(E.st, E.m, { node: 'u:t', level: 3, ok: true, item: 'u:t#same' }, { dev: 's', ts: i, day: 1 + i });
  assert.ok(S.passed(E, 'u:t', 3));
  for (let i = 0; i < 2; i++) ingest(E.st, E.m, { node: 'u:t', level: 3, ok: false, item: `u:t#new${i}`, ctx: 'transfer', src: 'transfer' }, { dev: 's', ts: 100 + i, day: 40 });
  const s = stat(E.m['u:t']![3]);
  assert.equal(s.state, 'reopened');
  assert.equal(s.conf, 'low');
});

test('S7 / MT10 — quên theo thời gian: khả năng nhớ (FSRS) tụt dưới 0,85 → đến hạn ôn', () => {
  let c = newCard(3, 0);
  for (const d of [1, 4, 12]) c = review(c, 3, d);
  assert.ok(retrievability(1, c.s) > 0.85);
  assert.ok(retrievability(200, c.s) < 0.85);
});

test('S8 / MT12 — đổi mục tiêu: năng lực đã có dùng lại, không học lại từ đầu', () => {
  const g = S.synthGraph(6, 8), ix = index(g), E = S.newEngine(), L = L0(8, { slip: 0 });
  for (const n of g.nodes) L.know(n.id, true);
  const g2 = g.goals.find(x => x.id === 'g2')!, g3 = g.goals.find(x => x.id === 'g3')!;
  for (let k = 0; k < 200; k++) { const p = plan(ix, [{ goal: g2, date: null }], 1, (n, lv) => S.passed(E, n, lv)); if (!p.open.length) break; S.drill(E, L, p.open[0]!.node, p.open[0]!.level, 1); }
  const before = plan(ix, [{ goal: g3, date: null }], 1, () => false).unmet.length;
  const after = plan(ix, [{ goal: g3, date: null }], 1, (n, lv) => S.passed(E, n, lv)).unmet.length;
  assert.ok(after < before * 0.4, `${after} / ${before}`);
});

test('S9 / MT13 — 100.000 tương tác: kho có trần, ô Beta khớp thống kê, đủ nhanh', () => {
  const E = S.newEngine(), L = L0(9, { learn: 0.01 }), t0 = Date.now();
  for (let i = 0; i < 300; i++) L.know(`u:n${i}`, i % 2 === 0);
  for (let i = 0; i < 100000; i++) S.ask(E, L, `u:n${i % 300}`, 3, 1 + Math.floor(i / 1000), { mc: i % 2 === 0 });
  assert.ok(JSON.stringify(E.st).length < 1_500_000);
  assert.equal(verify(E.st, E.m), 0);
  assert.ok(Date.now() - t0 < 20000);
});

test('S10 / MT11 — model ban đầu sai (chẩn đoán suy ra là biết) bị bằng chứng mới sửa', () => {
  const E = S.newEngine(), L = L0(10);
  L.know('u:m', false);
  ingest(E.st, E.m, { node: 'u:m', level: 3, ok: true, item: 'seed' }, { dev: 's', ts: 0, day: 1 });
  E.st.pri['u:m|3'] = { a: 6, b: 0.5, src: 'diag', day: 1 };
  for (let i = 0; i < 6; i++) S.ask(E, L, 'u:m', 3, 2, { mc: false });
  assert.notEqual(stat(E.m['u:m']![3]).state, 'mastered');
});

test('MT3 — hồ sơ lệch: từ vựng tốt, ngữ pháp yếu → chẩn đoán cho hai cấp khác nhau', () => {
  const cands: Cand[] = [];
  for (let lv = 0; lv < 6; lv++) for (let i = 0; i < 6; i++) for (const kind of ['u', 'g'] as const) cands.push({ id: `${kind}:${lv}-${i}`, kind, lv, weight: 1 });
  const d = startDiag(2, 0);
  for (let k = 0; k < 40 && !finished(d, 0, cands.length - d.probed.length); k++) {
    const c = nextProbe(d, cands)!, ok = c.kind === 'u' ? c.lv <= 4 : c.lv <= 1;
    answer(d, c, ok ? 3 : 0, 3);
  }
  assert.ok(level(d.stair.u) - level(d.stair.g) >= 2, `${level(d.stair.u)} vs ${level(d.stair.g)}`);
});

test('MT15 — ghi dở giữa chừng: bản lưu nạp lại luôn nhất quán (ô Beta tính lại khớp thống kê)', () => {
  const E = S.newEngine(), L = L0(15);
  L.know('u:c', true);
  for (let i = 0; i < 30; i++) S.ask(E, L, 'u:c', 3, 1);
  const saved = JSON.parse(JSON.stringify({ ev: E.st, m: E.m })) as { ev: unknown; m: MasteryStore };
  saved.m['u:c']![3]!.a += 5;   // ô dẫn xuất lệch (ghi dở / hỏng)
  const ev = sanitizeEv(saved.ev);
  assert.equal(verify(ev, saved.m), 1);
  assert.deepEqual(saved.m['u:c']![3], recomputeAll(ev)['u:c']![3]);
});

test('MT17 / MT18 — phiên bản nội dung được ghi; đổi luật (slip) tính lại được từ thống kê', () => {
  const st = freshEv(), m: MasteryStore = {};
  const e = ingest(st, m, { node: 'u:v', level: 2, ok: false, item: 'i', cv: 'abc123' }, { dev: 's', ts: 1, day: 1 })!;
  assert.equal(e.cv, 'abc123');
  assert.equal(e.ev, `${RULE.evaluator}/${RULE.mastery}`);
  assert.ok(Math.abs(recomputeAll(st, { ...RULE, slip: 0.5 })['u:v']![2]!.b - 1.5) < 1e-9);
});

test('MT19 — thiên lệch: kỹ năng chơi game và tốc độ không thành điểm ngôn ngữ', () => {
  const g = S.gameContamination();
  assert.ok(g.withEvaluator < g.naive * 0.6, JSON.stringify(g));
  assert.ok(S.speedBias() < 0.01);
});

test('MT20 — tái tạo quyết định: mọi snapshot Đạt/mở lại trong một phiên học mô phỏng tái tạo ra đúng kết luận', () => {
  const E = S.newEngine(), L = new S.Learner({ ...S.DEFAULT_PROFILE }, S.rng(20));
  for (let i = 0; i < 20; i++) L.know(`u:r${i}`, i % 3 !== 0);
  for (let i = 0; i < 3000; i++) S.ask(E, L, `u:r${i % 20}`, 3, 1 + Math.floor(i / 200));
  const snaps = E.st.snap.filter(s => s.kind === 'mastery');
  assert.ok(snaps.length > 10);
  for (const s of snaps) assert.equal(replay(s), s.dec, JSON.stringify(s));
});

test('Thống kê (L2): không có dương tính giả trên learner chưa biết; ngưỡng đổi thì FP/FN đổi đúng chiều', () => {
  const r = S.fpfn(300);
  assert.ok(r.fp <= 0.02, JSON.stringify(r));
  const t = S.thresholdSensitivity();
  for (let i = 1; i < t.length; i++) assert.ok(t[i]!.fn >= t[i - 1]!.fn - 1e-9);
});
