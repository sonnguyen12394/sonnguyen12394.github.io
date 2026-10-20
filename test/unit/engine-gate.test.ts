import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { gateScore, gateState, gatePassAll, revBad, sanitizeGate, mergeGate, phi, GATE, GATE_FORMS, TRY_MAX, type GateAns } from '../../src/engine/gate.ts';

// v111 trận cổng (SPEC "Mô hình học v111" §3–§4): câu lạ, P(đậu) ≥ 80%, mở khi bản đồ gần đủ, đề đã mở không dùng lại.
const FORM = (f: string) => JSON.parse(readFileSync(`content/exam/gate/${f}.json`, 'utf8')) as Array<{ id: string; kind: string; mode: string; items: Array<{ id: string; b: number; opts: unknown[] }> }>;
const answers = (f: string, rate: number): GateAns[] => FORM(f).flatMap(g => g.items.map(it => ({ skill: g.kind === 'reading' ? 'R' as const : 'L' as const, b: it.b, g: 1 / it.opts.length, ok: false })))
  .map((a, i) => ({ ...a, ok: Math.floor((i + 1) * rate) > Math.floor(i * rate) }));

test('v111 chấm cổng: đúng hết → qua; đoán bừa (1/3) → không qua; khoảng 70% là ranh giới; P đơn điệu theo số câu đúng', () => {
  for (const [goal, f] of [['cefr-a1', 'a1-1'], ['cefr-a2', 'a2-1'], ['cefr-b1', 'b1-1']] as const) {
    assert.equal(gateScore(goal, f, answers(f, 1), 1, 60).passed, true);
    assert.equal(gateScore(goal, f, answers(f, 1 / 3), 1, 60).passed, false, 'đoán bừa không qua cổng');
    let prev = -1;
    for (const r of [0.33, 0.5, 0.6, 0.7, 0.8, 0.9, 1]) { const p = gateScore(goal, f, answers(f, r), 1, 60).p; assert.ok(p >= prev, `${goal} ${r}`); prev = p; }
  }
  const r = gateScore('cefr-a2', 'a2-1', answers('a2-1', 0.8), 1, 60);
  assert.ok(r.sk.R && r.sk.L); assert.ok(r.lo < r.theta && r.theta < r.hi);
  assert.ok(Math.abs(phi(0) - 0.5) < 1e-6 && Math.abs(phi(1.2816) - 0.9) < 1e-3);
});

test('v111 luật mở cổng (bộ cố định, nay chỉ còn B1): khoá khi chưa gần đủ; mở khi đủ; bộ đã mở không dùng lại; qua rồi thì không mở nữa', () => {
  assert.equal(gateState('cefr-b1', 10, 100, undefined).open, false);
  const s = gateState('cefr-b1', 80, 100, undefined);
  assert.equal(s.open, true); assert.deepEqual(s.left, ['b1-1', 'b1-2']);
  assert.deepEqual(gateState('cefr-b1', 80, 100, { done: {}, seen: ['b1-1'] }).left, ['b1-2']);
  const fail = gateScore('cefr-b1', 'b1-1', answers('b1-1', 0.4), 1, 60), pass = gateScore('cefr-b1', 'b1-2', answers('b1-2', 1), 2, 60);
  assert.equal(gateState('cefr-b1', 80, 100, { done: { 'b1-1': fail } }).open, true, 'rớt thì còn bộ lạ thứ hai');
  const both = gateState('cefr-b1', 80, 100, { done: { 'b1-1': fail, 'b1-2': pass } });
  assert.equal(both.open, false); assert.equal(both.passed?.form, 'b1-2');
  // v141 A1 / A2: bài sinh mỗi lần, không có "hết bộ"; qua rồi thì không mở nữa
  assert.deepEqual(gateState('cefr-a2', 80, 100, undefined).left, ['gen']);
  assert.equal(gateState('cefr-a2', 80, 100, { done: { 'a2-g1': { ...pass, form: 'a2-g1', goal: 'cefr-a2' } } }).open, false);
  assert.equal(gateState('cefr-b2', 80, 100, undefined).has, false);
  assert.ok(GATE.open > 0 && GATE.ready === 0.8);
});

test('v111 lưu cổng: làm sạch, gộp hai máy giữ lần làm SỚM hơn (lần đầu mới là câu lạ), hợp danh sách đề đã mở và điểm ngoài', () => {
  const a = gateScore('cefr-a2', 'a2-1', answers('a2-1', 0.9), 5, 60), b = gateScore('cefr-a2', 'a2-1', answers('a2-1', 0.4), 3, 60);
  const m = mergeGate({ done: { 'a2-1': a }, seen: ['a2-1'], cert: 1, ext: [{ goal: 'cefr-a2', day: 6, score: 131, pass: true, pred: 0.9, src: 'sample' }] }, { done: { 'a2-1': b }, seen: ['a2-2'] })!;
  assert.equal(m.done['a2-1']!.day, 3); assert.deepEqual(m.seen!.sort(), ['a2-1', 'a2-2']); assert.equal(m.cert, 1); assert.equal(m.ext!.length, 1);
  const s = sanitizeGate({ done: { 'a2-1': { ...a, goal: 'cefr-a2', p: 7 }, 'x y': a, bad: { goal: 'hack' } }, seen: ['a2-1', 3, '<x>'], ext: [{ goal: 'cefr-a2', score: 999, src: 'evil' }] })!;
  assert.deepEqual(Object.keys(s.done), ['a2-1']); assert.equal(s.done['a2-1']!.p, 1);
  assert.deepEqual(s.seen, ['a2-1']); assert.equal(s.ext![0]!.score, 250); assert.equal(s.ext![0]!.src, 'sample');
});

