// Chẩn đoán dò đồ thị (docs/SPEC.md, Quyết định kỹ thuật §7). Thuần hàm để test được.
// Hai "cầu thang" riêng cho từ vựng (nút u:) và ngữ pháp (nút g:): bắt đầu ở cấp ước tính (từ bài kiểm tra Nghe/Đọc nếu có,
// không thì A1), dò một nút ở cấp đó (nút có nhiều năng lực mục tiêu phụ thuộc nhất), đạt → lên nửa cấp, trượt → xuống nửa cấp
// (xuống là dò tiền đề: truy gốc rễ, spec mục 15). Dừng khi đủ số lượt, đã hội tụ (≥ 2 lần đổi chiều mỗi cầu thang) hoặc hết giờ.
// Kết thúc: nút cấp dưới mức ước tính coi như đã biết, nút cấp trên coi như chưa biết (tiên nghiệm, chỉ cho ô chưa có bằng chứng thật).

import type { Cefr } from './types.ts';
import { CEFRS } from './types.ts';

export type Kind = 'u' | 'g';
export interface Cand { id: string; kind: Kind; lv: number; weight: number }   // lv = chỉ số CEFR 0–5; weight = số nút mục tiêu phụ thuộc
export interface Stair { est: number; dir: 0 | 1 | -1; rev: number; n: number; seen: number[] }
export interface DiagState {
  t0: number;                   // ms lúc bắt đầu
  stair: Record<Kind, Stair>;
  probed: string[];             // id nút đã dò
  turn: Kind;
  results: Array<{ id: string; kind: Kind; lv: number; got: number; of: number }>;
}

export const MAX_PROBES = 16, MAX_MS = 20 * 60 * 1000, MIN_PER_KIND = 5;

export function startDiag(startLv: number, now: number): DiagState {
  const s = (): Stair => ({ est: Math.max(0, Math.min(5, startLv)), dir: 0, rev: 0, n: 0, seen: [] });
  return { t0: now, stair: { u: s(), g: s() }, probed: [], turn: 'u', results: [] };
}

// Nút dò tiếp theo cho lượt hiện tại: cùng loại, cấp gần mức ước tính nhất, chưa dò, nhiều năng lực mục tiêu phụ thuộc nhất.
export function nextProbe(d: DiagState, cands: Cand[]): Cand | null {
  for (const kind of [d.turn, d.turn === 'u' ? 'g' : 'u'] as Kind[]) {
    const lv = Math.round(d.stair[kind].est), done = new Set(d.probed);
    const pool = cands.filter(c => c.kind === kind && !done.has(c.id));
    if (!pool.length) continue;
    pool.sort((a, b) => Math.abs(a.lv - lv) - Math.abs(b.lv - lv) || b.weight - a.weight || (a.id < b.id ? -1 : 1));
    return pool[0]!;
  }
  return null;
}

// Ghi kết quả một nút: đạt khi đúng ≥ 2/3, trượt khi ≤ 1/3, ở giữa thì giữ nguyên cầu thang.
export function answer(d: DiagState, c: Cand, got: number, of: number): void {
  d.probed.push(c.id);
  d.results.push({ id: c.id, kind: c.kind, lv: c.lv, got, of });
  const s = d.stair[c.kind], r = of ? got / of : 0, dir: 0 | 1 | -1 = r >= 2 / 3 ? 1 : r <= 1 / 3 ? -1 : 0;
  s.n++; s.seen.push(c.lv);
  if (dir) {
    if (s.dir && dir !== s.dir) s.rev++;
    s.dir = dir;
    s.est = Math.max(0, Math.min(5, s.est + dir * 0.5));
  }
  d.turn = c.kind === 'u' ? 'g' : 'u';
}

export function finished(d: DiagState, now: number, left: number): boolean {
  if (left === 0 || now - d.t0 >= MAX_MS || d.probed.length >= MAX_PROBES) return true;
  const ok = (s: Stair) => s.n >= MIN_PER_KIND && s.rev >= 2;
  return ok(d.stair.u) && ok(d.stair.g);
}

// Cấp ước tính cuối của một cầu thang: trung bình 4 cấp dò gần nhất (ổn định hơn một điểm cuối), lấy cả mức ước tính hiện tại.
export function level(s: Stair): number {
  const last = [...s.seen.slice(-4), s.est];
  return Math.round((last.reduce((a, b) => a + b, 0) / last.length) * 2) / 2;
}

// Tiên nghiệm sau chẩn đoán: cấp ≤ mức ước tính − 1 coi như đã biết (≈ đạt), cấp ≥ mức ước tính + 1 coi như chưa biết; cấp ở giữa để trống.
export function priorFor(lv: number, est: number): [number, number] | null {
  if (lv <= est - 1) return [6, 0.5];
  if (lv >= est + 1) return [1, 3];
  return null;
}

export const cefrIdx = (c: Cefr | null): number => (c ? CEFRS.indexOf(c) : 0);
export const cefrOf = (lv: number): Cefr => CEFRS[Math.max(0, Math.min(5, Math.round(lv)))]!;
// Band IELTS tiêu biểu của một cấp CEFR (giữa khoảng trong bảng quy đổi của app; A1/A2 dưới thang IELTS chính thức).
export const BAND_OF: Record<Cefr, number> = { A1: 2.5, A2: 3.5, B1: 4.5, B2: 6, C1: 7.5, C2: 8.5 };
