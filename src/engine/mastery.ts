// Mastery theo bằng chứng (docs/SPEC.md, Quyết định kỹ thuật §2–§3).
// Mỗi cặp (nút, mức 1–5) giữ phân phối Beta(α, β). Mỗi lần trả lời cộng bằng chứng, trừ phần đoán mò g và nhầm tay s:
//   đúng: α += w·(1 − g)      sai: β += w·(1 − s)      m = α / (α + β)
// w = 1, còn 0,5 khi cùng một câu lặp lại trong 24 giờ (tránh nhớ đáp án). Bằng chứng ở mức cao tính luôn cho các mức thấp hơn.
// Đạt khi m ≥ 0,8 và cận dưới khoảng tin cậy 80% ≥ 0,6. Không cần dữ liệu hiệu chỉnh để chạy.

import type { Level } from './types.ts';

export const SLIP = 0.1;
export const PASS_M = 0.8, PASS_LB = 0.6;
const Z80 = 1.2816;   // phân vị 90% của phân phối chuẩn: khoảng tin cậy 80% hai phía → cận dưới

export interface Cell {
  a: number;        // α (gồm tiên nghiệm 1)
  b: number;        // β (gồm tiên nghiệm 1)
  n: number;        // tổng trọng số bằng chứng đã nhận
  q: string[];      // các dạng câu đã đo (tối đa 6)
  c: string[];      // các ngữ cảnh đã đo (tối đa 8)
  d: number;        // ngày có bằng chứng gần nhất
}
export type NodeCells = Partial<Record<Level, Cell>>;
export type MasteryStore = Record<string, NodeCells>;

export interface Evidence {
  node: string;          // id nút trong đồ thị (u:…, g:…, x:…, cd:…)
  level: Level;          // mức câu này đo
  ok: boolean;
  g?: number;            // xác suất đoán đúng (1/số phương án; 0 với câu tự gõ)
  item?: string;         // id câu (để giảm trọng số khi lặp trong 24 giờ)
  qt?: string;           // dạng câu
  ctx?: string;          // ngữ cảnh
  w?: number;            // trọng số thêm (ví dụ 0,5 khi người học tự nhận là đoán)
  only?: boolean;        // chỉ ghi đúng mức này, không lan xuống mức thấp (bài làm thật chấm theo ngưỡng từng mức)
}

export const freshCell = (): Cell => ({ a: 1, b: 1, n: 0, q: [], c: [], d: 0 });
const addUniq = (xs: string[], x: string | undefined, max: number): string[] => (!x || xs.includes(x) || xs.length >= max ? xs : [...xs, x]);

// Ghi một bằng chứng. `recent` = id câu → ngày trả lời gần nhất (do người gọi giữ). Trả về true nếu có ghi.
export function record(store: MasteryStore, ev: Evidence, today: number, recent?: Record<string, number>): boolean {
  if (!ev.node || !(ev.level >= 1 && ev.level <= 5)) return false;
  let w = ev.w ?? 1;
  if (ev.item && recent) {
    const last = recent[ev.item];
    if (last !== undefined && today - last < 1) w *= 0.5;
    recent[ev.item] = today;
  }
  const g = Math.min(0.9, Math.max(0, ev.g ?? 0));
  const cells = (store[ev.node] ||= {});
  for (let l = (ev.only ? ev.level : 1) as Level; l <= ev.level; l = (l + 1) as Level) {
    const c = (cells[l] ||= freshCell());
    if (ev.ok) c.a += w * (1 - g); else c.b += w * (1 - SLIP);
    c.n += w; c.q = addUniq(c.q, ev.qt, 6); c.c = addUniq(c.c, ev.ctx, 8); c.d = today;
  }
  return true;
}

// Tiên nghiệm từ tiến độ cũ hoặc từ chẩn đoán: cộng α/β giả (không tính vào dạng câu, ngữ cảnh), chỉ khi ô chưa có bằng chứng thật.
export function prior(store: MasteryStore, node: string, upTo: Level, a: number, b: number): void {
  const cells = (store[node] ||= {});
  for (let l = 1 as Level; l <= upTo; l = (l + 1) as Level) {
    const c = (cells[l] ||= freshCell());
    if (c.n > 0) continue;
    c.a = 1 + a; c.b = 1 + b;
  }
}

export interface Status {
  m: number;             // ước lượng mastery
  lb: number;            // cận dưới khoảng tin cậy 80%
  sd: number;
  n: number;
  pass: boolean;
  conf: 'low' | 'mid' | 'high';
}

export function stat(c: Cell | undefined): Status {
  const x = c ?? freshCell(), s = x.a + x.b, m = x.a / s, sd = Math.sqrt((x.a * x.b) / (s * s * (s + 1))), lb = Math.max(0, m - Z80 * sd);
  const pass = m >= PASS_M && lb >= PASS_LB;
  // Confidence (spec §3): Thấp khi dưới 3 lượt có trọng số hoặc cận dưới < 0,5; Cao khi ≥ 2 dạng câu, ≥ 3 ngữ cảnh, sd ≤ 0,1.
  const conf: Status['conf'] = x.n < 3 || (lb < 0.5 && !(m < 0.5 && x.n >= 3)) ? 'low' : x.q.length >= 2 && x.c.length >= 3 && sd <= 0.1 ? 'high' : 'mid';
  return { m, lb, sd, n: x.n, pass, conf };
}

export function statusOf(store: MasteryStore, node: string, level: Level): Status { return stat(store[node]?.[level]); }

// Cận dưới của Beta(α, β) theo xấp xỉ chuẩn: dùng chung cho Can-Do tính từ điểm hoạt động.
export function betaStat(a: number, b: number): { m: number; lb: number; sd: number } {
  const s = a + b, m = a / s, sd = Math.sqrt((a * b) / (s * s * (s + 1)));
  return { m, lb: Math.max(0, m - Z80 * sd), sd };
}

// Gộp hai máy: với mỗi ô lấy bản có nhiều bằng chứng hơn (không cộng dồn để khỏi đếm hai lần cùng một câu trả lời đã đồng bộ).
export function mergeStore(a: MasteryStore, b: MasteryStore): MasteryStore {
  const out: MasteryStore = {};
  for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
    const A = a[id] ?? {}, B = b[id] ?? {}, cells: NodeCells = {};
    for (let l = 1 as Level; l <= 5; l = (l + 1) as Level) {
      const x = A[l], y = B[l];
      const pick = !x ? y : !y ? x : y.n > x.n || (y.n === x.n && y.d > x.d) ? y : x;
      if (pick) cells[l] = pick;
    }
    out[id] = cells;
  }
  return out;
}
