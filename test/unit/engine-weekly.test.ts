import { test } from 'node:test';
import assert from 'node:assert/strict';
import { wkAdd, weekOf, themeOf, daysLeft, freshWeek, sanitizeWeek, mergeWeek, viewWeekly, THEMES } from '../../src/engine/weekly.ts';

// v98 sự kiện tuần (M10): chủ đề xoay theo tuần (thứ Hai), 3 mốc, huy hiệu ở mốc cuối; sang tuần mới xoá tiến độ, giữ huy hiệu.
const dayOfTheme = (kind: string) => { for (let d = 20000; ; d++) if (themeOf(weekOf(d)).kind === kind && (d + 3) % 7 === 0) return d; };

test('v98 tuần bắt đầu thứ Hai; 4 chủ đề xoay vòng; còn bao nhiêu ngày', () => {
  const mon = dayOfTheme('word');
  assert.equal(weekOf(mon), weekOf(mon + 6)); assert.notEqual(weekOf(mon), weekOf(mon + 7));
  assert.equal(daysLeft(mon), 7); assert.equal(daysLeft(mon + 6), 1);
  assert.equal(new Set([0, 1, 2, 3].map(k => themeOf(weekOf(mon) + k).id)).size, THEMES.length);
});

test('v98 mốc 1/3, 2/3, đủ → huy hiệu; chỉ đúng loại của chủ đề mới cộng; sang tuần mới xoá tiến độ, giữ huy hiệu', () => {
  const d = dayOfTheme('word'), s = freshWeek(weekOf(d)), goal = themeOf(weekOf(d)).goal;
  assert.deepEqual(wkAdd(s, d, 'sentence', 50, 'cards'), [], 'không đúng chủ đề');
  assert.deepEqual(wkAdd(s, d, 'word', Math.ceil(goal / 3), 'wheel'), [0]);
  assert.deepEqual(wkAdd(s, d, 'word', goal, 'hunt'), [1, 2]);
  assert.equal(s.badges.length, 1);
  assert.deepEqual(wkAdd(s, d, 'word', 5, 'hunt'), [], 'đã đủ thì không thưởng lại');
  wkAdd(s, d + 7, 'word', 1, 'hunt');
  assert.equal(s.prog, 0); assert.equal(s.tiers, 0); assert.equal(s.badges.length, 1);
});

test('v98 tuần hội chợ: mốc cuối cần đủ ba game chủ lực', () => {
  const d = dayOfTheme('play'), s = freshWeek(weekOf(d)), goal = themeOf(weekOf(d)).goal;
  assert.deepEqual(wkAdd(s, d, 'play', goal, 'wheel'), [0, 1]);
  wkAdd(s, d, 'play', 1, 'hunt');
  assert.deepEqual(wkAdd(s, d, 'play', 1, 'cards'), [2]);
});

test('v98 lưu: sanitize chặn dữ liệu hỏng; gộp hai máy giữ tiến độ tuần mới hơn và mọi huy hiệu; thẻ sảnh có thanh tiến độ', () => {
  assert.equal(sanitizeWeek('x'), undefined);
  assert.deepEqual(sanitizeWeek({ week: -3, prog: 'a', tiers: 99, games: [1, 'wheel'], badges: ['1:tho-mo'] }), { week: 0, prog: 0, tiers: 3, games: ['wheel'], badges: ['1:tho-mo'] });
  const m = mergeWeek({ week: 5, prog: 9, tiers: 1, games: ['wheel'], badges: ['1:a'] }, { week: 4, prog: 50, tiers: 3, games: ['hunt'], badges: ['4:b'] })!;
  assert.equal(m.week, 5); assert.equal(m.prog, 9); assert.deepEqual(m.games, ['wheel']); assert.deepEqual(m.badges, ['1:a', '4:b']);
  const html = viewWeekly(undefined, dayOfTheme('star'));
  assert.match(html, /role="progressbar"/); assert.match(html, /Tuần ngôi sao/);
});
