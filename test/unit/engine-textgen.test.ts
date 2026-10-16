import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genText, tierOf, avgLen, type Lv, type Tier } from '../../src/engine/textgen.ts';
import { TOPICS, POOLS } from '../../src/engine/textbank.ts';
import { coverage } from '../../src/engine/pronote.ts';
import { corpus } from '../../tools/pronote-cov.ts';

// v144 bài luyện ngẫu nhiên theo cấp: sinh từ khuôn song song Anh – Việt, A1 / A2 × 3 bậc, có hạt.
const LVS: Lv[] = ['A1', 'A2'], TIERS: Tier[] = [1, 2, 3], KINDS = ['read', 'talk'] as const;

test('v144 cùng hạt cùng bài; hạt khác ra bài khác; bài nói xen kẽ A / B', () => {
  const a = genText({ lv: 'A1', tier: 2, kind: 'read', seed: 42 }), b = genText({ lv: 'A1', tier: 2, kind: 'read', seed: 42 });
  assert.deepEqual(a, b);
  const ids = new Set(Array.from({ length: 50 }, (_, i) => genText({ lv: 'A2', tier: 2, kind: 'read', seed: i + 1 }).lines.map(l => l.en).join(' ')));
  assert.ok(ids.size >= 40, `${ids.size}/50 bài khác nhau`);
  const t = genText({ lv: 'A2', tier: 1, kind: 'talk', seed: 7 });
  t.lines.forEach((l, i) => assert.equal(l.sp, i % 2 ? 'B' : 'A'));
});

test('v144 200 hạt mỗi cấp × bậc × loại: không còn khe chưa điền, câu nào cũng có nghĩa Việt, viết hoa đầu câu', () => {
  for (const lv of LVS) for (const tier of TIERS) for (const kind of KINDS) for (let s = 1; s <= 200; s++) {
    const g = genText({ lv, tier, kind, seed: s });
    assert.ok(g.lines.length >= 3, `${lv}${tier}${kind}${s}`);
    for (const l of g.lines) {
      assert.ok(!/[{}]/.test(l.en + l.vi), `${l.en} / ${l.vi}`);
      assert.ok(l.vi.trim().length > 1 && l.en.trim().length > 1);
      assert.match(l.en, /^["“(]?[A-Z0-9]/); assert.match(l.vi, /^["“(]?[\p{Lu}0-9]/u);
    }
  }
});

test('v144 dễ → khó: độ dài câu trung bình tăng theo bậc ở mỗi cấp và loại bài', () => {
  for (const lv of LVS) for (const kind of KINDS) {
    const m = TIERS.map(tier => Array.from({ length: 200 }, (_, i) => avgLen(genText({ lv, tier, kind, seed: i + 1 }).lines.map(l => l.en))).reduce((a, b) => a + b) / 200);
    assert.ok(m[0]! < m[1]! && m[1]! < m[2]!, `${lv} ${kind}: ${m.map(x => x.toFixed(1)).join(' / ')}`);
  }
  assert.equal(tierOf('I like tea.'), 1); assert.equal(tierOf('I live in a small house with my family.'), 2);
});

test('v144 kho khuôn: khe nào cũng có kho; A1 không dùng thì quá khứ; mỗi chủ đề đủ câu cho cả ba bậc', () => {
  for (const t of TOPICS) {
    for (const f of [...t.read, ...t.talk.flat()]) for (const m of (f[0] + f[1]).matchAll(/\{([A-Z]+)\d*(?::[a-z]+)?\}/g)) assert.ok(POOLS[m[1]!], `${t.id}: ${m[1]}`);
    if (t.lv === 'A1') for (const f of [...t.read, ...t.talk.flat()]) assert.ok(!/\b(went|was|were|did|had|ago|yesterday|last)\b/.test(f[0]), `A1 quá khứ: ${f[0]}`);
    const c = [0, 0, 0, 0]; t.read.forEach(f => { const k = tierOf(f[0]); c[k] = (c[k] ?? 0) + 1; });
    assert.ok(c[1]! >= 3 && c[2]! >= 2 && c[3]! >= 2, `${t.id}: ${c.slice(1).join('/')}`);
  }
});

test('v144 phiên âm phủ ≥ 95% từ của bài sinh (trừ tên riêng)', () => {
  const { ipaOf } = corpus(), lines: string[] = [];
  for (const lv of LVS) for (const tier of TIERS) for (const kind of KINDS) for (let s = 1; s <= 30; s++) lines.push(...genText({ lv, tier, kind, seed: s }).lines.map(l => l.en));
  const r = coverage(lines, ipaOf);
  assert.ok(r.hit / r.n >= 0.95, `${(100 * r.hit / r.n).toFixed(1)}%: ${[...r.miss.keys()].slice(0, 30).join(' ')}`);
});
