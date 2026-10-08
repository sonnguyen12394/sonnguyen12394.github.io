// Gap → Learning Path (docs/SPEC.md, Quyết định kỹ thuật §6). Thuần hàm để test được.
//   1. Gộp mục tiêu (mức cần cao nhất mỗi nút), đóng tiền đề cứng, bỏ nút đã Đạt → tập thiếu.
//   2. Chỉ nút có mọi tiền đề cứng đã đạt mới được mở (biên tô-pô).
//   3. Ưu tiên = (số năng lực mục tiêu phụ thuộc vào nút, có trọng số độ mạnh cạnh và độ gần ngày thi) ÷ phút ước tính.
// Nút đã Đạt ra khỏi lộ trình (spec mục 17); việc giữ nó là của ôn duy trì.

import type { Goal, Level, Req } from './types.ts';
import { blockedBy, closure, defaultLevel, mergeGoals, topo, type Index } from './graph.ts';

export interface GoalIn { goal: Goal; date: number | null }
export interface PathItem { node: string; level: Level; minutes: number; score: number; dep: number; goals: string[] }
export interface PathOut { unmet: Req[]; open: PathItem[]; total: number; minutes: number; all?: Req[] }

// Mục tiêu có ngày thi gần thì nặng hơn (tối đa ×3 khi còn ≤ 0 ngày, về ×1 khi còn ≥ 180 ngày).
export function goalWeight(date: number | null, today: number): number {
  if (date === null) return 1;
  return 1 + 2 * Math.max(0, Math.min(1, 1 - (date - today) / 180));
}

// boost: hệ số ưu tiên thêm cho nút (v58: tiền đề đã được kiểm chứng là nguyên nhân gốc của lỗi lặp lại → học trước, §50).
export function plan(ix: Index, goals: GoalIn[], today: number, isPass: (node: string, level: Level) => boolean, boost?: Map<string, number>): PathOut {
  if (!goals.length) return { unmet: [], open: [], total: 0, minutes: 0 };
  const req = mergeGoals(goals.map(g => g.goal));
  const all = closure(ix, req, defaultLevel);
  const unmet = all.filter(r => !isPass(r.node, r.level));
  const ids = new Set(unmet.map(r => r.node)), level = new Map(unmet.map(r => [r.node, r.level]));
  // Trọng số mục tiêu của các nút mục tiêu ghi trực tiếp
  const reqW = new Map<string, number>(), owners = new Map<string, string[]>();
  for (const { goal, date } of goals) {
    const w = goalWeight(date, today);
    for (const r of goal.req) if (ids.has(r.node)) { reqW.set(r.node, (reqW.get(r.node) ?? 0) + w); (owners.get(r.node) ?? owners.set(r.node, []).get(r.node)!).push(goal.id); }
  }
  // dep(n) = trọng số mục tiêu của chính n + Σ độ mạnh cạnh × dep(nút cần n), tính từ nút phụ thuộc xuống tiền đề.
  const inSub = ix.node.size ? [...ids] : [];
  const sub = inSub.flatMap(id => (ix.pre.get(id) ?? []).filter(e => ids.has(e.to)));
  const { order } = topo(inSub, sub);
  const dep = new Map<string, number>(), who = new Map<string, Set<string>>();
  for (const id of [...order].reverse()) {
    let d = reqW.get(id) ?? 0;
    const g = new Set(owners.get(id) ?? []);
    for (const e of ix.post.get(id) ?? []) if (ids.has(e.from)) { d += e.w * (dep.get(e.from) ?? 0); for (const x of who.get(e.from) ?? []) g.add(x); }
    dep.set(id, d); who.set(id, g);
  }
  const open: PathItem[] = [];
  for (const id of ids) {
    const blocked = blockedBy(ix, id, to => ids.has(to));   // v57: hỗ trợ nhóm tiền đề thay thế (alt/need)
    if (blocked) continue;
    const n = ix.node.get(id)!, minutes = Math.max(5, n.minutes), d = dep.get(id) ?? 0;
    open.push({ node: id, level: level.get(id)!, minutes, dep: d, score: (d * (boost?.get(id) ?? 1)) / minutes, goals: [...(who.get(id) ?? [])].sort() });
  }
  open.sort((a, b) => b.score - a.score || (a.node < b.node ? -1 : 1));
  return { unmet, open, total: all.length, minutes: unmet.reduce((t, r) => t + (ix.node.get(r.node)?.minutes ?? 0), 0), all };
}

export interface Session { review: number; items: PathItem[]; perf: PathItem | null; minutes: number }

// Buổi học hằng ngày: ôn đến hạn trước (tối đa 30% thời gian), rồi các nút ưu tiên cao nhất (mỗi nút một khúc ≤ 20 phút);
// nếu 7 ngày qua chưa có bài làm thật (Can-Do/bài thi) thì thêm một bài như vậy (spec §6, bước 4).
export function session(p: PathOut, mins: number, reviewMins: number, perfDue: boolean, isPerf: (node: string) => boolean): Session {
  const review = Math.min(reviewMins, Math.round(mins * 0.3));
  let left = mins - review;
  const perf = perfDue ? p.open.find(x => isPerf(x.node)) ?? null : null;
  if (perf) left -= Math.min(20, perf.minutes);
  const items: PathItem[] = [];
  for (const x of p.open) {
    if (left <= 0) break;
    if (perf && x.node === perf.node) continue;
    items.push(x); left -= Math.min(20, x.minutes);
  }
  if (!items.length && p.open[0] && p.open[0] !== perf) items.push(p.open[0]);
  return { review, items, perf, minutes: mins };
}
