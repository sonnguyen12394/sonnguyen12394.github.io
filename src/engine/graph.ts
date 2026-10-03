// Thao tác trên đồ thị năng lực: chỉ mục, phát hiện vòng lặp (spec mục 46), đóng tiền đề cứng, gộp nhiều mục tiêu.

import type { Edge, Goal, Graph, Level, Node, Req } from './types.ts';

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
    if (!x.req.length) err.push(`${x.id}: mục tiêu rỗng`);
    for (const r of x.req) if (!seen.has(r.node)) err.push(`${x.id}: nút không có ${r.node}`);
  }
  return err;
}
