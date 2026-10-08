import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planFloor, reward, gameplayDifficulty, sanitizeQuest, mergeQuest, freshQuest, QUEST_VER, type Challenge } from '../../src/engine/quest.ts';
import { rank } from '../../src/engine/nba.ts';
import { ingest, freshEv } from '../../src/engine/ev/store.ts';
import { stat, type MasteryStore } from '../../src/engine/mastery.ts';
import { migrateE, sanitizeE, mergeE } from '../../src/engine/state.ts';
import type { PathItem } from '../../src/engine/path.ts';

// v62 Ladder Quest (spec v2.4 §19–24, P14; C61–C70, C187–C190, C341–C360).

const item = (node: string, dep: number): PathItem => ({ node, level: 3, minutes: 10, dep, score: dep / 10, goals: ['cefr-a1'] });
const open = [item('u:a', 8), item('u:b', 4), item('g:c', 2), item('g:d', 1)];
const none = { items: 0, mins: 0, risk: 0 };

test('mỗi lượt trong tầng là một thử thách tiếng Anh do NBA chọn, có Game Challenge Model đầy đủ (không gameplay rỗng)', () => {
  const acts = rank({ open, probe: { node: 'g:p', level: 3, mode: 'explore', eig: 0.5, effort: 1.5, score: 1 }, review: { items: 5, mins: 3, risk: 0.6 }, verify: [], transfer: [{ node: 'g:t', level: 3, imp: 0.9 }] });
  const plan = planFloor({ acts, open, review: ['u:old'], can: () => true, started: n => n !== 'u:a', floor: 1 });
  assert.equal(plan.length, 8);
  assert.deepEqual(plan.map(c => c.gameType), ['monster', 'scout', 'monster', 'chest', 'camp', 'monster', 'monster', 'boss']);
  for (const c of plan.filter(c => c.gameType !== 'camp')) {
    assert.ok(c.node && c.targetCompetencies[0] === c.node && c.evidenceTypes.length && c.version === QUEST_VER, JSON.stringify(c));
  }
  assert.equal(plan[0]!.node, 'u:a', 'quái đầu = nút mở đường cho nhiều năng lực nhất');
  assert.equal(plan[0]!.level, 1, 'nút chưa có bằng chứng: hỏi mức nhận ra trước');
  assert.equal(plan[1]!.node, 'g:p', 'trinh sát = câu dò chẩn đoán');
  assert.equal(plan[3]!.node, 'u:old', 'rương = phần sắp quên');
  assert.equal(plan[7]!.node, 'g:t', 'trùm = thử ở câu mới (transfer)');
  assert.equal(new Set(plan.filter(c => c.node).map(c => c.node)).size, plan.filter(c => c.node).length, 'không lặp nút trong một tầng');
});

test('độ khó gameplay tách khỏi độ khó ngôn ngữ: tầng cao hơn không đổi câu hỏi (P14, C343)', () => {
  const acts = rank({ open, probe: null, review: none, verify: [] });
  const a = planFloor({ acts, open, review: [], can: () => true, started: () => true, floor: 1 });
  const b = planFloor({ acts, open, review: [], can: () => true, started: () => true, floor: 12 });
  assert.deepEqual(a.map(c => [c.node, c.languageDifficulty]), b.map(c => [c.node, c.languageDifficulty]));
  assert.ok(b[0]!.gameplayDifficulty > a[0]!.gameplayDifficulty);
  assert.ok(gameplayDifficulty(100) <= 1);
});

test('xu tỉ lệ giá trị học: trùm câu mới > quái; câu đã gặp ít xu; câu sai không âm (C346–C347)', () => {
  const ch = (gameType: Challenge['gameType'], value: number): Challenge => ({ id: 'x', gameType, node: 'n', level: 3, targetCompetencies: ['n'], evidenceTypes: [], languageDifficulty: 3, gameplayDifficulty: 0.2, expectedTime: 15, context: 'quest', scoringRule: 'ok', value, version: QUEST_VER });
  assert.ok(reward(ch('boss', 1.5), true, true) > reward(ch('monster', 1), true, true));
  assert.ok(reward(ch('monster', 1), true, true) > reward(ch('monster', 1), true, false));
  assert.ok(reward(ch('monster', 1), false, true) >= 1);
  assert.ok(reward(ch('monster', 1), false, true) < reward(ch('monster', 1), true, true));
});

test('kết quả game là telemetry: chỉ câu trả lời vào mastery; trạng thái game có phiên bản, lọc, gộp hai máy (HG12)', () => {
  const st = freshEv(), m: MasteryStore = {};
  ingest(st, m, { node: 'u:a', level: 1, ok: true, item: 'w:x:vi', src: 'game', ctx: 'quest-monster', gp: 0.9 }, { dev: 'd', ts: 1, day: 1 });
  assert.equal(stat(m['u:a']![1]).n > 0, true);
  const e = migrateE({ v: 4, goals: [], m: {}, ev: null, r: {}, pri: 0, diag: null, q: { floor: 3, best: 2, coins: 40, runs: 5, wins: 2, ans: 30, ok: 20, day: 9, hack: 1 } });
  assert.deepEqual(e.q, { floor: 3, best: 2, coins: 40, runs: 5, wins: 2, ans: 30, ok: 20, day: 9 });
  assert.equal(sanitizeQuest({ floor: -5, coins: 'x' })!.floor, 1);
  const merged = mergeE({ ...e, q: { ...freshQuest(), floor: 7, coins: 10 } }, e);
  assert.equal(merged.q!.floor, 7); assert.equal(merged.q!.coins, 40);
  assert.equal(sanitizeE({ v: 4 }).q, undefined);
  assert.equal(mergeQuest(undefined, e.q)!.floor, 3);
});

test('v69 (bot L01): giãn cách — nút đã hỏi đủ lượt hôm nay nhường chỗ nút khác; chưa có gì để ôn thì xác nhận Claim của chẩn đoán', () => {
  const acts = rank({ open, probe: null, review: none, verify: [] });
  const plan = planFloor({ acts, open, review: [], can: () => true, started: () => true, floor: 1, fresh: n => n !== 'u:a', claims: ['u:c1', 'u:c2'] });
  assert.ok(!plan.some(c => c.node === 'u:a' && c.gameType === 'monster'), 'u:a đã hỏi đủ hôm nay');
  const scouts = plan.filter(c => c.gameType === 'scout').map(c => c.node);
  assert.deepEqual(scouts, ['u:c1', 'u:c2'], 'trinh sát và rương rảnh dùng để xác nhận Claim');
  assert.ok(plan.filter(c => c.gameType === 'scout').every(c => c.level === 3), 'xác nhận bằng câu tự gõ (mức 3), khó đoán mò');
  // Mọi nút đều hết lượt hôm nay: vẫn dựng được tầng (không kẹt người học).
  assert.ok(planFloor({ acts, open, review: [], can: () => true, started: () => true, floor: 1, fresh: () => false }).length >= 6);
});