test('v111 cách ly: đề cổng nằm riêng (mode gate, gói gate), đủ 2 đề mỗi cấp, id câu không trùng câu của kho luyện / xếp lớp', () => {
  const ids = new Set<string>(), other = new Set<string>();
  for (const f of Object.values(GATE_FORMS).flat()) for (const g of FORM(f)) { assert.equal(g.mode, 'gate'); for (const it of g.items) ids.add(it.id); }
  assert.ok(ids.size >= 130);
  assert.deepEqual(GATE_FORMS['cefr-b1'], ['b1-1', 'b1-2'], 'v116 cổng B1');
  for (const lv of Object.keys(GATE_FORMS)) assert.ok(GATE_FORMS[lv]!.length >= 2);
  const walk = (d: string): string[] => readdirSync(d, { withFileTypes: true }).flatMap(e => (e.isDirectory() ? walk(`${d}/${e.name}`) : e.name.endsWith('.json') ? [`${d}/${e.name}`] : []));
  for (const f of walk('content/exam').filter(f => !f.includes('/gate/') && !f.includes('/types/'))) {
    const d = JSON.parse(readFileSync(f, 'utf8'));
    for (const g of Array.isArray(d) ? d : [d]) { if (g?.mode === 'gate') assert.fail(`nhóm cổng nằm ngoài content/exam/gate: ${f}`); for (const it of g?.items ?? []) other.add(it.id); }
  }
  for (const id of ids) assert.ok(!other.has(id), id);
  const idx = JSON.parse(readFileSync('src/exam/gen/index.json', 'utf8')) as { packs: Record<string, { qtypes: string[] }> };
  assert.ok(idx.packs.gate, 'gói gate riêng');
});

test('v141 Thử sức: làm sạch (chỉ A1 / A2, mã kỹ năng hợp lệ, ≤ TRY_MAX), gộp hai máy bỏ trùng theo ngày', () => {
  const t = { day: 3, lv: 'A2', sk: 'lis', ok: 4, n: 7 };
  const s = sanitizeGate({ done: {}, tries: [t, { ...t, lv: 'B1' }, { ...t, sk: '<x>' }, 5, ...Array.from({ length: 80 }, (_, i) => ({ ...t, day: i }))] })!;
  assert.ok(s.tries!.length <= TRY_MAX); assert.ok(s.tries!.every(x => x.lv === 'A2' && x.sk === 'lis'));
  const m = mergeGate({ done: {}, tries: [t] }, { done: {}, tries: [t, { ...t, day: 1, sk: 'wr', w: 60 }] })!;
  assert.deepEqual(m.tries!.map(x => x.day), [1, 3]);
});

test('v154 hai thanh (v158 Nhớ 50%): mở thi khi Học ≥ 80% VÀ Nhớ ≥ 50%; Nhớ không bù cho Học', () => {
  const T = 100, sv = undefined;
  assert.equal(gateState('cefr-a2', 90, T, sv, 10, { learn: 100, mem: 80, total: T }).open, true);   // v176 chuẩn Học 100% · Nhớ 80%
  assert.equal(gateState('cefr-a2', 90, T, sv, 10, { learn: 99, mem: 100, total: T }).open, false, 'Học 99% thì Nhớ 100% cũng không mở');
  assert.equal(gateState('cefr-a2', 90, T, sv, 10, { learn: 100, mem: 79, total: T }).open, false, 'Nhớ dưới 80%');
  assert.equal(gateState('cefr-a2', 10, T, sv, 10, { learn: 100, mem: 85, total: T }).open, true, 'có hai thanh thì không dùng luật vững cũ');
  const s = gateState('cefr-a2', 0, T, sv, 10, { learn: 50, mem: 20, total: T });
  assert.equal(s.learn, 0.5); assert.equal(s.mem, 0.2);
});

test('v158 đậu cả bài = Đọc + Nghe qua VÀ mỗi bài Viết / Nói ≥ 60%; câu có sẵn bị soát là lỗi thì không ra', () => {
  const w = (pct: number, kind: 'w' | 's' = 'w') => ({ id: 'g-a2-1-w1', kind, pct, words: 30 });
  assert.equal(gatePassAll(true, [w(0.6), w(0.8, 's')]), true);
  assert.equal(gatePassAll(true, [w(0.5), w(0.9, 's')]), false, 'Viết 50% thì rớt dù Đọc + Nghe qua');
  assert.equal(gatePassAll(false, [w(1)]), false, 'Đọc + Nghe chưa qua thì rớt');
  assert.equal(gatePassAll(true, undefined), true, 'bộ chưa có Viết / Nói: chỉ Đọc + Nghe');
  const sv = sanitizeGate({ done: {}, rev: { 'a2-1-r1-1': { ok: false, day: 1, t: 'x', bank: 1 }, 'a2-g9-r1-0': { ok: false, day: 1, t: 'y' }, 'a2-1-r1-2': { ok: true, day: 1, t: 'z', bank: 1 } } });
  assert.deepEqual(revBad(sv), ['a2-1-r1-1'], 'chỉ câu có sẵn bị đánh dấu lỗi mới bị loại; câu từ khuôn ghi lại để sửa khuôn');
});
