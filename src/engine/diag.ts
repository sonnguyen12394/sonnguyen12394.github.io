// Chẩn đoán dò đồ thị (docs/SPEC.md, Quyết định kỹ thuật §7). Thuần hàm để test được.
// Hai "cầu thang" riêng cho từ vựng (nút u:) và ngữ pháp (nút g:): bắt đầu ở cấp ước tính (từ bài kiểm tra Nghe/Đọc nếu có,
// không thì A1), dò một nút ở cấp đó (nút có nhiều năng lực mục tiêu phụ thuộc nhất), đạt → lên nửa cấp, trượt → xuống nửa cấp
// (xuống là dò tiền đề: truy gốc rễ, spec mục 15). Dừng khi đủ số lượt, đã hội tụ (≥ 2 lần đổi chiều mỗi cầu thang) hoặc hết giờ.
// Kết thúc: nút cấp dưới mức ước tính coi như đã biết, nút cấp trên coi như chưa biết (tiên nghiệm, chỉ cho ô chưa có bằng chứng thật).

import type { Cefr } from './types.ts';
import { CEFRS } from './types.ts';

export type Kind = 'u' | 'g';
export interface Cand { id: string; kind: Kind; lv: number; weight: number }   // lv = chỉ số CEFR 0–5; weight = số nút mục tiêu phụ thuộc
export interface Stair { est: number; dir: 0 | 1 | -1; rev: number; n: number; seen: number[]; up?: number }   // up: cấp dò nhận ra kế tiếp (v71)
export interface DiagState {
  t0: number;                   // ms lúc bắt đầu
  stair: Record<Kind, Stair>;
  probed: string[];             // id nút đã dò
  turn: Kind;
  results: Array<{ id: string; kind: Kind; lv: number; got: number; of: number }>;
  max?: number;                 // số nút dò tối đa (bài dò ngắn cho người mới: QUICK_PROBES)
}

export const MAX_PROBES = 16, MAX_MS = 20 * 60 * 1000, MIN_PER_KIND = 5, QUICK_PROBES = 8;

export function startDiag(startLv: number, now: number, max: number = MAX_PROBES): DiagState {
  const s = (): Stair => ({ est: Math.max(0, Math.min(5, startLv)), dir: 0, rev: 0, n: 0, seen: [] });
  return { t0: now, stair: { u: s(), g: s() }, probed: [], turn: 'u', results: [], ...(max !== MAX_PROBES ? { max } : {}) };
}

// Nút dò tiếp theo cho lượt hiện tại: cùng loại, cấp gần mức ước tính nhất, chưa dò, nhiều năng lực mục tiêu phụ thuộc nhất.
export function nextProbe(d: DiagState, cands: Cand[]): Cand | null {
  for (const kind of [d.turn, d.turn === 'u' ? 'g' : 'u'] as Kind[]) {
    const lv = d.stair[kind].up ?? Math.round(d.stair[kind].est), done = new Set(d.probed);
    const pool = cands.filter(c => c.kind === kind && !done.has(c.id));
    if (!pool.length) continue;
    pool.sort((a, b) => Math.abs(a.lv - lv) - Math.abs(b.lv - lv) || b.weight - a.weight || (a.id < b.id ? -1 : 1));
    return pool[0]!;
  }
  return null;
}

// Ghi kết quả một nút: đạt khi đúng ≥ 2/3, trượt khi ≤ 1/3, ở giữa thì giữ nguyên cầu thang.
// v71 (bot L03): `rec` = các câu chọn của nút đúng ≥ 2/3 (đã trừ đoán mò). Ở giữa mà nhận ra tốt (người học nhận ra tốt hơn tự nhớ ra)
// → nút kế tiếp của loại này dò cao hơn một cấp để tìm trần NHẬN RA; trước đây cầu thang đứng yên ở cấp đó tới hết bài dò ngắn nên người
// học B1 bị xếp từ vựng A1–A2 và phải luyện lại phần đã biết. Câu dò trên mức ước tính mà trượt không kéo ước tính xuống.
export function answer(d: DiagState, c: Cand, got: number, of: number, rec = false): void {
  d.probed.push(c.id);
  d.results.push({ id: c.id, kind: c.kind, lv: c.lv, got, of });
  const s = d.stair[c.kind], r = of ? got / of : 0, dir: 0 | 1 | -1 = r >= 2 / 3 ? 1 : r <= 1 / 3 ? -1 : 0;
  const peek = s.up !== undefined && c.lv > Math.round(s.est);   // câu dò trần nhận ra (trên mức ước tính)
  s.n++; s.seen.push(peek ? Math.round(s.est) : c.lv);
  delete s.up;
  if (!dir && rec && c.lv < 5) s.up = c.lv + 1;
  if (peek && dir === -1) { d.turn = c.kind === 'u' ? 'g' : 'u'; return; }
  if (dir) {
    if (s.dir && dir !== s.dir) s.rev++;
    s.dir = dir;
    s.est = Math.max(0, Math.min(5, s.est + dir * 0.5));
  }
  d.turn = c.kind === 'u' ? 'g' : 'u';
}

