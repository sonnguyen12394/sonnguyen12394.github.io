import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickNodes, nextPhase, report, armOf, sanitizeMeasure, mergeMeasure, MEASURE, type MeasureSave } from '../../src/engine/measure.ts';
import type { Level, Req } from '../../src/engine/types.ts';

// v63 đo hiệu quả học: bộ câu giữ riêng, đo trước / sau / trễ 7 và 30 ngày, nhãn A/B chỉ khi đồng ý.

const need: Req[] = Array.from({ length: 60 }, (_, i) => ({ node: `u:n${i}`, level: 3 as Level, type: 'foundation' }));

test('bộ đo rải đều trên bao đóng mục tiêu, chỉ nút có câu ngữ cảnh mới', () => {
  const ns = pickNodes(need, n => n !== 'u:n2');
  assert.equal(ns.length, MEASURE.size);
  assert.ok(!ns.includes('u:n2'));
  assert.ok(ns[0]! < 'u:n9' && Number(ns.at(-1)!.slice(3)) > 50, `rải đều: ${ns}`);
  assert.equal(new Set(ns).size, ns.length);
});

test('lịch đo: trước → sau (từ 14 ngày) → 7 ngày → 30 ngày sau lần "sau"; báo cáo mức tăng, giữ lại, mỗi giờ học', () => {
  const ms: MeasureSave = { goal: 'cefr-a1', set: [], checks: [] };
  assert.deepEqual(nextPhase(ms, 100), { phase: 'pre', due: true, at: 100 });
  ms.checks.push({ phase: 'pre', day: 100, got: 3, of: 12, mins: 0 });
  assert.equal(nextPhase(ms, 110)!.due, false);
  assert.equal(nextPhase(ms, 114)!.phase, 'post'); assert.equal(nextPhase(ms, 114)!.due, true);
  ms.checks.push({ phase: 'post', day: 120, got: 9, of: 12, mins: 300 });
  assert.equal(nextPhase(ms, 126)!.due, false); assert.equal(nextPhase(ms, 127)!.phase, 'd7');
  ms.checks.push({ phase: 'd7', day: 127, got: 8, of: 12, mins: 320 });
  assert.equal(nextPhase(ms, 150)!.phase, 'd30'); assert.equal(nextPhase(ms, 150)!.due, true);
  ms.checks.push({ phase: 'd30', day: 150, got: 6, of: 12, mins: 400 });
  assert.equal(nextPhase(ms, 200), null);
  const r = report(ms);
  assert.equal(r.gain, 0.5); assert.equal(r.keep7, 0.89); assert.equal(r.keep30, 0.67); assert.equal(r.perHour, 0.1);
});

test('nhãn A/B ổn định theo thiết bị; dữ liệu đo được lọc và gộp hai máy (lần đo đầu tiên được giữ)', () => {
  assert.deepEqual(armOf('abc123', 5), armOf('abc123', 5));
  const s = sanitizeMeasure({ goal: 'cefr-a1', set: [{ node: 'u:a', item: 'w:x:tr' }, { node: 5 }], checks: [{ phase: 'pre', day: 3, got: 50, of: 12 }, { phase: 'pre', day: 9, got: 1, of: 12 }, { phase: 'zzz' }], arm: { a: 'x' } })!;
  assert.equal(s.set.length, 1); assert.equal(s.checks.length, 1); assert.equal(s.checks[0]!.got, 12); assert.equal(s.arm, undefined);
  assert.equal(sanitizeMeasure({ goal: 'BAD GOAL' }), undefined);
  const a: MeasureSave = { goal: 'g', set: [{ node: 'u:a', item: 'i1' }], checks: [{ phase: 'pre', day: 5, got: 2, of: 12, mins: 0 }] };
  const b: MeasureSave = { goal: 'g', set: [{ node: 'u:b', item: 'i2' }], checks: [{ phase: 'pre', day: 7, got: 4, of: 12, mins: 0 }, { phase: 'post', day: 30, got: 9, of: 12, mins: 100 }] };
  const m = mergeMeasure(a, b)!;
  assert.equal(m.set[0]!.item, 'i1'); assert.equal(m.checks.find(c => c.phase === 'pre')!.day, 5); assert.ok(m.checks.some(c => c.phase === 'post'));
});
