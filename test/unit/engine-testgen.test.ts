import { test } from 'node:test';
import assert from 'node:assert/strict';
import { genForm, rngOf, BLUEPRINT, type GenIn, type NodePool } from '../../src/engine/testgen.ts';
import { gateState, GATE, RETRY, sanitizeGate, mergeGate } from '../../src/engine/gate.ts';
import type { Group } from '../../src/exam/content.ts';

const pools: NodePool[] = Array.from({ length: 30 }, (_, i) => ({ node: `${i % 2 ? 'g' : 'u'}:n${i}`, area: i % 2 ? 'gra' : 'voc', cefr: 'A2',
  items: [0, 1, 2].map(k => ({ id: `q${i}-${k}`, level: 2, g: 1 / 3, prompt: `Câu ${i}.${k}`, opts: ['x', 'y', 'z'], ans: k })) }));
const base = (seed: number, over: Partial<GenIn> = {}): GenIn => ({ goal: 'cefr-a2', seed, bank: [], used: new Set(), pools, seen: () => false, ...over });
const sig = (g: Group) => JSON.stringify([g.paras, g.script, g.items.map(i => [i.q, i.opts, i.ans])]);

test('v141 bảng tiêu chí: A1 / A2 đủ số câu từng phần; Viết 2 bài + Nói 1 bài', () => {
  for (const goal of ['cefr-a1', 'cefr-a2'] as const) {
    const lv = goal === 'cefr-a1' ? 'A1' : 'A2', bp = BLUEPRINT[lv], f = genForm(base(7, { goal }));
    const by = (suf: string) => f.groups.find(g => g.id.endsWith(suf))!;
    assert.equal(by('-r1').items.length, bp.r1, goal);
    assert.equal(by('-r2').items.length, bp.r2, goal);
    assert.equal(by('-vg').items.length, bp.vg, goal);
    assert.equal(by('-l1').items.length, bp.l1, goal);
    assert.equal(by('-l2').items.length, bp.l2, goal);
    assert.deepEqual(f.ws.map(t => t.kind), ['w', 'w', 's']);
    assert.ok(f.ws.every(t => t.lv === lv && t.min >= 20));
  }
});

test('v141 cùng hạt → cùng bài; 200 hạt → 200 bài khác nhau, đoạn biển báo hiếm trùng', () => {
  assert.equal(JSON.stringify(genForm(base(42))), JSON.stringify(genForm(base(42))));
  const forms = Array.from({ length: 200 }, (_, i) => genForm(base(1000 + i * 7919)));
  assert.equal(new Set(forms.map(f => f.groups.map(sig).join('|'))).size, 200);
  const notes = forms.flatMap(f => f.groups.find(g => g.id.endsWith('-r1'))!.paras!.map(p => p.replace(/^\d+\. /, '')));
  assert.ok(new Set(notes).size / notes.length > 0.97, `trùng ${notes.length - new Set(notes).size}/${notes.length}`);
});