// Tỉ lệ đúng đã trừ đoán mò (v69): r' = (r − ḡ) / (1 − ḡ), ḡ = xác suất đoán trúng trung bình của các câu (0 với câu tự gõ).
export function guessCorrected(got: number, of: number, gsum = 0): number {
  if (!of) return 0;
  const g = Math.min(0.95, gsum / of);
  return Math.max(0, Math.min(1, (got / of - g) / (1 - g)));
}

// v71 (bot L03): cấp NHẬN RA của một loại (từ vựng / ngữ pháp) = cấp cao nhất mà câu chọn (đã trừ đoán mò) đúng ≥ 2/3. Người học trung
// bình thường nhận ra tốt hơn tự nhớ ra; cấp chung của bài dò (tính cả câu tự gõ) vì vậy thấp hơn — dùng cấp nhận ra để không bắt học lại
// phần nhận ra đã vững (chỉ tiên nghiệm mức 1–2; mức 3 trở lên vẫn cần bằng chứng).
export function recognitionLevel(rs: Array<{ kind: Kind; lv: number; rc: number }>, kind: Kind): number | null {
  const ok = rs.filter(r => r.kind === kind && r.rc >= 2 / 3).map(r => r.lv);
  return ok.length ? Math.max(...ok) : null;
}

export function finished(d: DiagState, now: number, left: number): boolean {
  const max = d.max ?? MAX_PROBES;
  // Bài dò ngắn: hết 8 phần mà một cầu thang vẫn đang lên (chưa đổi chiều lần nào) hoặc đang dò trần nhận ra → dò tiếp tới tối đa
  // MAX_PROBES (v71: người học trung bình / khá không bị chặn ở A2 chỉ vì bài dò ngắn bắt đầu từ A1).
  const rising = (s: Stair) => s.up !== undefined || (s.dir === 1 && s.rev === 0);
  if (left === 0 || now - d.t0 >= MAX_MS || d.probed.length >= MAX_PROBES) return true;
  if (d.probed.length >= max && !(max < MAX_PROBES && (rising(d.stair.u) || rising(d.stair.g)))) return true;
  const ok = (s: Stair) => s.n >= Math.min(MIN_PER_KIND, Math.floor(max / 2)) && s.rev >= 2;
  return ok(d.stair.u) && ok(d.stair.g);
}

// Cấp ước tính cuối của một cầu thang: trung bình 4 cấp dò gần nhất (ổn định hơn một điểm cuối), lấy cả mức ước tính hiện tại.
export function level(s: Stair): number {
  const last = [...s.seen.slice(-4), s.est];
  return Math.round((last.reduce((a, b) => a + b, 0) / last.length) * 2) / 2;
}

// Tiên nghiệm sau chẩn đoán: cấp ≤ mức ước tính − 0,5 (người học đã qua câu dò ở cấp đó) coi như đã biết, cấp ≥ mức ước tính + 1 coi
// như chưa biết; cấp đúng bằng mức ước tính (cầu thang còn dao động ở đó) để trống. v56: trước đây chỉ coi cấp ≤ ước tính − 1 là đã biết,
// nên cấp người học vừa chứng minh trong bài dò vẫn phải học lại (mô phỏng: lộ trình thích ứng không nhanh hơn giáo trình cố định).
// "Đã biết" ở đây là Claim (trạng thái inferred, tin cậy thấp): không tính vào Readiness, tự mở lại khi sai ở câu mới.
export function priorFor(lv: number, est: number): [number, number] | null {
  if (lv <= est - 0.5) return [6, 0.5];
  if (lv >= est + 1) return [1, 3];
  return null;
}

export const cefrIdx = (c: Cefr | null): number => (c ? CEFRS.indexOf(c) : 0);
export const cefrOf = (lv: number): Cefr => CEFRS[Math.max(0, Math.min(5, Math.round(lv)))]!;
// Band IELTS tiêu biểu của một cấp CEFR (giữa khoảng trong bảng quy đổi của app; A1/A2 dưới thang IELTS chính thức).
export const BAND_OF: Record<Cefr, number> = { A1: 2.5, A2: 3.5, B1: 4.5, B2: 6, C1: 7.5, C2: 8.5 };

// Goal-first (v64): mục tiêu tự đặt sau chẩn đoán = cấp CEFR kế tiếp của phần yếu nhất. Cấp đã biết của một cầu thang là cấp
// ≤ ước tính − 0,5 (như priorFor); Nghe/Đọc từ bài kiểm tra đầu vào là cấp đã làm được. Chưa biết gì → A1.
export function autoGoal(u: number, g: number, lr: Array<Cefr | null> = []): string {
  const next = (est: number) => Math.floor(est - 0.5) + 1;
  const idx = Math.min(next(u), next(g), ...lr.filter((c): c is Cefr => !!c).map(c => CEFRS.indexOf(c) + 1));
  return `cefr-${CEFRS[Math.max(0, Math.min(5, idx))]!.toLowerCase()}`;
}
// Người dùng cũ chưa có mục tiêu: cấp kế tiếp của cấp đang học (unit hiện tại) — đang học ở cấp đó thì mục tiêu là chính cấp đó.
export const goalOfLevel = (cefr: Cefr): string => `cefr-${cefr.toLowerCase()}`;
