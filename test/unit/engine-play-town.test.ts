import { test } from 'node:test';
import assert from 'node:assert/strict';
import { freshPlay, playStart, playAct, playDone, playQuit, playReport, sanitizePlay, mergePlay, MIN_N, CONT_MS } from '../../src/engine/play.ts';
import { town, townLevel, townKey, townGain, SPOTS, MAX_LV } from '../../src/engine/town.ts';
import { freshE, sanitizeE, mergeE } from '../../src/engine/state.ts';
import { GAMES } from '../../src/engine/director.ts';

test('v89 số liệu chơi: ván, tự chọn / chơi lại, thao tác đầu, thời lượng; ván dở tính bỏ giữa khi mở game khác hoặc về sảnh', () => {
  const s = freshPlay();
  playStart(s, 'cafe', 'dir', 0);
  playAct(s, 4000); playAct(s, 9000);                 // chỉ thao tác ĐẦU được tính
  assert.equal(playDone(s, 'cafe', 240000), true);
  assert.equal(playDone(s, 'cafe', 250000), false, 'màn kết vẽ lại không đếm hai lần');
  playStart(s, 'cafe', 'again', 300000);             // chơi lại từ màn kết
  playStart(s, 'cards', 'self', 310000);             // bỏ ván quán giữa chừng
  playQuit(s);                                       // về sảnh khi Bài Câu chưa xong
  const c = s.g.cafe!, d = s.g.cards!;
  assert.deepEqual([c.n, c.done, c.quit, c.again, c.self], [2, 1, 1, 1, 0]);
  assert.deepEqual(c.fa, [4]); assert.deepEqual(c.du, [240]);
  assert.deepEqual([d.n, d.quit, d.self], [1, 1, 1]);
  assert.equal(s.cur, null);
});

test('v89 số liệu chơi: thước đo theo spec (Persistence, Effort, câu bằng chứng / phút), chỉ kết luận khi đủ ván', () => {
  const s = freshPlay();
  // 5 ván Vườn, mỗi ván 5 phút, 15 câu bằng chứng (3 câu / phút); 4 ván đầu xong là chơi tiếp ngay (trong 10 phút).
  for (let i = 0; i < MIN_N; i++) { const t = i * 360000; playStart(s, 'garden', 'dir', t); playAct(s, t + 3000); playDone(s, 'garden', t + 300000, 15); }
  playStart(s, 'robot', 'self', 5 * 360000);         // ván Vườn thứ 5 cũng được "chơi tiếp"
  playDone(s, 'robot', 5 * 360000 + 60000);           // game kỹ năng: không đếm câu
  playStart(s, 'cafe', 'self', 5 * 360000 + 60000 + CONT_MS + 1);   // quá 10 phút sau ván robot: không tính chơi tiếp
  const r = playReport(s), g = r.find(x => x.game === 'garden')!, b = r.find(x => x.game === 'robot')!;
  assert.equal(g.n, MIN_N); assert.equal(g.quit, 0); assert.equal(g.first, 3); assert.equal(g.dur, 300); assert.equal(g.er, 3); assert.equal(g.cont, 1);
  assert.deepEqual(g.ok, { quit: true, first: true, cont: true, dur: true, er: true });
  assert.equal(b.er, null); assert.equal(b.cont, 0);
  assert.equal(b.ok, null, 'chưa đủ ván thì không đánh ✓ / ✗');
});

test('v89 số liệu chơi: không thưởng ván dài (thời lượng chỉ có chặn trên) và không coi tự chọn là mục tiêu', () => {
  const s = freshPlay();
  for (let i = 0; i < MIN_N; i++) { playStart(s, 'cards', 'self', i * 1e7); playDone(s, 'cards', i * 1e7 + 900000, 20); }
  const c = playReport(s)[0]!;
  assert.equal(c.ok!.dur, false, 'ván 15 phút là quá dài');
  assert.equal(c.ok!.er, false, '20 câu / 15 phút < 2 câu / phút');
  assert.ok(!('self' in c.ok!), 'tự chọn chỉ để xem, không có ngưỡng');
});

test('v89 số liệu chơi: lưu / gộp an toàn, nằm trong st.e', () => {
  assert.equal(sanitizePlay(null), undefined);
  const x = sanitizePlay({ g: { cafe: { n: 3, done: 2, quit: -5, fa: [1, 'x', 2], du: Array(40).fill(100) }, hack: { n: 9 } }, cur: { g: 'nope' } })!;
  assert.deepEqual(Object.keys(x.g), ['cafe']); assert.equal(x.g.cafe!.quit, 0); assert.deepEqual(x.g.cafe!.fa, [1, 2]); assert.equal(x.g.cafe!.du.length, 20); assert.equal(x.cur, null);
  const a = freshPlay(), b = freshPlay();
  playStart(a, 'cafe', 'self', 0); playStart(b, 'cafe', 'self', 0); playStart(b, 'cafe', 'self', 1);
  assert.equal(mergePlay(a, b)!.g.cafe!.n, 2);
  const e = sanitizeE({ ...freshE(), pm: a });
  assert.equal(e.pm?.g.cafe?.n, 1);
  assert.equal(mergeE(e, { ...freshE(), pm: b }).pm?.g.cafe?.n, 2);
});

test('v89 Phố chung: mỗi game một công trình, suy ra từ bản lưu sẵn có; lên cấp được báo ở màn kết', () => {
  assert.deepEqual(new Set(SPOTS.map(s => s.game)), new Set(Object.keys(GAMES)), 'đủ 15 game, không thừa');
  const e = freshE();
  const t0 = town(e);
  assert.equal(townLevel(t0), 0); assert.equal(townKey(t0), '');
  assert.ok(t0.every(b => b.next !== null && b.lv === 0));
  const before = townKey(t0);
  e.gq = { stars: 23, runs: 4, best: 6, day: 1 };            // quán: mốc 5 / 22 → cấp 2
  e.gv = { runs: 1, blooms: 1, day: 1, plants: {} };
  const t1 = town(e), cafe = t1.find(b => b.game === 'cafe')!;
  assert.equal(cafe.lv, 2); assert.equal(cafe.next, 50);
  assert.deepEqual(townGain(before, t1).map(b => b.game).sort(), ['cafe', 'garden']);
  assert.deepEqual(townGain(townKey(t1), t1), [], 'không đổi thì không báo');
  e.gq.stars = 1000;
  assert.equal(town(e).find(b => b.game === 'cafe')!.lv, MAX_LV);
  assert.equal(town(e).find(b => b.game === 'cafe')!.next, null);
});

test('v89 Phố chung: đồng bộ hai máy không cần dữ liệu riêng (gộp bản lưu từng game rồi suy ra lại)', () => {
  const a = { ...freshE(), gq: { stars: 30, runs: 5, best: 6, day: 2 } }, b = { ...freshE(), gv: { runs: 2, blooms: 12, day: 3, plants: {} } };
  const m = mergeE(a, b), t = town(m);
  assert.equal(t.find(x => x.game === 'cafe')!.lv, 2);
  assert.equal(t.find(x => x.game === 'garden')!.lv, 2);
});
