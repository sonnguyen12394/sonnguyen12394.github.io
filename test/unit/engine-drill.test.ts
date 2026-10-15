import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { DRILL_PARTS, nextGroup, markGroup, recordGroup, partStat, weakest, sanitizeDrill, mergeDrill, partOf, WEAK_MIN } from '../../src/engine/drill.ts';
import { sanitizeGate, mergeGate } from '../../src/engine/gate.ts';
import { QT, type Group } from '../../src/exam/content.ts';

// v134 Sân tập trước cổng: luyện 10 phần dạng A2 Key bằng câu riêng, chữa ngay; lần làm đầu là số đo theo phần.
const DIR = 'content/exam/practice';
const drillGroups = (): Group[] => existsSync(DIR) ? readdirSync(DIR).filter(f => /^k-[rl][1-5]\.json$/.test(f)).flatMap(f => JSON.parse(readFileSync(`${DIR}/${f}`, 'utf8')) as Group[]) : [];

test('v134 Sân tập: 10 phần đều có trong danh mục dạng câu, đúng kỹ năng', () => {
  assert.equal(DRILL_PARTS.length, 10);
  for (const p of DRILL_PARTS) { assert.ok(QT[p.q], p.q); assert.equal(QT[p.q]!.skill, p.sk); }
  assert.equal(partOf('k-r3-04'), 'k-r3'); assert.equal(partOf('gt-a2-1-r1'), null); assert.equal(partOf('k-r9-01'), null);
});

test('v134 Sân tập: bài kế tiếp = bài chưa làm theo thứ tự; hết thì bài ít làm lại nhất, làm lâu nhất', () => {
  const ids = ['k-r1-03', 'k-r1-01', 'k-r1-02'];
  assert.equal(nextGroup(ids, undefined), 'k-r1-01');
  assert.equal(nextGroup(ids, { 'k-r1-01': { d: 5, ok: 3, n: 6 } }), 'k-r1-02');
  const all = { 'k-r1-01': { d: 5, ok: 3, n: 6, r: 1 }, 'k-r1-02': { d: 6, ok: 3, n: 6 }, 'k-r1-03': { d: 4, ok: 3, n: 6, r: 2 } };
  assert.equal(nextGroup(ids, all), 'k-r1-02');
  assert.equal(nextGroup([], all), null);
});

test('v134 Sân tập: lần đầu là số đo, làm lại không ghi đè; thống kê theo phần', () => {
  let dr = recordGroup(undefined, 'k-l2-01', 2, 5, 10);
  dr = recordGroup(dr, 'k-l2-01', 5, 5, 11);
  assert.deepEqual(dr['k-l2-01'], { d: 10, ok: 2, n: 5, r: 1 });
  dr = recordGroup(dr, 'k-l2-02', 4, 5, 12);
  const s = partStat(dr, 'k-l2', 6);
  assert.deepEqual({ done: s.done, ok: s.ok, n: s.n }, { done: 2, ok: 6, n: 10 });
  assert.equal(partStat(dr, 'k-r1', 6).acc, null);
});

test('v134 Sân tập: phần nên luyện = phần đúng < 60% (đủ câu), không thì phần chưa làm', () => {
  const totals = Object.fromEntries(DRILL_PARTS.map(p => [p.q, 6]));
  assert.equal(weakest(undefined, totals), 'k-r1');
  const dr = { 'k-r1-01': { d: 1, ok: 6, n: 6 }, 'k-l3-01': { d: 1, ok: 1, n: WEAK_MIN } };
  assert.equal(weakest(dr, totals), 'k-l3');
  const few = { 'k-l3-01': { d: 1, ok: 0, n: WEAK_MIN - 1 } };   // quá ít câu: chưa kết luận yếu
  assert.equal(weakest(few, totals), 'k-r1');
});

test('v134 Sân tập: làm sạch + gộp hai máy (lần đầu sớm hơn thắng), đi kèm bản lưu trận cổng', () => {
  assert.equal(sanitizeDrill(null), undefined);
  const s = sanitizeDrill({ 'k-r1-01': { d: 3, ok: 9, n: 6 }, 'bad id': { d: 1, ok: 1, n: 1 }, 'gt-a2-1-r1': { d: 1, ok: 1, n: 1 } })!;
  assert.deepEqual(Object.keys(s), ['k-r1-01']); assert.equal(s['k-r1-01']!.ok, 6, 'điểm không vượt số câu');
  const m = mergeDrill({ 'k-r1-01': { d: 5, ok: 6, n: 6, r: 2 } }, { 'k-r1-01': { d: 3, ok: 2, n: 6 }, 'k-r2-01': { d: 4, ok: 4, n: 7 } })!;
  assert.deepEqual(m['k-r1-01'], { d: 3, ok: 2, n: 6, r: 2 }); assert.ok(m['k-r2-01']);
  const gg = sanitizeGate({ done: {}, dr: { 'k-l1-01': { d: 2, ok: 3, n: 5 } } })!;
  assert.deepEqual(gg.dr, { 'k-l1-01': { d: 2, ok: 3, n: 5 } });
  assert.deepEqual(mergeGate(gg, { done: {} })!.dr, gg.dr);
});

test('v134 Sân tập: chấm bằng máy chấm chung; nội dung thật đủ phần, đủ câu, không trùng câu trận cổng', () => {
  const gs = drillGroups();
  if (!gs.length) return;   // nội dung soạn sau phần mã
  const one = gs[0]!, right = Object.fromEntries(one.items.map(it => [it.id, typeof it.ans === 'string' ? it.ans : Array.isArray(it.ans) ? it.ans : it.ans.accept[0]]));
  const full = markGroup(one, right);
  assert.equal(full.ok, full.n); assert.equal(markGroup(one, {}).ok, 0);
  for (const p of DRILL_PARTS) {
    const mine = gs.filter(g => g.qtype === p.q);
    assert.ok(mine.length >= 4, `${p.q}: cần ≥ 4 bài`);
    assert.ok(mine.reduce((s, g) => s + g.items.length, 0) >= 20, `${p.q}: cần ≥ 20 câu`);
    for (const g of mine) { assert.equal(g.mode, 'practice'); assert.equal(g.level, 'A2'); assert.ok(g.id.startsWith(p.q + '-')); }
  }
  const gate = readdirSync('content/exam/gate').filter(f => f.endsWith('.json')).flatMap(f => JSON.parse(readFileSync(`content/exam/gate/${f}`, 'utf8')) as Group[]);
  const gateText = new Set(gate.flatMap(g => [...(g.paras ?? []), ...(g.script ?? []).map(l => l.t)]));
  for (const g of gs) for (const t of [...(g.paras ?? []), ...(g.script ?? []).map(l => l.t)]) assert.ok(!gateText.has(t) || t.length < 30, `${g.id}: trùng nguyên văn câu trận cổng`);
});
