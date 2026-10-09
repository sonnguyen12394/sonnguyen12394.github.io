import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rank, W, HYST } from '../../src/engine/nba.ts';
import { gaps } from '../../src/engine/gap.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { ingest, freshEv, setPrior, misconceptions, errPattern } from '../../src/engine/ev/store.ts';
import { remedyFor } from '../../src/engine/remedy.ts';
import type { PathItem } from '../../src/engine/path.ts';
import type { Level } from '../../src/engine/types.ts';

// v59: Next Best Action (§56–57; C301–C320), phân loại lỗ hổng (§49; C141–C149), luật quay lại lộ trình (§58).

const item = (node: string, dep: number, minutes = 10): PathItem => ({ node, level: 3, minutes, dep, score: dep / minutes, goals: ['cefr-a1'] });
const none = { items: 0, mins: 0, risk: 0 };

test('NBA: utility có phân rã; ưu tiên nút mở đường cho nhiều năng lực; nỗ lực bị trừ', () => {
  const a = rank({ open: [item('u:small', 1), item('u:big', 8), item('u:long', 8, 60)], probe: null, review: none, verify: [] });
  assert.equal(a[0]!.node, 'u:big');
  assert.ok(a.find(x => x.node === 'u:long')!.u < a[0]!.u);
  const t = a[0]!.parts;
  assert.ok(Math.abs(a[0]!.u - (W.learn * t.learn + W.goal * t.goal + W.prereq * t.prereq - W.effort * t.effort)) < 1e-3);
});

test('NBA: ôn thắng học mới khi nhiều mục sắp quên (C315); kiểm tra nhanh truy gốc thắng khi người học kẹt (C316–C317)', () => {
  const open = [item('u:a', 3)];
  assert.equal(rank({ open, probe: null, review: { items: 30, mins: 8, risk: 1 }, verify: [] })[0]!.kind, 'review');
  assert.equal(rank({ open, probe: null, review: { items: 1, mins: 1, risk: 0.43 }, verify: [] })[0]!.kind, 'learn');
  const probe = { node: 'g:base', level: 3 as Level, mode: 'root' as const, eig: 0.3, effort: 1.5, score: 1, for: 'g:top' };
  assert.equal(rank({ open, probe, review: none, verify: [] })[0]!.kind, 'probe');
});

test('NBA ổn định (C318): chênh lệch nhỏ không làm đổi lựa chọn trước; chênh lớn thì đổi (C319); hoà điểm xác định (C312)', () => {
  const open = [item('u:a', 5), item('u:b', 5.2)];
  assert.equal(rank({ open, probe: null, review: none, verify: [] })[0]!.node, 'u:b');
  assert.equal(rank({ open, probe: null, review: none, verify: [], prev: { kind: 'learn', node: 'u:a' } })[0]!.node, 'u:a');
  const big = [item('u:a', 2), item('u:b', 9)];
  assert.equal(rank({ open: big, probe: null, review: none, verify: [], prev: { kind: 'learn', node: 'u:a' } })[0]!.node, 'u:b');
  assert.ok(HYST > 0 && HYST < 0.3);
  const tie = rank({ open: [item('u:z', 4), item('u:y', 4)], probe: null, review: none, verify: [] });
  assert.deepEqual(tie.map(x => x.node), ['u:y', 'u:z']);
});

let T = 0;
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, o: { node?: string; level: Level; ok: boolean; ctx?: string; rt?: number; item?: string }) =>
  ingest(st, m, { node: 'g:x', item: `i${++T}`, ...o }, { dev: 'd', ts: T, day: 1 });

test('Lỗ hổng: chưa biết / nhận ra nhưng chưa nhớ ra / nhớ nhưng chưa dùng được / thiếu tiền đề', () => {
  const st = freshEv(), m: MasteryStore = {};
  const g = (need: Level, blocked = false) => gaps({ m, ev: st, node: 'g:x', need, blocked });
  assert.deepEqual(g(3), ['unproven']);   // v70: chưa có câu trả lời nào = chưa chứng minh, không phải chưa biết
  put(st, m, { level: 1, ok: false });
  assert.deepEqual(g(3), ['knowledge']);
  for (let i = 0; i < 15; i++) put(st, m, { level: 2, ok: true });
  assert.deepEqual(g(3), ['recall']);
  for (let i = 0; i < 15; i++) put(st, m, { level: 3, ok: true });
  assert.deepEqual(g(4), ['skill']);
  assert.ok(g(4, true).includes('prerequisite'));
});

