import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { skillEstimate, profile, gaps, MIN_N } from '../../src/exam/estimate.ts';
import { freshX, migrateX, sanitizeX, type Resp } from '../../src/exam/state.ts';
import { pCorrect } from '../../src/exam/irt.ts';
import { hiddenItems, sendAttempt, sendPairs, refresh, APP_V } from '../../src/exam/net.ts';
import type { Host } from '../../src/exam/host.ts';

// localStorage giả cho môi trường Node
const store = new Map<string, string>();
beforeEach(() => store.clear());
(globalThis as any).localStorage = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };

function sim(truth: number, n: number, skill: 'L' | 'R', seed = 7): Resp[] {
  let s = seed;
  const R = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 2 ** 32; };
  return Array.from({ length: n }, (_, i) => { const b = 3 + (i % 12) * 0.5; return { i: `q-${skill}-${i}`, c: R() < pCorrect(truth, { b, c: 0.25 }) ? 1 : 0, d: 100, s: skill, b, g: 0.25 }; });
}

test('chưa đủ câu thì chưa đưa con số', () => {
  const x = freshX(); x.resp = sim(6, MIN_N - 1, 'R');
  assert.equal(skillEstimate(x, 'R', 100).band, null);
});

test('ước tính gần năng lực thật, có khoảng sai số, quy đổi CEFR/VSTEP', () => {
  const x = freshX(); x.resp = [...sim(6.5, 80, 'R'), ...sim(5, 80, 'L', 11)];
  const r = skillEstimate(x, 'R', 100), l = skillEstimate(x, 'L', 100);
  assert.ok(Math.abs(r.theta! - 6.5) < 0.8, String(r.theta));
  assert.ok(Math.abs(l.theta! - 5) < 0.8, String(l.theta));
  assert.ok(r.pm! >= 0.5);
  assert.ok(r.cefr === 'B2' || r.cefr === 'C1');
  // câu quá 90 ngày không tính
  assert.equal(skillEstimate(x, 'R', 100 + 91).band, null);
  // câu bị ẩn không tính
  assert.equal(skillEstimate(x, 'R', 100, new Set(x.resp.map(q => q.i))).band, null);
  const p = profile(x, 100);
  assert.equal(p.overall, null);   // chưa có Viết, Nói
  assert.equal(gaps(p, 7)[0]!.gap, 99);
});

test('nâng cấp tiến độ ôn thi v1 → v2 giữ dữ liệu cũ, đồng ý chia sẻ cần tuổi hợp lệ', () => {
  const v1 = { v: 1, exam: 'vstep', target: 6, attempts: [{ id: 'm1', exam: 'vstep', day: 3, total: 35, correct: 20, skill: 'L' }] };
  const x = migrateX(v1);
  assert.equal(x.v, 2);
  assert.equal(x.exam, 'vstep');
  assert.equal(x.attempts.length, 1);
  assert.deepEqual(x.resp, []);
  assert.equal(x.share, false);
  // dưới 16 mà không có đồng ý của cha mẹ → không được chia sẻ dù on = true
  assert.equal(sanitizeX({ v: 2, consent: { on: true, adult: false, parent: false } }).share, false);
  assert.equal(sanitizeX({ v: 2, consent: { on: true, adult: false, parent: true } }).share, true);
  assert.equal(sanitizeX({ v: 2, consent: { on: true, adult: true } }).share, true);
});

function host(calls: Array<[string, unknown]>, reply: (fn: string) => unknown = () => true): Host {
  return {
    state: () => ({}), save: () => {}, render: () => {}, go: () => {}, today: () => 100, toast: () => {}, esc: s => String(s), ico: () => '',
    say: () => {}, flag: () => {}, learnerCefr: () => ({ L: null, S: null, R: null, W: null }), online: () => true,
    rpc: async (fn, body) => { calls.push([fn, body]); return reply(fn); },
  };
}

test('không đồng ý thì không gửi gì; đồng ý thì chỉ gửi id câu và đúng/sai', async () => {
  const calls: Array<[string, unknown]> = [];
  const x = freshX();
  await sendAttempt(host(calls), x, 'ielts-ac', 'set', { 'q-1': 1 });
  await sendPairs(host(calls), x, 'ielts-ac', [{ skill: 'R', est: 6, real: 6.5 }]);
  assert.equal(calls.length, 0);
  x.share = true;
  await sendAttempt(host(calls), x, 'ielts-ac', 'set', { 'q-1': 1, 'q-2': 0 });
  assert.deepEqual(calls[0], ['el_resp_post', { exam: 'ielts-ac', kind: 'set', items: { 'q-1': 1, 'q-2': 0 }, v: APP_V }]);
  assert.equal(x.sent, 1);
});

test('tải số liệu công khai: câu độ phân biệt kém và câu bị báo lỗi nhiều bị ẩn', async () => {
  const calls: Array<[string, unknown]> = [];
  const ok = await refresh(host(calls, fn => fn === 'el_item_stats'
    ? [{ item: 'good', n: 80, p: 0.6, rpb: 0.4 }, { item: 'bad', n: 80, p: 0.5, rpb: -0.1 }, { item: 'few', n: 20, p: 0.5, rpb: -0.3 }]
    : fn === 'el_flag_hot' ? [{ ref: 'flagged', n: 4 }] : []), true);
  assert.equal(ok, true);
  const h = hiddenItems();
  assert.deepEqual([...h].sort(), ['bad', 'flagged']);
});
