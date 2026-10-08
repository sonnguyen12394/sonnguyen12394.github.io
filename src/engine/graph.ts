// Thao tác trên đồ thị năng lực: chỉ mục, phát hiện vòng lặp (spec mục 46), đóng tiền đề cứng, gộp nhiều mục tiêu.

import type { Dim, Edge, Goal, Graph, Level, Node, Req } from './types.ts';
import { CEFRS } from './types.ts';

export interface Index {
  node: Map<string, Node>;
  pre: Map<string, Edge[]>;    // tiền đề của một nút (cạnh đi ra)
  post: Map<string, Edge[]>;   // các nút cần nút này (cạnh đi vào)
  goal: Map<string, Goal>;
}

export function index(g: Graph): Index {
  const node = new Map(g.nodes.map(n => [n.id, n]));
  const pre = new Map<string, Edge[]>(), post = new Map<string, Edge[]>();
  for (const e of g.edges) {
    (pre.get(e.from) ?? pre.set(e.from, []).get(e.from)!).push(e);
    (post.get(e.to) ?? post.set(e.to, []).get(e.to)!).push(e);
  }
  return { node, pre, post, goal: new Map(g.goals.map(x => [x.id, x])) };
}

// Thứ tự tô-pô: tiền đề đứng trước. Có vòng lặp thì trả về các nút nằm trong vòng (Kahn: nút không bao giờ hết bậc vào).
export function topo(nodes: string[], edges: Edge[]): { order: string[]; cycle: string[] } {
  const ids = new Set(nodes), need = new Map(nodes.map(n => [n, 0])), out = new Map<string, string[]>();
  for (const e of edges) {
    if (!ids.has(e.from) || !ids.has(e.to)) continue;
    need.set(e.from, need.get(e.from)! + 1);
    (out.get(e.to) ?? out.set(e.to, []).get(e.to)!).push(e.from);
  }
  const queue = nodes.filter(n => need.get(n) === 0).sort(), order: string[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    order.push(n);
    for (const m of out.get(n) ?? []) { const k = need.get(m)! - 1; need.set(m, k); if (k === 0) queue.push(m); }
  }
  const done = new Set(order);
  return { order, cycle: nodes.filter(n => !done.has(n)) };
}

// Gộp nhiều mục tiêu: mỗi nút lấy mức cần cao nhất (spec §6, bước 5).
export function mergeGoals(goals: Goal[]): Req[] {
  const best = new Map<string, Req>();
  for (const g of goals) for (const r of g.req) {
    const cur = best.get(r.node);
    if (!cur || r.level > cur.level) best.set(r.node, r);
  }
  return [...best.values()].sort((a, b) => (a.node < b.node ? -1 : 1));
}

// Đóng tiền đề cứng: mọi nút mục tiêu cần, cộng (đệ quy) các tiền đề cứng. Tiền đề nhận mức mặc định của nút nếu chưa có mức cao hơn.
export function closure(ix: Index, req: Req[], defaultLevel: (n: Node) => Level): Req[] {
  const out = new Map(req.map(r => [r.node, r]));
  const stack = req.map(r => r.node);
  while (stack.length) {
    const id = stack.pop()!;
    for (const e of ix.pre.get(id) ?? []) {
      if (e.type !== 'hard' || out.has(e.to)) continue;
      const n = ix.node.get(e.to);
      if (!n) continue;
      out.set(e.to, { node: e.to, level: defaultLevel(n), type: 'foundation' });
      stack.push(e.to);
    }
  }
  return [...out.values()];
}

// Mức mặc định khi một nút chỉ là tiền đề (không do mục tiêu ghi trực tiếp).
export function defaultLevel(n: Node): Level {
  if (n.kind === 'vocab') return 3;
  if (n.kind === 'grammar') return 4;
  if (n.skill === 'W' || n.skill === 'S') return 4;
  return 3;
}

// Kiểm tính toàn vẹn: id trùng, cạnh trỏ nút không có, tự trỏ, vòng lặp, mục tiêu chứa nút lạ. Trả về danh sách lỗi (rỗng = tốt).
export function validate(g: Graph): string[] {
  const err: string[] = [], seen = new Set<string>();
  for (const n of g.nodes) { if (seen.has(n.id)) err.push(`nút trùng id: ${n.id}`); seen.add(n.id); }
  for (const e of g.edges) {
    if (!seen.has(e.from)) err.push(`cạnh từ nút không có: ${e.from}`);
    if (!seen.has(e.to)) err.push(`cạnh tới nút không có: ${e.to}`);
    if (e.from === e.to) err.push(`cạnh tự trỏ: ${e.from}`);
    if (!(e.w > 0 && e.w <= 1)) err.push(`độ mạnh cạnh ngoài (0, 1]: ${e.from} → ${e.to}`);
  }
  const { cycle } = topo(g.nodes.map(n => n.id), g.edges);
  if (cycle.length) err.push(`vòng lặp phụ thuộc qua ${cycle.length} nút: ${cycle.slice(0, 8).join(', ')}`);
  const gids = new Set<string>();
  for (const x of g.goals) {
    if (gids.has(x.id)) err.push(`mục tiêu trùng id: ${x.id}`);
    gids.add(x.id);
    if (!/^\d+\.\d+$/.test(x.version)) err.push(`${x.id}: phiên bản phải dạng 1.0`);
    if (x.status !== 'active' && x.status !== 'future') err.push(`${x.id}: trạng thái phải là active hoặc future`);
    if (!x.req.length) err.push(`${x.id}: mục tiêu rỗng`);
    for (const r of x.req) if (!seen.has(r.node)) err.push(`${x.id}: nút không có ${r.node}`);
  }
  return err;
}

