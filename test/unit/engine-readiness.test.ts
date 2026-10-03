import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cefrToBand, toBand, selfBias, wsDist, SE_FLOOR_MID, type RawGrade } from '../../src/engine/grader.ts';
import { examReadiness, masteryReadiness, lrDist, skillDists, type SkillK } from '../../src/engine/readiness.ts';
import type { Dist } from '../../src/engine/grader.ts';
import type { Goal, Req } from '../../src/engine/types.ts';
import type { RealScore, Resp } from '../../src/exam/state.ts';

const goal = (kind: Goal['kind'], target: string): Goal => ({ id: `${kind}-${target}`, version: '1.0', kind, vi: '', target, cefr: 'B1', req: [] });
const d = (mean: number, se = 0.3): Dist => ({ mean, se, n: 10, conf: se <= 0.3 ? 'high' : 'mid', src: ['irt'] });
const all = (m: number, se?: number): Record<SkillK, Dist> => ({ L: d(m, se), R: d(m, se), W: d(m, se), S: d(m, se) });

test('quy đổi về band: CEFR liên tục, VSTEP nội suy theo bảng', () => {
  assert.equal(cefrToBand(2), 4.5);
  assert.equal(cefrToBand(3), 6);
  assert.equal(toBand(4, 'vstep'), 4);
  assert.equal(toBand(6, 'vstep'), 5.5);
  assert.ok(toBand(5.75, 'vstep') > 5 && toBand(5.75, 'vstep') < 5.5);
});

test('người chấm: chưa có AI/điểm thật thì tin cậy tối đa Vừa; tự chấm cao hơn điểm thật thì bị trừ', () => {
  const g: RawGrade[] = Array.from({ length: 6 }, (_, i) => ({ by: 'self', skill: 'W', day: 100 - i, v: 6, scale: 'vstep' }));
  const w = wsDist(g, [], 'W', 100)!;
  assert.equal(w.se, SE_FLOOR_MID);
  assert.equal(w.conf, 'mid');
  const real: RealScore[] = [{ exam: 'vstep', day: 101, L: null, R: null, W: 5, S: null }];
  const b = selfBias(g, real, 'W');
  assert.equal(b.n, 1);
  assert.ok(Math.abs(b.bias - (toBand(6, 'vstep') - toBand(5, 'vstep'))) < 1e-9);
  const later = wsDist(g.map(x => ({ ...x, day: x.day + 5 })), real, 'W', 106)!;
  assert.ok(later.mean < toBand(6, 'vstep'), `${later.mean}`);
  assert.equal(wsDist([], [], 'S', 100), null);
});

test('IELTS: xác suất tăng theo band ước tính; ở sát ngưỡng làm tròn ≈ 50%', () => {
  const g = goal('ielts-ac', '6.5');
  const low = examReadiness(g, all(5.5), []), mid = examReadiness(g, all(6.15), []), high = examReadiness(g, all(7.5), []);
  assert.ok(low.p! < 0.1 && high.p! > 0.95, `${low.p} ${high.p}`);
  // band từng kỹ năng làm tròn 0,5 rồi tổng làm tròn 0,5: trung bình thật ≈ 6,13 là ngưỡng đạt 6.5
  assert.ok(mid.p! > 0.3 && mid.p! < 0.8, `${mid.p}`);
  assert.equal(high.ready, true);
  assert.ok(high.lo! <= high.mid! && high.mid! <= high.hi!);
  // cùng dữ liệu → cùng con số
  assert.equal(examReadiness(g, all(6.15), []).p, mid.p);
});

test('thiếu kỹ năng thì không đưa xác suất tổng, nói rõ thiếu gì', () => {
  const r = examReadiness(goal('vstep', 'B1'), { ...all(5), W: null, S: null }, []);
  assert.equal(r.p, null);
  assert.deepEqual(r.missing, ['W', 'S']);
  assert.equal(r.conf, 'low');
  assert.ok(r.skills.find(s => s.k === 'L')!.p! > 0.9);
});

test('VSTEP B1: trung bình 4 kỹ năng ≥ 4,0 theo Quyết định 729', () => {
  assert.ok(examReadiness(goal('vstep', 'B1'), all(5), []).p! > 0.95);
  assert.ok(examReadiness(goal('vstep', 'B2'), all(4), []).p! < 0.05);
});

test('đạt mục tiêu thi chỉ bằng điểm thật đủ 4 kỹ năng', () => {
  const g = goal('ielts-ac', '6.5');
  const real: RealScore[] = [{ exam: 'ielts-ac', day: 50, L: 7, R: 6.5, W: 6, S: 6.5 }, { exam: 'ielts-ac', day: 60, L: 7, R: null, W: 6, S: 6.5 }];
  assert.deepEqual(examReadiness(g, all(5), real).achieved, { day: 50, score: 6.5 });
  assert.equal(examReadiness(g, all(9), []).achieved, null);
  assert.equal(examReadiness(goal('ielts-gt', '6.5'), all(5), real).achieved, null);
});

test('Nghe/Đọc: IRT cần ≥ 8 câu; điểm thật gần đây được gộp vào', () => {
  const resp: Resp[] = Array.from({ length: 20 }, (_, i) => ({ i: 'q' + i, c: (i % 4 ? 1 : 0) as 0 | 1, d: 100, s: 'R', b: 6, g: 0.25 }));
  const r = lrDist(resp, [], 'R', 100)!;
  assert.ok(r.mean > 5 && r.mean < 8, `${r.mean}`);
  assert.equal(lrDist(resp.slice(0, 5), [], 'R', 100), null);
  const withReal = lrDist([], [{ exam: 'ielts-ac', day: 90, L: null, R: 6, W: null, S: null }], 'R', 100)!;
  assert.equal(withReal.mean, 6);
  assert.equal(withReal.conf, 'high');
  assert.equal(skillDists([], [], [], 100).W, null);
});

test('CEFR/giao tiếp: tỉ lệ nút Đạt với tin cậy ≥ Vừa + bài làm thật; quên trong 14 ngày thì chưa xác nhận đạt', () => {
  const req: Req[] = [{ node: 'a', level: 3, type: 'foundation' }, { node: 'b', level: 3, type: 'skill' }, { node: 'c', level: 4, type: 'performance' }];
  const half = masteryReadiness(req, r => ({ pass: r.node !== 'c', conf: r.node === 'a' ? 'mid' : 'low' }), null, 100);
  assert.equal(half.done, 1);
  assert.equal(half.perfDone, 0);
  assert.equal(half.p, 1 / 3);
  const full = masteryReadiness(req, () => ({ pass: true, conf: 'high' }), 95, 100);
  assert.equal(full.ready, true);
  assert.equal(full.achieved, false);
  assert.equal(masteryReadiness(req, () => ({ pass: true, conf: 'high' }), 80, 100).achieved, true);
});
