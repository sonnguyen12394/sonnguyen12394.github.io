import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ingest, freshEv } from '../../src/engine/ev/store.ts';
import { evRecall, evCard } from '../../src/engine/retain.ts';
import type { MasteryStore } from '../../src/engine/mastery.ts';

// v69 (bot L01): người chỉ chơi tháp không có thẻ FSRS → khả năng nhớ dựng lại từ sổ bằng chứng, để rương ôn xuất hiện đúng lúc.

let T = 0;
const put = (st: ReturnType<typeof freshEv>, m: MasteryStore, ok: boolean, day: number, hint = false) =>
  ingest(st, m, { node: 'g:x', level: 3, ok, item: `i${++T}`, ...(hint ? { hint: true } : {}) }, { dev: 'd', ts: ++T, day });

test('khả năng nhớ từ sổ: chưa có gì → null; vừa học → cao; lâu không gặp → thấp (C307, L01-45, L01-57)', () => {
  const st = freshEv(), m: MasteryStore = {};
  assert.equal(evRecall(st, 'g:x', 10), null);
  put(st, m, true, 1); put(st, m, true, 1); put(st, m, true, 3); put(st, m, true, 7);
  const r8 = evRecall(st, 'g:x', 8)!, r90 = evRecall(st, 'g:x', 90)!;
  assert.ok(r8 > 0.9, `vừa ôn: ${r8}`);
  assert.ok(r90 < 0.9, `lâu không gặp: ${r90}`);
  assert.equal(evCard(st, 'g:x')!.reps >= 3, true, 'mỗi ngày tính một lần ôn');
});

test('sai làm độ bền giảm: cùng lịch nhưng một ngày sai thì nhớ kém hơn', () => {
  const a = freshEv(), b = freshEv(), ma: MasteryStore = {}, mb: MasteryStore = {};
  for (const [d, okB] of [[1, true], [3, false], [7, true]] as const) { put(a, ma, true, d); put(b, mb, okB, d); }
  assert.ok(evRecall(a, 'g:x', 30)! > evRecall(b, 'g:x', 30)!);
});
