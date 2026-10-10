import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canForm, curve, buildLevel, dailyLevel, judge, nextHint, evidenceOf, stars, sanitizeWheel, mergeWheel, freshWheelSave, shareText, type Lex } from '../../src/engine/wordwheel.ts';
import { readFileSync } from 'node:fs';

// Kho từ thật của app (content/wordlist.json: từ → cấp), nghĩa giả để test.
const WL = JSON.parse(readFileSync('content/wordlist.json', 'utf8')) as Record<string, string>;
const LEX: Lex[] = Object.entries(WL).map(([en, lv], i) => ({ en, vi: `nghĩa ${en}`, lv, node: `u:x${i % 50}`, id: en }));

test('v93 Vòng Chữ: ghép được từ = đủ chữ (tính cả số lần lặp)', () => {
  assert.equal(canForm('tea', 'eat'), true);
  assert.equal(canForm('see', 'sea'), false, 'thiếu một chữ e');
  assert.equal(canForm('seen', 'sneer'), true);
});

test('v93 Vòng Chữ: đường cong độ khó tăng theo màn, có màn nghỉ mỗi 5 màn', () => {
  assert.deepEqual(curve(1), { len: 5, slots: 3 });
  assert.ok(curve(30).len >= curve(10).len && curve(30).slots >= curve(10).slots);
  assert.ok(curve(10).slots < curve(9).slots || curve(10).len < curve(9).len, 'màn 10 là màn nghỉ');
  assert.ok(curve(200).slots <= 7 && curve(200).len <= 7);
});

test('v93 Vòng Chữ: dựng màn từ cụm engine chọn — từ gốc thuộc cụm, mọi ô ghép được từ bộ chữ, ô của cụm đánh dấu target', () => {
  const targets = LEX.filter(x => ['garden', 'danger', 'read', 'dear', 'range'].includes(x.en)).map(x => ({ ...x, node: 'u:t1' }));
  const lv = buildLevel(7, targets, LEX, 'A2', { len: 6, slots: 6 })!;
  assert.ok(lv, 'dựng được màn');
  assert.equal(lv.letters.length, lv.base.length);
  assert.ok(['garden', 'danger'].includes(lv.base));
  for (const s of lv.slots) assert.ok(canForm(s.en, lv.base), `${s.en} ghép từ ${lv.base}`);
  assert.ok(lv.slots.filter(s => s.target).every(s => s.node === 'u:t1'));
  assert.ok(lv.slots.some(s => s.target && s.en === lv.base));
  assert.ok(lv.slots.length <= 6 && lv.slots.length >= 3);
  assert.ok(lv.bonus.every(w => !lv.slots.some(s => s.en === w)));
  assert.equal(new Set(lv.slots.map(s => s.en)).size, lv.slots.length, 'không trùng ô');
  assert.deepEqual(buildLevel(7, targets, LEX, 'A2', { len: 6, slots: 6 }), lv, 'cùng seed → cùng màn');
});

test('v93 Vòng Chữ: thử thách ngày giống nhau cho mọi người, đủ ô', () => {
  const a = dailyLevel(20371, LEX)!, b = dailyLevel(20371, LEX)!;
  assert.deepEqual(a, b); assert.ok(a.slots.length >= 5); assert.equal(a.base.length, 6);
  for (let d = 20000; d < 20030; d++) assert.ok(dailyLevel(d, LEX), `ngày ${d} có màn`);
});

test('v93 Vòng Chữ: chấm từ, gợi ý, bằng chứng, sao', () => {
  const lv = { letters: ['t', 'e', 'a'], base: 'eat', slots: [{ en: 'eat', vi: 'ăn', node: 'u:a', id: 'eat', target: true }, { en: 'tea', vi: 'trà', node: 'u:b', id: 'tea', target: false }], bonus: ['ate'] };
  assert.equal(judge(lv, new Set(), 'EAT'), 'slot');
  assert.equal(judge(lv, new Set(['eat']), 'eat'), 'dup');
  assert.equal(judge(lv, new Set(), 'ate'), 'bonus');
  assert.equal(judge(lv, new Set(), 'ta'), 'short');
  assert.equal(judge(lv, new Set(), 'tae'), 'no');
  assert.deepEqual(nextHint(lv, new Set(), {}), [0, 0]);
  assert.deepEqual(nextHint(lv, new Set(['eat']), { tea: [0] }), [1, 1]);
  assert.equal(nextHint(lv, new Set(['eat', 'tea']), {}), null);
  assert.deepEqual(evidenceOf(lv.slots[0]!, 0), { ok: true, hint: false });
  assert.deepEqual(evidenceOf(lv.slots[0]!, 1), { ok: true, hint: true });
  assert.deepEqual(evidenceOf(lv.slots[0]!, 2), { ok: false, hint: true }, 'mở ≥ nửa chữ thì không tính là nhớ ra');
  assert.equal(evidenceOf(lv.slots[1]!, 0), null, 'từ kho ngoài cụm engine chọn: không ghi bằng chứng');
  assert.deepEqual([stars(0), stars(2), stars(5)], [3, 2, 1]);
  assert.ok(!shareText(20371, 5, 6, 1, 125).includes('eat'), 'chia sẻ không lộ đáp án');
});

test('v93 Vòng Chữ: lưu / gộp an toàn', () => {
  assert.equal(sanitizeWheel(null), undefined);
  assert.equal(sanitizeWheel({ lv: -4 })!.lv, 1);
  const a = { ...freshWheelSave(), lv: 5, daily: { day: 3, done: true, secs: 90, hints: 0 } }, b = { ...freshWheelSave(), lv: 9, daily: { day: 3, done: false, secs: 0, hints: 0 } };
  assert.equal(mergeWheel(a, b)!.lv, 9); assert.equal(mergeWheel(a, b)!.daily.done, true);
});
