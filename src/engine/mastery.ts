// Mastery theo bằng chứng (docs/SPEC.md, Quyết định kỹ thuật §2–§3).
// Mỗi cặp (nút, mức 1–5) giữ phân phối Beta(α, β). Mỗi lần trả lời cộng bằng chứng, trừ phần đoán mò g và nhầm tay s:
//   đúng: α += w·(1 − g)      sai: β += w·(1 − s)      m = α / (α + β)
// w = 1, còn 0,5 khi cùng một câu lặp lại trong 24 giờ (tránh nhớ đáp án). Bằng chứng ở mức cao tính luôn cho các mức thấp hơn.
// Đạt khi m ≥ 0,8 và cận dưới khoảng tin cậy 80% ≥ 0,6. Không cần dữ liệu hiệu chỉnh để chạy.
// v55 (spec v2.4 §45, §69, §82): cận dưới là phân vị 10% CHÍNH XÁC của Beta (không còn xấp xỉ chuẩn — lệch nhiều đúng ở vùng
// quyết định, khi n nhỏ và m gần 1); ô có cờ "mở lại" (model disagreement) hoặc "cần xác minh" (mức 4–5 chưa đúng câu mới nào)
// thì chưa Đạt; trạng thái nút tách Claim (suy ra từ chẩn đoán) khỏi Mastery (có bằng chứng thật).

import type { Level } from './types.ts';

export const SLIP = 0.1;
export const PASS_M = 0.8, PASS_LB = 0.6;
const Q_LO = 0.1;     // khoảng tin cậy 80% hai phía → cận dưới là phân vị 10%

export interface Cell {
  a: number;        // α (gồm tiên nghiệm 1)
  b: number;        // β (gồm tiên nghiệm 1)
  n: number;        // tổng trọng số bằng chứng đã nhận
  q: string[];      // các dạng câu đã đo (tối đa 6)
  c: string[];      // các ngữ cảnh đã đo (tối đa 8)
  d: number;        // ngày có bằng chứng gần nhất
  nv?: number;      // số lượt đúng ở câu lần đầu gặp (transfer/độ mới)
  ro?: 1;           // mở lại: bằng chứng mới mâu thuẫn với kết luận Đạt (spec §69)
  vf?: 1;           // cần xác minh: mức 4–5 chưa có lượt đúng nào ở câu mới (C180)
  cl?: 1;           // m3.3: Claim của chẩn đoán đang được xác nhận (chưa đủ 2 câu khác nhau): vẫn coi như biết, trạng thái "suy ra"
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
  for (let l = (ev.only || !ev.ok ? ev.level : 1) as Level; l <= ev.level; l = (l + 1) as Level) {   // sai chỉ tính ở đúng mức (m3.1)
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
  state: NodeState;
}
// unknown: chưa có gì · inferred: chỉ có tiên nghiệm (Claim) · learning: đang có bằng chứng, chưa đạt ngưỡng
// mastered: Đạt · verify: số liệu đủ nhưng chưa có bằng chứng ở câu mới · reopened: từng Đạt, bị bằng chứng mới phủ định
export type NodeState = 'unknown' | 'inferred' | 'learning' | 'mastered' | 'verify' | 'reopened';

export function stat(c: Cell | undefined): Status {
  const x = c ?? freshCell(), { m, lb, sd } = betaStat(x.a, x.b);
  const numbers = m >= PASS_M && lb >= PASS_LB, pass = numbers && !x.ro && !x.vf;
  const state: NodeState = !c ? 'unknown' : x.n <= 0 ? (x.a !== 1 || x.b !== 1 ? 'inferred' : 'unknown')
    : x.ro ? 'reopened' : numbers && x.vf ? 'verify' : pass && x.cl ? 'inferred' : pass ? 'mastered' : 'learning';
  // Confidence (spec §3): Thấp khi dưới 3 lượt có trọng số hoặc cận dưới < 0,5; Cao khi ≥ 2 dạng câu, ≥ 3 ngữ cảnh, sd ≤ 0,1.
  const conf: Status['conf'] = x.n < 3 || (lb < 0.5 && !(m < 0.5 && x.n >= 3)) ? 'low' : x.q.length >= 2 && x.c.length >= 3 && sd <= 0.1 ? 'high' : 'mid';
  return { m, lb, sd, n: x.n, pass, conf: x.ro || x.cl ? 'low' : conf, state };
}

export function statusOf(store: MasteryStore, node: string, level: Level): Status { return stat(store[node]?.[level]); }

// ---------- Phân vị Beta chính xác ----------
// ln Γ (Lanczos, g = 7, sai số ~1e-15)
const LG = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lnGamma(z: number): number {
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - lnGamma(1 - z);
  z -= 1;
  let x = LG[0]!;
  for (let i = 1; i < 9; i++) x += LG[i]! / (z + i);
  const t = z + 7.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
// Phân số liên tục của hàm beta không đầy đủ (Numerical Recipes, betacf).
function betacf(a: number, b: number, x: number): number {
  const EPS = 1e-12, FPMIN = 1e-300;
  let c = 1, d = 1 - ((a + b) * x) / (a + 1);
  if (Math.abs(d) < FPMIN) d = FPMIN;
  d = 1 / d;
  let h = d;
  for (let m = 1; m <= 300; m++) {
    const m2 = 2 * m;
    let aa = (m * (b - m) * x) / ((a + m2 - 1) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d; h *= d * c;
    aa = (-(a + m) * (a + b + m) * x) / ((a + m2) * (a + m2 + 1));
    d = 1 + aa * d; if (Math.abs(d) < FPMIN) d = FPMIN;
    c = 1 + aa / c; if (Math.abs(c) < FPMIN) c = FPMIN;
    d = 1 / d;
    const del = d * c;
    h *= del;
    if (Math.abs(del - 1) < EPS) break;
  }
  return h;
}
// I_x(a, b): hàm phân phối tích luỹ của Beta(a, b).
export function betaCdf(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? (bt * betacf(a, b, x)) / a : 1 - (bt * betacf(b, a, 1 - x)) / b;
}
const QCACHE = new Map<string, number>();
// Phân vị p của Beta(a, b) bằng chia đôi (60 vòng → sai số < 1e-15), có bộ nhớ đệm.
export function betaQuantile(p: number, a: number, b: number): number {
  const key = `${p}|${a.toFixed(5)}|${b.toFixed(5)}`, hit = QCACHE.get(key);
  if (hit !== undefined) return hit;
  let lo = 0, hi = 1;
  for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (betaCdf(mid, a, b) < p) lo = mid; else hi = mid; }
  const q = (lo + hi) / 2;
  if (QCACHE.size > 5000) QCACHE.clear();
  QCACHE.set(key, q);
  return q;
}

// Mastery, cận dưới khoảng tin cậy 80% (phân vị 10% chính xác) và độ lệch chuẩn của Beta(α, β). Dùng chung cho Can-Do.
export function betaStat(a: number, b: number): { m: number; lb: number; sd: number } {
  const s = a + b, m = a / s, sd = Math.sqrt((a * b) / (s * s * (s + 1)));
  return { m, lb: betaQuantile(Q_LO, a, b), sd };
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