// Kiểm định Knowledge/Graph (spec v2.4 §16, C207–C223, C239): khác validate() ở chỗ trả về cảnh báo chất lượng, không chỉ lỗi cấu trúc.
//   orphan: nút không thuộc bao đóng tiền đề của mục tiêu nào và không có cạnh nào (kho kiến thức chết).
//   unreachable: nút trong bao đóng của mục tiêu ĐANG MỞ mà không có hoạt động nào để học/đo (người học không thể đạt).
//   inverse: tiền đề cứng ở cấp CEFR CAO hơn nút cần nó (tiền đề ngược).
//   dup: hai nút cùng loại có tên gần trùng (chồng lấn).
//   balance: phân bố 8 năng lực Universal Core trong bao đóng mỗi mục tiêu đang mở.
//   altBad: nhóm tiền đề thay thế có need lớn hơn số nút trong nhóm.
export interface Audit { orphan: string[]; unreachable: string[]; inverse: string[]; dup: string[][]; balance: Record<string, Partial<Record<Dim, number>>>; altBad: string[] }
export function audit(g: Graph): Audit {
  const ix = index(g), inGoal = new Set<string>(), active = new Set<string>();
  for (const goal of g.goals) for (const r of closure(ix, goal.req, defaultLevel)) { inGoal.add(r.node); if (goal.status === 'active') active.add(r.node); }
  const touched = new Set(g.edges.flatMap(e => [e.from, e.to]));
  const ci = (c: Node['cefr']) => (c ? CEFRS.indexOf(c) : -1);
  const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  const byName = new Map<string, string[]>();
  for (const n of g.nodes) { const k = `${n.kind}|${n.cefr}|${n.skill}|${norm(n.vi)}`; (byName.get(k) ?? byName.set(k, []).get(k)!).push(n.id); }   // cùng loại, cùng cấp, cùng kỹ năng
  const balance: Audit['balance'] = {};
  for (const goal of g.goals.filter(x => x.status === 'active')) {
    const b: Partial<Record<Dim, number>> = {};
    for (const r of closure(ix, goal.req, defaultLevel)) for (const d of ix.node.get(r.node)?.dims ?? []) b[d] = (b[d] ?? 0) + 1;
    balance[goal.id] = b;
  }
  const alts = new Map<string, { n: number; need: number }>();
  for (const e of g.edges) if (e.alt) { const k = `${e.from}#${e.alt}`, x = alts.get(k) ?? { n: 0, need: e.need ?? 1 }; x.n++; alts.set(k, x); }
  return {
    orphan: g.nodes.filter(n => !inGoal.has(n.id) && !touched.has(n.id)).map(n => n.id),
    unreachable: [...active].filter(id => !(ix.node.get(id)?.acts.length)),
    inverse: g.edges.filter(e => e.type === 'hard' && ci(ix.node.get(e.to)?.cefr ?? null) > ci(ix.node.get(e.from)?.cefr ?? null) && ci(ix.node.get(e.from)?.cefr ?? null) >= 0).map(e => `${e.from} → ${e.to}`),
    dup: [...byName.values()].filter(v => v.length > 1),
    balance,
    altBad: [...alts.entries()].filter(([, x]) => x.need > x.n).map(([k]) => k),
  };
}

// Tiền đề cứng còn chặn một nút: cạnh cứng thường chưa đạt, hoặc nhóm thay thế (alt) chưa đủ `need` nút đạt.
export function blockedBy(ix: Index, id: string, unmet: (to: string) => boolean): boolean {
  const groups = new Map<string, { ok: number; need: number }>();
  for (const e of ix.pre.get(id) ?? []) {
    if (e.type !== 'hard') continue;
    if (!e.alt) { if (unmet(e.to)) return true; continue; }
    const x = groups.get(e.alt) ?? { ok: 0, need: e.need ?? 1 };
    if (!unmet(e.to)) x.ok++;
    groups.set(e.alt, x);
  }
  for (const x of groups.values()) if (x.ok < x.need) return true;
  return false;
}
