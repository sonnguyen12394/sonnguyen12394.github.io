import { test } from 'node:test';
import assert from 'node:assert/strict';
import { makePlan, hoursAt, reachable, weights } from '../../src/exam/plan.ts';

const base = { today: 1000, examDay: 1090, target: 6.5, mins: 60, est: { L: 5.5, R: 6, W: 5, S: 5.5 }, due: 0, hasPlacement: true };

test('số giờ theo Cambridge tăng dần theo band', () => {
  assert.equal(hoursAt(3.5), 190);
  assert.equal(hoursAt(5), 375);
  assert.equal(hoursAt(6.5), 550);
  assert.equal(hoursAt(8), 750);
  assert.ok(hoursAt(6) > hoursAt(5.5));
});

test('ưu tiên kỹ năng xa mục tiêu nhất', () => {
  const w = weights(base.est, 6.5);
  assert.ok(w.W > w.R, JSON.stringify(w));
  assert.ok(w.W > w.L);
  const p = makePlan(base);
  const mins: Record<string, number> = { L: 0, R: 0, W: 0, S: 0 };
  for (const d of p.days) for (const t of d.tasks) if (t.skill) mins[t.skill]! += t.mins;
  assert.ok(mins.W! >= mins.R!, JSON.stringify(mins));
  for (const d of p.days) assert.ok(d.mins <= base.mins, `ngày ${d.day}: ${d.mins}`);
});

test('ôn sổ lỗi sai trước, kiểm tra đầu vào nếu chưa làm', () => {
  const p = makePlan({ ...base, due: 12, hasPlacement: false });
  assert.equal(p.days[0]!.tasks[0]!.kind, 'place');
  assert.equal(p.days[0]!.tasks[1]!.kind, 'review');
});

test('đề thi thử hằng tuần trong 6 tuần cuối', () => {
  const p = makePlan({ ...base, examDay: 1014, mins: 180 });
  assert.ok(p.days.some(d => d.tasks.some(t => t.kind === 'mock')));
  const far = makePlan({ ...base, examDay: 1200 });
  assert.ok(!far.days.some(d => d.tasks.some(t => t.kind === 'mock')));
});

test('cảnh báo không kịp và đề xuất điều chỉnh', () => {
  const p = makePlan({ ...base, examDay: 1030, mins: 30, target: 7.5 });
  const w = p.warnings.find(x => x.code === 'too-little-time');
  assert.ok(w, JSON.stringify(p.warnings));
  assert.ok(w!.fix.some(f => /phút mỗi ngày/.test(f)));
  assert.ok(w!.fix.some(f => /lùi ngày thi/.test(f)));
  assert.ok(w!.fix.some(f => /band/.test(f)));
  assert.ok(reachable(5.5, 15) < 7.5);
  const ok = makePlan({ ...base, target: 6 });
  assert.ok(!ok.warnings.some(x => x.code === 'too-little-time'));
});

test('cảnh báo chậm tiến độ khi 7 ngày học < 60% kế hoạch', () => {
  const p = makePlan({ ...base, target: 6, recentMins: [10, 0, 20, 0, 15, 5, 0] });
  assert.ok(p.warnings.some(x => x.code === 'behind'));
  const q = makePlan({ ...base, target: 6, recentMins: [60, 55, 70, 60, 50, 65, 60] });
  assert.ok(!q.warnings.some(x => x.code === 'behind'));
});

test('thiếu ngày thi hoặc mục tiêu thì nói rõ, vẫn có lịch', () => {
  const p = makePlan({ ...base, examDay: null, target: null });
  assert.ok(p.warnings.some(x => x.code === 'no-date'));
  assert.ok(p.warnings.some(x => x.code === 'no-target'));
  assert.equal(p.days.length, 14);
});
