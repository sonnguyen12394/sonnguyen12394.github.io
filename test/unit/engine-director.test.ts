import { test } from 'node:test';
import assert from 'node:assert/strict';
import { direct, planDay, nextGame, sanitizeDir, mergeDir, GAMES, type DirIn } from '../../src/engine/director.ts';

const base = (x: Partial<DirIn> = {}): DirIn => ({
  placed: true, fogWait: 3, claims: 0, top: { kind: 'learn', node: 'u:a1-01', vi: 'Chào hỏi' }, review: 0, first: { u: 'Chào hỏi' }, neck: null,
  gWrong: false, fnSeen: false, cd: {}, lv: 'A1', garden: 0, puzzleToday: false, played: [], last: '', tts: true, asr: true, ...x,
});

test('v88 bộ não: chưa xếp lớp → Thám hiểm đứng đầu; đã xếp lớp và đang chờ 7 ngày → không chọn Thám hiểm', () => {
  assert.equal(direct(base({ placed: false }))[0]!.game, 'fog');
  assert.ok(!direct(base({ claims: 9 })).some(p => p.game === 'fog'));
  assert.equal(direct(base({ fogWait: 0, claims: 9, top: null, first: {} }))[0]!.game, 'fog', 'nhiều phần tạm Đạt + hết hạn chờ → xếp lớp lại');
});

test('v88 bộ não: cây đến ngày tưới → Vườn từ; nhiều phần sắp quên → Vòng Chữ / Mỏ Chữ (game chủ lực) / Câu đố ngày', () => {
  const g = direct(base({ garden: 4 }))[0]!;
  assert.equal(g.game, 'garden'); assert.equal(g.need, 'water'); assert.match(g.why, /4 từ đến ngày tưới/);
  const r = direct(base({ review: 8, top: { kind: 'review', node: 'review', vi: 'ôn' } }));
  assert.equal(r[0]!.game, 'wheel'); assert.equal(r[1]!.game, 'hunt'); assert.equal(r[2]!.game, 'puzzle'); assert.match(r[0]!.why, /8 phần/);
  // v96: vừa chơi Vòng Chữ → game chủ lực kia (Mỏ Chữ) lên đầu (xen kẽ dạng game, cùng nhu cầu ôn).
  assert.equal(direct(base({ review: 8, top: { kind: 'review', node: 'review', vi: 'ôn' }, last: 'wheel', played: ['wheel'] }))[0]!.game, 'hunt');
  assert.ok(!direct(base({ review: 8, puzzleToday: true })).some(p => p.game === 'puzzle'), 'câu đố mỗi ngày một lần');
  assert.notEqual(direct(base({ review: 6 }))[0]!.game, 'wheel', 'ít phần sắp quên → không ôn trước học mới (người học khá)');
});

test('v88 bộ não: điểm nghẽn đứng trên bước học mới (người chơi ít game / ngày vẫn tới lượt)', () => {
  const x = base({ top: { kind: 'learn', node: 'g:be', vi: 'be' }, first: { g: 'be' }, neck: { node: 'ph:s-01', vi: 'ship/sheep' } });
  assert.equal(direct(x)[0]!.game, 'bubbles');
  assert.ok(planDay(x).some(p => p.game === 'bubbles'));
});

test('v88 bộ não: mảng nền 7 ngày qua gần như không luyện được đưa vào lộ trình; người đang đúng nhiều ôn ít hơn', () => {
  const x = base({ top: { kind: 'learn', node: 'g:be', vi: 'be' }, first: { u: 'Chào', g: 'be', ph: 'ship/sheep' }, review: 9, recent: { u: 40, g: 40, fn: 0, ph: 1 } });
  assert.ok(planDay(x).some(p => p.game === 'bubbles'), 'âm chưa luyện → có chặng Bắt Âm');
  assert.ok(!planDay({ ...x, recent: { u: 40, g: 40, ph: 30 } }).some(p => p.game === 'bubbles'));
  assert.equal(direct(x)[0]!.game, 'wheel');
  assert.notEqual(direct({ ...x, acc: 0.9 })[0]!.game, 'wheel');
});

test('v88 bộ não: loại nút đầu lộ trình quyết định dạng game (ngữ pháp / giao tiếp / âm)', () => {
  assert.equal(direct(base({ top: { kind: 'learn', node: 'g:be', vi: 'be' }, first: {} }))[0]!.game, 'cards');
  assert.equal(direct(base({ top: { kind: 'learn', node: 'g:be', vi: 'be' }, first: {}, gWrong: true }))[0]!.game, 'shop', 'đang sai nhiều → sửa câu sai');
  assert.equal(direct(base({ top: { kind: 'learn', node: 'fn:greet', vi: 'chào' }, first: {} }))[0]!.game, 'cafe');
  assert.equal(direct(base({ top: { kind: 'learn', node: 'fn:greet', vi: 'chào' }, first: {}, fnSeen: true }))[0]!.game, 'kara', 'đã luyện hiểu → nói');
  assert.equal(direct(base({ top: { kind: 'learn', node: 'fn:greet', vi: 'chào' }, first: {}, fnSeen: true, asr: false }))[0]!.game, 'cafe', 'không có máy nghe → không đẩy sang nói');
  assert.equal(direct(base({ top: { kind: 'learn', node: 'ph:s-01', vi: 'ship/sheep' }, first: {} }))[0]!.game, 'bubbles');
  assert.equal(direct(base({ top: { kind: 'verify', node: 'u:a1-01', vi: 'Chào hỏi' } }))[0]!.game, 'tower');
});

