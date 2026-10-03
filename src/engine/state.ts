// Trạng thái engine trong bản lưu (st.e), có phiên bản và nâng cấp từng bước như src/exam/state.ts.
// v1 (M1): mục tiêu đã chọn. Các mốc sau thêm bằng chứng, mastery, lịch ôn (mỗi lần tăng E_V + một khối migrate).

export const E_V = 1;

export interface GoalSel {
  id: string;            // id mục tiêu (content/engine/goals/<id>.json)
  version: string;       // phiên bản Target Model lúc chọn: đổi phiên bản không làm hỏng dữ liệu cũ (spec mục 5)
  since: number;         // ngày chọn
  date: number | null;   // ngày thi / hạn đạt (nếu có)
}

export interface EState {
  v: number;
  goals: GoalSel[];
}

export const GOAL_MAX = 4;

export function freshE(): EState { return { v: E_V, goals: [] }; }

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const day = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 1e6 ? Math.round(v) : null);
const idOk = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9.-]{0,40}$/.test(v);

export function migrateE(raw: unknown): EState {
  const x = obj(raw);
  if (typeof x.v !== 'number') return freshE();
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
  return sanitizeE({ v: E_V, goals: [...by.values()].sort((p, q) => p.since - q.since) });
}