test('v70 (bot L02): lỗ hổng từ bằng chứng — thuộc câu mà câu mới sai → transfer; sai cùng một mẫu ở nhiều câu → đang hiểu sai', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 4; i++) put(st, m, { level: 3, ok: true, item: 'old' });           // câu quen: đúng
  put(st, m, { level: 3, ok: false }); put(st, m, { level: 3, ok: false });               // câu mới: sai
  assert.ok(gaps({ m, ev: st, node: 'g:x', need: 3, blocked: false }).includes('transfer'));
  assert.equal(remedyFor(gaps({ m, ev: st, node: 'g:x', need: 3, blocked: false }), 3).act, 'transfer');
  const s2 = freshEv(), m2: MasteryStore = {};
  const bad = (given: string, right: string) => ingest(s2, m2, { node: 'g:h', level: 3, ok: false, item: `i${++T}`, given, right }, { dev: 'd', ts: T, day: 1 });
  bad('She work every day', 'She works every day'); bad('He play football', 'He plays football');   // cùng mẫu bỏ -s, chữ khác nhau
  const k = gaps({ m: m2, ev: s2, node: 'g:h', need: 3, blocked: false });
  assert.equal(k[0], 'misconception');
  assert.equal(remedyFor(k, 3).act, 'contrast');
  assert.ok(misconceptions(s2, 'g:h').some(x => /work|play/.test(x.t)));
});

test('v70: mẫu lỗi — chỉ lỗi có hình thái (đuôi từ, từ chức năng, thừa/thiếu từ ngắn), không phải gõ bừa', () => {
  assert.equal(errPattern('She work', 'She works')!.sig, errPattern('He play', 'He plays')!.sig);
  assert.equal(errPattern('They is here', 'They are here')!.sig, errPattern('We is ok', 'We are ok')!.sig);
  // "did + quá khứ" với động từ bất quy tắc: mỗi câu một cặp từ (go>went, eat>ate) → chưa gộp được thành một mẫu (cần từ điển dạng
  // quá khứ); với động từ có quy tắc thì gộp được (play>played…).
  assert.notEqual(errPattern('Did you went', 'Did you go')!.sig, errPattern('Did she ate', 'Did she eat')!.sig);
  assert.equal(errPattern('Did you played', 'Did you play')!.sig, errPattern('Did he worked', 'Did he work')!.sig);
  assert.ok(errPattern('Did she goes', 'Did she go'));
  assert.equal(errPattern('xyzzy qwerty', 'She works every day'), null);
  assert.equal(errPattern('', 'She works'), null);
  assert.equal(errPattern('He does not likes it', 'He does not like it')!.vi, 'likes (thay vì like)');
});

test('Lỗ hổng: đang quên (FSRS < 0,85), yếu ở một ngữ cảnh, đúng nhưng chậm, chưa dùng được ở câu mới', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 20; i++) put(st, m, { level: 3, ok: true, ctx: 'rcl', rt: 20000 });
  for (let i = 0; i < 4; i++) put(st, m, { level: 3, ok: i === 0, ctx: 'spl', item: 'old' });
  const k = gaps({ m, ev: st, node: 'g:x', need: 3, blocked: false, recall: 0.6 });
  assert.ok(stat(m['g:x']![3]).pass || k.includes('transfer'));
  if (stat(m['g:x']![3]).pass) for (const want of ['retention', 'context', 'automaticity']) assert.ok(k.includes(want as never), `${want} ∉ ${k}`);
  const s2 = freshEv(), m2: MasteryStore = {};
  for (let i = 0; i < 25; i++) put(s2, m2, { level: 3, ok: true });
  put(s2, m2, { level: 3, ok: false }); put(s2, m2, { level: 3, ok: false });
  assert.ok(gaps({ m: m2, ev: s2, node: 'g:x', need: 3, blocked: false }).includes('transfer'));
});

test('§58: đang Đạt mà sai 2 lần LIÊN TIẾP (kể cả câu đã gặp khi ôn) → quay lại lộ trình; sai xen kẽ đúng thì không', () => {
  const st = freshEv(), m: MasteryStore = {};
  for (let i = 0; i < 25; i++) put(st, m, { level: 3, ok: true, item: i < 3 ? `p${i}` : 'same' });
  put(st, m, { level: 3, ok: false, item: 'same' }); put(st, m, { level: 3, ok: true, item: 'same' }); put(st, m, { level: 3, ok: false, item: 'same' });
  assert.equal(stat(m['g:x']![3]).state, 'mastered');
  put(st, m, { level: 3, ok: false, item: 'same' });
  assert.equal(stat(m['g:x']![3]).pass, false);
  const s3 = freshEv(), m3: MasteryStore = {};
  setPrior(s3, m3, 'g:x', 3, 6, 0.5, 'diag', 1);
  assert.equal(stat(m3['g:x']![3]).state, 'inferred');
});
