// Trạng thái engine trong bản lưu (st.e), có phiên bản và nâng cấp từng bước như src/exam/state.ts.
// v1 (M1): mục tiêu đã chọn. v2 (M2): kho mastery theo (nút, mức) + câu vừa trả lời (giảm trọng số khi lặp trong 24 giờ).

import { mergeStore, type Cell, type MasteryStore } from './mastery.ts';
import type { Level } from './types.ts';

export const E_V = 2;

export interface GoalSel {
  id: string;            // id mục tiêu (content/engine/goals/<id>.json)
  version: string;       // phiên bản Target Model lúc chọn: đổi phiên bản không làm hỏng dữ liệu cũ (spec mục 5)
  since: number;         // ngày chọn
  date: number | null;   // ngày thi / hạn đạt (nếu có)
}

export interface EState {
  v: number;
  goals: GoalSel[];
  m: MasteryStore;                 // bằng chứng: nút → mức → Beta(α, β)
  r: Record<string, number>;       // id câu → ngày trả lời gần nhất (chỉ giữ 2 ngày)
  pri: number;                     // đã nạp tiên nghiệm từ tiến độ cũ (1) hay chưa (0)
}

export const GOAL_MAX = 4;

export function freshE(): EState { return { v: E_V, goals: [], m: {}, r: {}, pri: 0 }; }

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const day = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e6 ? Math.round(v) : null);
const idOk = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9.-]{0,40}$/.test(v);

export function migrateE(raw: unknown): EState {
  const x = obj(raw);
  if (typeof x.v !== 'number') return freshE();
  if (x.v === 1) { x.m = {}; x.r = {}; x.pri = 0; x.v = 2; }   // v1 → v2: thêm kho mastery
  return sanitizeE(x);
}

export function sanitizeE(raw: unknown): EState {
  const x = obj(raw), out = freshE(), seen = new Set<string>();
  for (const g0 of Array.isArray(x.goals) ? x.goals : []) {
    const g = obj(g0);
    if (!idOk(g.id) || seen.has(g.id)) continue;
    seen.add(g.id);
    out.goals.push({ id: g.id, version: typeof g.version === 'string' && /^\d+\.\d+$/.test(g.version) ? g.version : '1.0', since: day(g.since) ?? 0, date: day(g.date) });
    if (out.goals.length >= GOAL_MAX) break;
  }
  const num = (v: unknown, lo: number, hi: number, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
  const strs = (v: unknown, max: number): string[] => (Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string' && s.length <= 40).slice(0, max) : []);
  for (const [id, cells0] of Object.entries(obj(x.m))) {
    if (!/^(cd|u|g|x|xw|xs):[a-z0-9][a-z0-9._-]{0,60}$/.test(id)) continue;
    const cells: Partial<Record<Level, Cell>> = {};
    for (const [k, c0] of Object.entries(obj(cells0))) {
      const l = Number(k), c = obj(c0);
      if (!(l >= 1 && l <= 5)) continue;
      cells[l as Level] = { a: num(c.a, 0.01, 1e5, 1), b: num(c.b, 0.01, 1e5, 1), n: num(c.n, 0, 1e5, 0), q: strs(c.q, 6), c: strs(c.c, 8), d: Math.round(num(c.d, 0, 1e6, 0)) };
    }
    if (Object.keys(cells).length) out.m[id] = cells;
  }
  const newest = Math.max(0, ...Object.values(obj(x.r)).filter((d): d is number => typeof d === 'number'));
  for (const [k, d] of Object.entries(obj(x.r))) if (typeof d === 'number' && k.length <= 80 && d >= newest - 1) out.r[k] = Math.round(d);
  out.pri = x.pri === 1 ? 1 : 0;
  return out;
}

// Gộp hai máy (đồng bộ): hợp các mục tiêu, máy nào chọn trước thì giữ ngày chọn sớm hơn; ngày thi lấy bản có giá trị.
export function mergeE(a: unknown, b: unknown): EState {
  const A = sanitizeE(a), B = sanitizeE(b), by = new Map(A.goals.map(g => [g.id, g]));
  for (const g of B.goals) {
    const cur = by.get(g.id);
    if (!cur) by.set(g.id, g);
    else by.set(g.id, { ...cur, since: Math.min(cur.since, g.since), date: cur.date ?? g.date });
  }
  return sanitizeE({ v: E_V, goals: [...by.values()].sort((p, q) => p.since - q.since), m: mergeStore(A.m, B.m), r: { ...B.r, ...A.r }, pri: A.pri || B.pri ? 1 : 0 });
}
