import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { newPlacement, advance, answerGroup, results, MAX_ITEMS, SECTION_MS, type PSkill } from '../../src/exam/placement.ts';
import { pCorrect } from '../../src/exam/irt.ts';
import type { Group } from '../../src/exam/content.ts';

const dir = new URL('../../content/exam/place/', import.meta.url);
const groups: Group[] = readdirSync(dir).filter(f => f.endsWith('.json')).flatMap(f => JSON.parse(readFileSync(new URL(f, dir), 'utf8')) as Group[]);
const pools: Record<PSkill, Group[]> = { R: groups.filter(g => g.kind === 'reading'), L: groups.filter(g => g.kind === 'listening') };

function rng(seed: number): () => number { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; }; }

// Người học mô phỏng: trả lời đúng với xác suất theo mô hình, sai thì chọn một phương án sai bất kỳ.
function run(truth: number, seed: number, msPerGroup = 40_000) {
  const R = rng(seed), st = newPlacement(['R', 'L'], 0);
  let now = 0, g = advance(st, pools, new Set(), now, R);
  while (g) {
    const given: Record<string, string> = {};
    for (const it of g.items) {
      const opts = (it.opts ?? g.options ?? []).map(o => o.k), c = 1 / opts.length;
      given[it.id] = R() < pCorrect(truth, { b: it.b, c }) ? (it.ans as string) : opts.filter(k => k !== it.ans)[Math.floor(R() * (opts.length - 1))]!;
    }
    answerGroup(st, g, given, new Set());
    now += msPerGroup;
    g = advance(st, pools, new Set(), now, R);
  }
  return { st, res: results(st) };
}

test('kho câu kiểm tra đầu vào ≥ 3 lần số câu rút mỗi lần (5.10)', () => {
  for (const k of ['R', 'L'] as const) {
    const n = pools[k].reduce((s, g) => s + g.items.length, 0);
    assert.ok(n >= 3 * MAX_ITEMS, `${k}: ${n} câu`);
    // trải đều độ khó: có câu dễ (≤ 4) và câu khó (≥ 7.5)
    const bs = pools[k].flatMap(g => g.items.map(i => i.b));
    assert.ok(Math.min(...bs) <= 4 && Math.max(...bs) >= 7.5, `${k}: ${Math.min(...bs)}–${Math.max(...bs)}`);
  }
});

test('mỗi kỹ năng ≤ 12 câu, xong cả hai kỹ năng, không lặp bài', () => {
  const { st, res } = run(6, 1);
  assert.equal(st.finished, true);
  assert.equal(res.length, 2);
  for (const s of st.sections) {
    assert.ok(s.answers.length <= MAX_ITEMS && s.answers.length >= 4, String(s.answers.length));
    assert.equal(new Set(s.used).size, s.used.length);
  }
});

test('hết 7,5 phút thì chuyển kỹ năng (người làm chậm)', () => {
  const { st } = run(6, 2, SECTION_MS / 2 + 1);
  for (const s of st.sections) assert.ok(s.used.length <= 2, String(s.used.length));
});

test('ước tính bám năng lực thật (trung bình sai lệch ≤ 1 band trên nhiều người)', () => {
  for (const truth of [4, 5.5, 7, 8]) {
    let err = 0, n = 0;
    for (let seed = 1; seed <= 40; seed++) { for (const r of run(truth, seed * 7 + Math.round(truth * 10)).res) { err += Math.abs(r.theta - truth); n++; } }
    assert.ok(err / n <= 1, `truth ${truth}: sai lệch TB ${(err / n).toFixed(2)}`);
  }
});

test('câu bị ẩn không được hỏi', () => {
  const hidden = new Set(pools.R.flatMap(g => g.items.map(i => i.id)));
  const st = newPlacement(['R', 'L'], 0);
  const g = advance(st, pools, hidden, 0);
  assert.equal(g?.kind, 'listening');
});
