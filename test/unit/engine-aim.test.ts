import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { index, closure, defaultLevel } from '../../src/engine/graph.ts';
import type { Edge, Goal, Node } from '../../src/engine/types.ts';
import { compareOf } from '../../src/engine/compare.ts';
import { viewAim, AIM_LVS, isAimLv, type AimIn } from '../../src/engine/aimview.ts';
import { freshE } from '../../src/engine/state.ts';
import type { ECtx } from '../../src/engine/views.ts';

const nodes = JSON.parse(readFileSync('content/engine/nodes.json', 'utf8')) as Node[];
const edges = JSON.parse(readFileSync('content/engine/edges.json', 'utf8')) as Edge[];
const goals = readdirSync('content/engine/goals').map(f => JSON.parse(readFileSync(`content/engine/goals/${f}`, 'utf8')) as Goal);
const ix = index({ nodes, edges, goals });
const need = (id: string) => closure(ix, ix.goal.get(id)!.req, defaultLevel).map(r => ({ ...r, area: ix.node.get(r.node)?.area }));
const esc = (s: unknown) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const c = { host: { esc }, e: freshE(), route: 'aim' } as unknown as ECtx;
const gate0 = { has: true, open: false, passed: false, ratio: 0.42 };
const aim = (o: Partial<AimIn> = {}): AimIn => ({ lv: 'A2', o: compareOf(need('cefr-a2'), () => false, undefined), chosen: true, gate: gate0, forge: 'wheel', cap: 6, ...o });
const text = (h: string) => h.replace(/<[^>]+>/g, ' ');

test('v138 Mục tiêu: chỉ A1 và A2; A1 cũng chia đủ 7 kỹ năng', () => {
  assert.deepEqual(AIM_LVS.map(([l, g]) => [l, g]), [['A1', 'cefr-a1'], ['A2', 'cefr-a2']]);
  assert.ok(isAimLv('A1') && isAimLv('A2') && !isAimLv('B1'));
  const a1 = compareOf(need('cefr-a1'), () => false, undefined);
  assert.equal(a1.total, 186);   // v151 +1 Can-Do Nói (Nói & Đọc)
  assert.equal(a1.rows.filter(r => r.total).length, 7);
});

test('v138 Mục tiêu: 7 kỹ năng, mỗi kỹ năng có "📘 Học ở app"; chỉ Từ vựng có "⚔️ Rèn ở game" (mở lò Thợ rèn gợi ý)', () => {
  const h = viewAim(c, aim());
  assert.equal((h.match(/class="cmprow/g) ?? []).length, 7);
  assert.equal((h.match(/data-act="skgo"/g) ?? []).length, 7);
  assert.equal((h.match(/data-e="cblo" data-g="wheel"/g) ?? []).length, 1);
  assert.equal((h.match(/🔒 game chưa có lò/g) ?? []).length, 0);   // v182 bỏ nhãn khoá (chữ của người làm game)
  assert.match(h, /Cần đạt để qua A2<\/b> · 0\/361 phần đã vững/);
  assert.match(h, /data-e="aimlv" data-lv="A1" aria-pressed="false"/);
  assert.match(h, /data-r="goal\/cefr-a2"/);
  assert.doesNotMatch(h, /data-e="aimpick"/, 'đã là đích: không hỏi chọn');
  assert.match(viewAim(c, aim({ chosen: false })), /data-e="aimpick" data-g="cefr-a2">Chọn A2 làm đích/);
  assert.doesNotMatch(text(h).replace(/thi chuyển cấp/gi, ''), /\b(thi|đề|kiểm tra)\b/i);
});

test('v138 Mục tiêu: trận cổng ba trạng thái; chỉ mở nút vào cổng khi cấp này là đích', () => {
  assert.match(viewAim(c, aim()), /Mở khi đã vững ≥ 80% \(hiện 42%\)/);
  const open = viewAim(c, aim({ gate: { ...gate0, open: true } }));
  assert.match(open, /data-e="go" data-r="gate">🚪 Vào thi chuyển cấp A2/);
  assert.doesNotMatch(viewAim(c, aim({ chosen: false, gate: { ...gate0, open: true } })), /data-r="gate"/);
  assert.match(viewAim(c, aim({ gate: { ...gate0, passed: true } })), /✓ Đã qua thi chuyển cấp A2/);
  assert.match(viewAim(c, aim({ gate: { ...gate0, has: false } })), /chưa có bài thi chuyển cấp/);
  assert.match(viewAim(c, null), /Đang tải/);
});

test('v139 bấm dòng kỹ năng: danh sách từng phần (chưa vững trước, gần xong nhất trước; đã vững sau), mức cần, nguồn game / app', () => {
  const nd = need('cefr-a1'), voc = nd.filter(r => r.area === 'voc').map(r => r.node);
  const [s1, s2, p1, p2] = voc;
  const solid = new Set([s1, s2]), pct: Record<string, number> = { [p1!]: 0.6, [p2!]: 0.2 };
  const o = compareOf(nd, n => solid.has(n), { [s1!]: { g: 2, a: 0 }, [s2!]: { g: 0, a: 1 } }, undefined, n => ({ vi: `Tên ${n}`, pct: pct[n] ?? 0 }));
  const row = o.rows.find(r => r.id === 'voc')!;
  assert.equal(row.items!.length, row.total);
  assert.deepEqual(row.items!.slice(0, 2).map(i => i.node), [p1, p2], 'chưa vững, gần xong nhất trước');
  assert.deepEqual(row.items!.slice(-2).map(i => i.solid), [true, true], 'đã vững ở cuối');
  const h = viewAim(c, { ...aim(), lv: 'A1', o });
  assert.match(h, /<details class="aimsk">/);
  assert.match(h, /Bấm để xem 102 phần cần đạt/);
  assert.match(h, /🟡 Tên [^<]+<\/span><span class="hint">đang học · 60% · cần: /);
  assert.match(h, /✅ Tên [^<]+<\/span><span class="hint">đã vững · cần: [^<·]+ · ⚔️ nhờ game/);
  assert.match(h, /Còn 100 phần chưa vững/);
  assert.match(h, /Đã vững 2 phần/);
  assert.doesNotMatch(viewAim(c, aim()), /class="aimdet/, 'không có info thì không có danh sách');
});