test('v141 câu khuôn: đáp án là một phương án; đáp án và hai phương án nhiễu đều có mặt trong bài / lời thoại', () => {
  for (let s = 1; s <= 120; s++) {
    for (const g of genForm(base(s * 31)).groups.filter(g => !g.id.endsWith('-vg'))) {
      const src = ((g.paras ?? []).join(' ') + ' ' + (g.script ?? []).map(l => l.t).join(' ')).toLowerCase();
      for (const it of g.items) {
        const keys = it.opts!.map(o => o.k);
        assert.ok(keys.includes(it.ans as string), it.id);
        for (const o of it.opts!) {
          const core = o.t.replace(/^(by |the |room )/i, '').replace(/ (dollars|days|weeks|bus)$/, '').replace(/^.*'s /, '').toLowerCase();
          assert.ok(src.includes(core), `${it.id}: "${o.t}" không có trong bài`);
        }
      }
    }
  }
});

test('v141 vị trí đáp án đúng chia đều (không đoán được bằng vị trí)', () => {
  const n: Record<string, number> = { A: 0, B: 0, C: 0 }; let t = 0;
  for (let s = 1; s <= 200; s++) for (const g of genForm(base(s * 13)).groups.filter(g => !g.id.endsWith('-vg'))) for (const it of g.items) { n[it.ans as string]!++; t++; }
  for (const k of ['A', 'B', 'C']) assert.ok(n[k]! / t > 0.28 && n[k]! / t < 0.39, `${k}: ${(n[k]! / t).toFixed(2)}`);
});

test('v141 không ra câu đã gặp (ev.seen) và câu có sẵn đã dùng (gg.used); hết câu có sẵn thì sinh từ khuôn', () => {
  const seen = new Set(pools.flatMap(p => p.items.slice(0, 2).map(i => `${p.node}|${i.id}`)));
  const f = genForm(base(5, { seen: (n, id) => seen.has(`${n}|${id}`) }));
  for (const it of f.groups.find(g => g.id.endsWith('-vg'))!.items) assert.equal(it.opts![['A', 'B', 'C'].indexOf(it.ans as string)]!.t, 'z', 'chỉ còn câu thứ 3 (đáp án z) chưa gặp');
  const old: Group = { id: 'gt-a2-1-r2', kind: 'reading', exams: [], qtype: 'pl-r', level: 'A2', band: 3, mode: 'gate', title: 'Old', instr: '', paras: ['x'], items: [1, 2, 3].map(k => ({ id: `old-${k}`, q: 'q', opts: [{ k: 'A', t: 'a' }, { k: 'B', t: 'b' }], ans: 'A', b: 3, ev: { p: 0, s: 'x' }, why: '' })) };
  const a = genForm(base(5, { bank: [old] }));
  assert.ok(a.groups.includes(old)); assert.deepEqual(a.bankIds, ['old-1', 'old-2', 'old-3']);
  const b = genForm(base(5, { bank: [old], used: new Set(['old-2']) }));
  assert.ok(!b.groups.includes(old)); assert.ok(b.groups.some(g => g.id.endsWith('-r2'))); assert.deepEqual(b.bankIds, []);
  assert.ok(!genForm(base(5, { pools: [] })).groups.some(g => g.id.endsWith('-vg')), 'không có câu theo nút thì bỏ phần đó');
});

test('v141 làm lại: rớt thì chờ 3 ngày VÀ vững thêm; bài sinh không có "hết bộ"', () => {
  const r = { form: 'a2-g1', goal: 'cefr-a2', day: 100, n: 20, ok: 9, theta: 2, se: 0.5, p: 0.3, lo: 1, hi: 3, passed: false, secs: 600, sk: {}, sol: 300 };
  const sv = { done: { 'a2-g1': r } }, tot = 359;
  assert.deepEqual(gateState('cefr-a2', 300, tot, sv, 101).wait, { days: 2, more: 1 });
  assert.equal(gateState('cefr-a2', 301, tot, sv, 102).open, false);
  assert.equal(gateState('cefr-a2', 301, tot, sv, 100 + RETRY.wait).open, true);
  assert.equal(gateState('cefr-a2', 300, tot, sv, 120).open, false, 'đủ ngày nhưng chưa vững thêm');
  assert.equal(gateState('cefr-a2', 200, tot, undefined, 5).open, false, `dưới ${GATE.open * 100}% thì chưa mở`);
  assert.deepEqual(gateState('cefr-a2', 300, tot, undefined, 5).left, ['gen']);
  const s1 = sanitizeGate({ done: { 'a2-g1': { ...r, seed: 77 } }, used: ['old-1', 'old-1', '<x>'] })!;
  assert.equal(s1.done['a2-g1']!.sol, 300); assert.equal(s1.done['a2-g1']!.seed, 77); assert.deepEqual(s1.used, ['old-1']);
  assert.deepEqual(mergeGate({ done: {}, used: ['a'] }, { done: {}, used: ['b'] })!.used, ['a', 'b']);
});

test('v141 Thử sức: chỉ phần của kỹ năng, câu nút đúng kỹ năng', () => {
  const v = genForm(base(9, { parts: { vg: 6 }, areas: ['gra'] }));
  assert.deepEqual(v.groups.map(g => g.id.split('-').at(-1)), ['vg']);
  assert.ok(v.groups[0]!.items.every(i => i.tag === 'gra'));
  assert.equal(genForm(base(9, { parts: { l1: 4 } })).groups[0]!.items.length, 4);
  assert.equal(rngOf(1)(), rngOf(1)());
});

test('v175 câu khuôn đúng ngữ pháp (góp ý #9): không "a + nguyên âm", không "There\'s no + danh từ số nhiều"', () => {
  for (let s = 1; s <= 300; s++) {
    for (const goal of ['cefr-a1', 'cefr-a2']) {
      const f = genForm(base(s * 17, { goal }));
      const txt = f.groups.flatMap(g => [...(g.paras ?? []), ...(g.script ?? []).map(l => l.t), ...g.items.map(i => i.q)]).join(' ');
      assert.doesNotMatch(txt, /\ba [aeiou]/i, `hạt ${s}`);
      assert.doesNotMatch(txt, /There's no \w+s\b/, `hạt ${s}`);
    }
  }
});

test('v175 bài đọc / nghe dài có ≥ 4 khung; hội thoại ngắn không luôn chốt ở câu cuối (góp ý #10)', () => {
  const heads = new Set<string>(); let notLast = 0, n = 0;
  for (let s = 1; s <= 120; s++) {
    const f = genForm(base(s * 29, { goal: 'cefr-a1' }));
    heads.add(f.groups.find(g => g.id.endsWith('-r2'))!.items[0]!.q.split(' ').slice(0, 3).join(' '));
    for (const it of f.groups.find(g => g.id.endsWith('-l1'))!.items) {
      const ans = it.opts!.find(o => o.k === it.ans)!.t.replace(/^by /, ''); n++;
      if (!it.ev.s.includes(ans)) notLast++;
    }
  }
  assert.ok(heads.size >= 4, [...heads].join(' | '));
  assert.ok(notLast / n > 0.1, `đáp án không ở câu cuối: ${notLast}/${n}`);
});
