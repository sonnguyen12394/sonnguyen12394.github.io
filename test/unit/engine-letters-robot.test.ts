import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pickTask, verdict, folk, FOLKS, sanitizeLetter, mergeLetter } from '../../src/engine/letters.ts';
import { layout, parse, run, won, sameWord, N, sanitizeRobot, mergeRobot } from '../../src/engine/robot.ts';
import type { WTask } from '../../src/engine/host.ts';

const wt = (id: string, text = '', done = false): WTask => ({ id, lv: 'A1', genre: 'tin nhắn', en: id, vi: id, p: 'Write.', pv: 'Viết.', min: 25, max: 50, par: 1, c: ['a', 'b'], u: [['Hi', 'Chào']], m: ['Hi!'], text, done });

test('v83 Thư: chọn đề chưa viết, rồi chưa đạt; hồi âm đạt đúng điều kiện màn Viết theo đề', () => {
  assert.equal(pickTask([wt('done', 'x', true), wt('draft', 'x', false), wt('new')], 1)!.id, 'new');
  assert.equal(pickTask([wt('done', 'x', true), wt('draft', 'x', false)], 1)!.id, 'draft');
  assert.equal(pickTask([wt('a'), wt('b')], 1, 'a')!.id, 'b');
  const ok: Array<[boolean, string]> = [[true, 'len'], [true, 'par'], [true, 'link'], [false, 'phr'], [true, 'rep']];
  assert.equal(verdict(ok, [true, true]).ok, true);                       // thiếu 1 mục phụ vẫn đạt
  assert.equal(verdict(ok, [true, false]).ok, false);                      // thiếu ý của đề
  assert.equal(verdict([[false, 'len'], ...ok.slice(1)], [true, true]).ok, false);   // độ dài là bắt buộc
  assert.equal(verdict([[true, 'l'], [true, 'p'], [false, 'a'], [false, 'b']], [true]).fix.length, 2);
  assert.ok(FOLKS.some(f => f[1] === folk(5)[1]));
  assert.deepEqual(sanitizeLetter({ runs: 2.2, gifts: -1 }), { runs: 2, sent: 0, gifts: 0, day: 0 });
  assert.deepEqual(mergeLetter({ runs: 1, sent: 5, gifts: 2, day: 9 }, { runs: 3, sent: 1, gifts: 4, day: 2 }), { runs: 3, sent: 5, gifts: 4, day: 9 });
});

test('v84 Robot: phân tích lệnh nói / gõ (nhiều lệnh, số bước, nhặt, về Nhà)', () => {
  assert.deepEqual(parse('Go right two steps, then pick up the apple'), [{ k: 'move', dr: 0, dc: 1, n: 2 }, { k: 'pick', w: 'apple' }]);
  assert.deepEqual(parse('down'), [{ k: 'move', dr: 1, dc: 0, n: 1 }]);
  assert.deepEqual(parse('take a chair and go home'), [{ k: 'pick', w: 'chair' }, { k: 'home' }]);
  assert.equal(parse('hello robot')[0]!.k, 'bad');
  assert.equal(parse('').length, 0);
  assert.ok(sameWord('apples', 'apple')); assert.ok(sameWord('Cherries', 'cherry')); assert.ok(!sameWord('apple', 'ample'));
});

test('v84 Robot: đi, đụng tường dừng ở mép, nhặt chỉ khi gọi đúng tên, thắng khi nhặt đủ và về Nhà', () => {
  const b = layout(3, [{ en: 'apple', vi: 'táo', pic: '🍎' }, { en: 'chair', vi: 'ghế', pic: '🪑' }, { en: 'book', vi: 'sách', pic: '📕' }]);
  assert.equal(b.items.length, 3); assert.ok(b.items.every(i => i.r + i.c >= 2 && i.r < N && i.c < N));
  assert.equal(new Set(b.items.map(i => `${i.r},${i.c}`)).size, 3);
  const wall = run(b, parse('go up'));
  assert.equal(wall.b.r, 0); assert.equal(wall.log[0]!.ok, false);
  let cur = b;
  for (const it of b.items.filter(i => i.target)) {
    const dr = it.r - cur.r, dc = it.c - cur.c, cmds: string[] = [];
    if (dr) cmds.push(`go ${dr > 0 ? 'down' : 'up'} ${Math.abs(dr)} steps`.replace(/ (\d) /, (_, n) => ` ${['', 'one', 'two', 'three', 'four'][+n]} `));
    if (dc) cmds.push(`go ${dc > 0 ? 'right' : 'left'} ${['', 'one', 'two', 'three', 'four'][Math.abs(dc)]} steps`);
    const wrong = run(cur, parse(cmds.join(' then ') + ' then pick up the banana'));
    assert.equal(wrong.misnamed.length, 1); assert.match(wrong.log.at(-1)!.msg, /bắt đầu bằng/);
    cur = run(wrong.b, parse(`pick up the ${it.en}`)).b;
    assert.ok(cur.items.find(i => i.en === it.en)!.got);
  }
  assert.equal(won(cur), false);
  assert.equal(won(run(cur, parse('go home')).b), true);
  assert.deepEqual(sanitizeRobot({ wins: 1.6 }), { runs: 0, wins: 2, picked: 0, best: 0, day: 0 });
  assert.equal(mergeRobot({ runs: 1, wins: 1, picked: 2, best: 5, day: 1 }, { runs: 2, wins: 1, picked: 1, best: 3, day: 2 })!.best, 3);
});
