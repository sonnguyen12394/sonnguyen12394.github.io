import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickToday, itemFor, grow, sanitizeGarden, mergeGarden, PER_DAY } from '../../src/engine/garden.ts';
import type { GWord } from '../../src/engine/host.ts';

const w: GWord = { id: 'apple', en: 'apple', vi: 'quả táo', pos: 'noun', pic: '🍎', ipa: '/ˈæp.əl/', ex: 'I eat an apple.', exVi: 'Tôi ăn táo.' };
const pool = [{ en: 'chair', vi: 'cái ghế' }, { en: 'book', vi: 'sách' }, { en: 'dog', vi: 'con chó' }, { en: 'apple', vi: 'quả táo' }];

test('v87 Vườn từ: câu đúng bậc (nhận ra mức 1 → nhớ ngược mức 2 → tự gõ mức 3), mã câu như câu dò của tháp', () => {
  const a = itemFor(w, 1, pool, 1), b = itemFor(w, 2, pool, 1), c = itemFor(w, 3, pool, 1);
  assert.equal(a.level, 1); assert.equal(a.id, 'w:apple:vi'); assert.equal(a.opts![a.ans!], 'quả táo'); assert.equal(a.opts!.length, 4); assert.equal(a.g, 0.25);
  assert.equal(new Set(a.opts).size, 4, 'không trùng phương án (kho có chính từ đích)');
  assert.equal(b.level, 2); assert.equal(b.id, 'w:apple:word'); assert.equal(b.opts![b.ans!], 'apple');
  assert.equal(c.level, 3); assert.equal(c.g, 0); assert.deepEqual(c.accept, ['apple']); assert.equal(c.id, 'w:apple:typ');
});

test('v87 Vườn từ: đúng lên một bậc (tối đa hoa), sai giữ bậc; mỗi cây lên tối đa một bậc / ngày; cây đang lớn trước từ mới', () => {
  let p = grow(undefined, 'u:a1-u1', true, 10);
  assert.deepEqual(p, { n: 'u:a1-u1', s: 1, d: 10 });
  p = grow(p, 'u:a1-u1', false, 11); assert.equal(p.s, 1);
  p = grow(grow(grow(p, 'u:a1-u1', true, 12), 'u:a1-u1', true, 13), 'u:a1-u1', true, 14); assert.equal(p.s, 3);
  const plants = { a: { n: 'u:x', s: 1, d: 9 }, b: { n: 'u:x', s: 2, d: 10 }, c: { n: 'u:x', s: 3, d: 5 } };
  const t = pickToday(plants, [{ id: 'd', n: 'u:y' }, { id: 'a', n: 'u:x' }], 10);
  assert.deepEqual(t.map(x => x.id), ['a', 'd']);   // b đã lên bậc hôm nay, c đã nở; a không bị gieo lại
  const many = Array.from({ length: 10 }, (_, i) => ({ id: `w${i}`, n: 'u:z' }));
  assert.equal(pickToday({}, many, 1).length, PER_DAY);
});

test('v87 Vườn từ: bản lưu — sanitize bỏ mục hỏng, gộp hai máy lấy bậc cao hơn của từng cây', () => {
  const s = sanitizeGarden({ runs: 2, plants: { apple: { n: 'u:a1-u1', s: 9, d: 3 }, bad: { n: 'g:x', s: 1 }, '<x>': { n: 'u:a', s: 1 } } })!;
  assert.deepEqual(s.plants, { apple: { n: 'u:a1-u1', s: 3, d: 3 } });
  const m = mergeGarden({ runs: 1, blooms: 0, day: 1, plants: { a: { n: 'u:x', s: 1, d: 1 } } }, { runs: 2, blooms: 1, day: 2, plants: { a: { n: 'u:x', s: 2, d: 2 }, b: { n: 'u:x', s: 0, d: 0 } } })!;
  assert.equal(m.plants.a!.s, 2); assert.ok(m.plants.b); assert.equal(m.runs, 2);
});