test('v88 bộ não: Can-Do còn thiếu → game kỹ năng; không giọng đọc thì không chọn Đài', () => {
  const x = base({ top: null, first: {}, cd: { L: { vi: 'nghe số', gap: 1 }, R: { vi: 'đọc biển báo', gap: 0.2 } } });
  assert.equal(direct(x)[0]!.game, 'radio');
  assert.equal(direct({ ...x, tts: false })[0]!.game, 'case');
  assert.ok(!direct({ ...x, tts: false }).some(p => p.game === 'radio'));
});

test('v88 bộ não: đổi dạng — game vừa chơi không đứng đầu, game đã chơi hôm nay bị đẩy xuống', () => {
  const x = base({ garden: 3, review: 8 });
  assert.equal(direct(x)[0]!.game, 'garden');
  assert.notEqual(direct({ ...x, last: 'garden', played: ['garden'] })[0]!.game, 'garden');
  for (const p of direct(x)) assert.ok(GAMES[p.game], 'mọi game có nút bắt đầu');
});

test('v88 lộ trình hôm nay: 3 chặng, mỗi chặng một nhu cầu, ôn trước học mới; chơi tiếp = chặng chưa xong', () => {
  const x = base({ garden: 3, review: 8, top: { kind: 'learn', node: 'g:be', vi: 'be' }, first: { u: 'Chào', g: 'be' }, cd: { R: { vi: 'đọc', gap: 0.5 } } });
  const plan = planDay(x);
  assert.equal(plan.length, 3);
  assert.equal(new Set(plan.map(p => p.need)).size, 3);
  assert.deepEqual(plan.map(p => p.game), ['garden', 'wheel', 'cards']);
  assert.equal(nextGame(x, plan).pick.game, 'garden');
  const after = { ...x, played: ['garden'], last: 'garden', garden: 0 };
  assert.equal(nextGame(after, plan).pick.game, 'wheel');
  const all = { ...x, played: ['garden', 'wheel', 'cards'], last: 'cards', garden: 0 };
  const n = nextGame(all, plan);
  assert.equal(n.inPlan, false); assert.ok(!['cards'].includes(n.pick.game));
});

test('v88 lộ trình hôm nay: người mới (mọi Can-Do còn thiếu) → tối đa một chặng kỹ năng, còn lại là nền (ngữ pháp, từ)', () => {
  const x = base({ top: { kind: 'learn', node: 'g:be', vi: 'be' }, first: { u: 'Chào', g: 'be' }, cd: { R: { vi: 'đọc', gap: 1 }, W: { vi: 'viết', gap: 1 }, S: { vi: 'nói', gap: 1 } } });
  const plan = planDay(x), skills = plan.filter(p => ['read', 'listen', 'write', 'speak'].includes(p.need));
  assert.equal(plan.length, 3); assert.equal(skills.length, 1);
  assert.ok(plan.some(p => p.game === 'garden'), 'có chặng từ mới');
});

test('v88 lưu bộ não: làm sạch (game lạ bị bỏ) và gộp hai máy', () => {
  const s = sanitizeDir({ day: 10, plan: [{ game: 'garden', need: 'water', why: 'x' }, { game: 'hack', need: 'water' }], done: ['garden', 'evil', 'garden'], last: 'nope', runs: 3 })!;
  assert.deepEqual(s.plan.map(p => p.game), ['garden']); assert.deepEqual(s.done, ['garden']); assert.equal(s.last, '');
  const m = mergeDir({ day: 10, plan: [], done: ['garden'], last: 'garden', runs: 2 }, { day: 10, plan: [], done: ['blocks'], last: '', runs: 5 })!;
  assert.deepEqual(m.done.sort(), ['blocks', 'garden']); assert.equal(m.runs, 5);
  assert.equal(mergeDir({ day: 9, plan: [], done: ['a'], last: '', runs: 1 }, { day: 10, plan: [], done: [], last: 'cards', runs: 1 })!.day, 10);
});

test('v96 bộ não: lộ trình ngày (xếp không có lịch sử trong ngày) vẫn xen kẽ hai game chủ lực theo game chơi gần nhất', () => {
  const rv = { review: 8, top: { kind: 'review', node: 'review', vi: 'ôn' } } as const;
  const slot = (flag: DirIn['flag']) => planDay(base({ ...rv, flag })).find(p => p.need === 'review')!.game;
  assert.equal(slot(''), 'wheel', 'chưa chơi game chủ lực nào: Vòng Chữ (dễ vào nhất) trước');
  assert.equal(slot('wheel'), 'hunt'); assert.equal(slot('hunt'), 'wheel');
  const light = (flag: DirIn['flag']) => direct(base({ review: 2, flag, top: { kind: 'learn', node: 'g:a1-01', vi: 'be' } })).filter(p => p.need === 'review').map(p => p.game);
  assert.deepEqual(light('wheel').slice(0, 2), ['hunt', 'wheel'], 'ôn nhẹ cũng có cả hai game');
});
