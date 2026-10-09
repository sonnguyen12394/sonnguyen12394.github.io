import { test } from 'node:test';
import assert from 'node:assert/strict';
import { startDiag, nextProbe, answer, finished, level, priorFor, guessCorrected, recognitionLevel, MAX_PROBES, type Cand } from '../../src/engine/diag.ts';

// 6 cấp × 2 loại × 5 nút mỗi cấp; nút có trọng số khác nhau
const cands: Cand[] = [];
for (let lv = 0; lv < 6; lv++) for (let i = 0; i < 5; i++) for (const kind of ['u', 'g'] as const) cands.push({ id: `${kind}:${lv}-${i}`, kind, lv, weight: i });

// Người học giả: biết chắc mọi thứ tới cấp `know`, không biết gì từ cấp trên.
function simulate(know: number, start = 0): { u: number; g: number; n: number } {
  const d = startDiag(start, 0);
  for (let k = 0; k < 100; k++) {
    if (finished(d, 0, cands.length - d.probed.length)) break;
    const c = nextProbe(d, cands)!;
    const ok = c.lv <= know;
    answer(d, c, ok ? 3 : 0, 3);
  }
  return { u: level(d.stair.u), g: level(d.stair.g), n: d.probed.length };
}

test('chọn nút cùng loại, gần cấp ước tính, nhiều năng lực phụ thuộc nhất; luân phiên từ vựng/ngữ pháp', () => {
  const d = startDiag(2, 0);
  const c1 = nextProbe(d, cands)!;
  assert.equal(c1.kind, 'u');
  assert.equal(c1.lv, 2);
  assert.equal(c1.weight, 4);
  answer(d, c1, 3, 3);
  assert.equal(nextProbe(d, cands)!.kind, 'g');
});

test('cầu thang: đạt lên nửa cấp, trượt xuống nửa cấp, ở giữa giữ nguyên', () => {
  const d = startDiag(2, 0);
  answer(d, cands.find(c => c.kind === 'u' && c.lv === 2)!, 3, 3);
  assert.equal(d.stair.u.est, 2.5);
  answer(d, cands.find(c => c.kind === 'u' && c.lv === 3)!, 0, 3);
  assert.equal(d.stair.u.est, 2);
  assert.equal(d.stair.u.rev, 1);
  answer(d, cands.find(c => c.kind === 'u' && c.lv === 2 && c.weight === 1)!, 1.5, 3);
  assert.equal(d.stair.u.est, 2);
});

test('hội tụ gần cấp thật của người học, trong giới hạn số lượt', () => {
  for (const know of [0, 2, 4]) {
    const r = simulate(know);
    assert.ok(r.n <= MAX_PROBES, `${know}: ${r.n} lượt`);
    assert.ok(Math.abs(r.u - know) <= 1 && Math.abs(r.g - know) <= 1, `biết tới ${know}, ước tính ${r.u}/${r.g}`);
  }
});

test('tiên nghiệm sau chẩn đoán: cấp đã qua câu dò coi như biết, trên một cấp coi như chưa, đúng mức để trống', () => {
  assert.deepEqual(priorFor(0, 2), [6, 0.5]);
  assert.deepEqual(priorFor(4, 2), [1, 3]);
  assert.equal(priorFor(2, 2), null);           // cầu thang còn dao động ở cấp 2: để trống
  assert.deepEqual(priorFor(2, 2.5), [6, 0.5]);   // đã qua câu dò cấp 2, trượt cấp 3: cấp 2 coi như biết (v56)
  assert.equal(priorFor(3, 2.5), null);
});

test('dừng khi hết giờ hoặc hết nút', () => {
  const d = startDiag(0, 0);
  assert.equal(finished(d, 21 * 60 * 1000, 10), true);
  assert.equal(finished(d, 0, 0), true);
  assert.equal(finished(d, 0, 10), false);
});

test('v69 (bot L01): trừ đoán mò — biết 60% với câu 4 lựa chọn (đúng thô ≈ 70%) không đủ để lên cấp', () => {
  assert.equal(guessCorrected(3, 3, 0), 1);
  assert.equal(guessCorrected(0, 3, 0.75), 0);
  // 3 câu chọn 4 phương án + "Không biết" (g = 0,25): đúng 2/3 thô → sau hiệu chỉnh ≈ 0,56 < 2/3 → giữ cấp, không lên.
  const r = guessCorrected(2, 3, 0.75);
  assert.ok(r < 2 / 3 && r > 0.5, String(r));
  const d = startDiag(2, 0);
  answer(d, { id: 'u:x', kind: 'u', lv: 2, weight: 0 }, r * 3, 3);
  assert.equal(d.stair.u.est, 2);
  // Câu tự gõ không có đoán mò: không trừ gì.
  assert.equal(guessCorrected(2, 3, 0), 2 / 3);
});

test('v71 (bot L03): cấp nhận ra tách khỏi cấp chung — người học nhận ra tốt tới B1 dù tự nhớ ra chỉ A2', () => {
  const rs = [{ kind: 'u' as const, lv: 1, rc: 1 }, { kind: 'u' as const, lv: 2, rc: 0.8 }, { kind: 'u' as const, lv: 3, rc: 0.7 }, { kind: 'u' as const, lv: 4, rc: 0.2 }, { kind: 'g' as const, lv: 2, rc: 0.5 }];
  assert.equal(recognitionLevel(rs, 'u'), 3);
  assert.equal(recognitionLevel(rs, 'g'), null);
});
