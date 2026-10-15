import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// v134 Ý cần có của đề Viết (app.js WTASKS.pts, writeChecks): máy dò từ khoá từng ý. Luật chỉ có ích khi không báo thiếu nhầm
// ở bài đúng và có báo thiếu ở bài bỏ ý; kiểm bằng bài mẫu (tốt, mức đạt, mức chưa đạt) của chính đề.
const src = readFileSync('app.js', 'utf8');
const a = src.indexOf('/*<WTASKS>*/const WTASKS = ['), b = src.indexOf('];/*</WTASKS>*/');
type T = { id: string; lv: string; min: number; m: string[]; pts?: Array<[string, string]>; lm?: Array<[string, string, string]> };
const W = (0, eval)(src.slice(a + '/*<WTASKS>*/const WTASKS = '.length, b + 1)) as T[];
const miss = (t: T, x: string) => (t.pts ?? []).filter(([, re]) => !new RegExp(re, 'i').test(x)).map(([v]) => v);

test('v134 Viết: mọi đề A1 / A2 có ý cần có; mẫu tìm biên dịch được', () => {
  for (const t of W.filter(t => t.lv === 'A1' || t.lv === 'A2')) {
    assert.ok(t.pts && t.pts.length >= 2, `${t.id}: thiếu pts`);
    for (const [, re] of t.pts) assert.doesNotThrow(() => new RegExp(re, 'i'));
  }
  assert.ok(W.find(t => t.id === 'a2-w9') && W.find(t => t.id === 'a2-w10'), 'có 2 đề dạng A2 Key');
});

test('v134 Viết: bài mẫu tốt và mức đạt đủ ý; mức chưa đạt bị báo thiếu', () => {
  for (const t of W.filter(t => t.pts)) {
    assert.deepEqual(miss(t, t.m.join(' ')), [], `${t.id}: bài mẫu bị báo thiếu ý`);
    for (const [lv, x] of t.lm ?? []) {
      if (lv === 'đạt') assert.deepEqual(miss(t, x), [], `${t.id}: mức đạt bị báo thiếu ý`);
      if (lv === 'chưa đạt') assert.ok(miss(t, x).length > 0, `${t.id}: mức chưa đạt không bị báo thiếu`);
    }
  }
  for (const t of W.filter(t => t.lv === 'A2')) assert.ok(t.lm?.length === 2, `${t.id}: cần bài mẫu mức chưa đạt + đạt`);
});

test('v134 Viết: luật phân biệt được đề, không phải câu nào cũng qua (bài trống, bài lạc đề)', () => {
  for (const t of W.filter(t => t.pts)) assert.ok(miss(t, '').length === t.pts!.length, t.id);
  const film = W.find(t => t.id === 'a2-w9')!;
  assert.ok(miss(film, 'Hi Alex, I like football. My brother is a doctor. Bye!').length >= 2, 'bài lạc đề phải thiếu ý');
});
