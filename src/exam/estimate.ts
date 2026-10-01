// Ước tính band từng kỹ năng từ các câu đã làm (yêu cầu 1.3, 2.3, 5.3).
// Nghe, Đọc: mô hình 3PL trên các câu gần đây (≤ 120 câu, ≤ 90 ngày), có sai số chuẩn.
// Viết, Nói: lấy từ phần ước tính bằng luật + tự chấm đã hiệu chỉnh (giai đoạn 7), sai số công bố ±1 band.

import { estimate, margin, bandOf, type Response } from './irt.ts';
import { bandToCefr, bandToVstep, ieltsOverall, vstepLevel, type Cefr } from './scales.ts';
import type { XState, Resp } from './state.ts';

export const WINDOW_DAYS = 90;
export const WINDOW_N = 120;
export const MIN_N = 8;          // ít hơn thì chưa đưa ra con số

export interface SkillEst {
  skill: 'L' | 'R' | 'W' | 'S';
  n: number;
  band: number | null;          // làm tròn 0,5
  theta: number | null;         // chưa làm tròn
  se: number | null;
  pm: number | null;            // khoảng ± hiển thị (band)
  cefr: Cefr | null;
  vstep: number | null;         // điểm VSTEP tương ứng (thang 10)
}

export function recent(resp: Resp[], skill: 'L' | 'R', today: number, hidden: Set<string> = new Set()): Resp[] {
  return resp.filter(r => r.s === skill && today - r.d <= WINDOW_DAYS && !hidden.has(r.i)).slice(-WINDOW_N);
}

export function skillEstimate(x: XState, skill: 'L' | 'R', today: number, hidden?: Set<string>, params?: (id: string) => { b: number; g: number } | undefined): SkillEst {
  const rs = recent(x.resp, skill, today, hidden);
  if (rs.length < MIN_N) return { skill, n: rs.length, band: null, theta: null, se: null, pm: null, cefr: null, vstep: null };
  const resp: Response[] = rs.map(r => { const p = params?.(r.i); return { item: { b: p?.b ?? r.b, c: p?.g ?? r.g }, correct: r.c === 1 }; });
  const e = estimate(resp);
  const band = bandOf(e.theta);
  return { skill, n: rs.length, band, theta: e.theta, se: e.se, pm: margin(e.se), cefr: bandToCefr(band), vstep: bandToVstep(band) };
}

export interface Profile {
  L: SkillEst; R: SkillEst; W: SkillEst; S: SkillEst;
  overall: number | null;              // IELTS: điểm tổng khi đủ 4 kỹ năng
  vstep: ReturnType<typeof vstepLevel> | null;
}

const none = (skill: 'W' | 'S'): SkillEst => ({ skill, n: 0, band: null, theta: null, se: null, pm: null, cefr: null, vstep: null });

export function profile(x: XState, today: number, hidden?: Set<string>, params?: (id: string) => { b: number; g: number } | undefined, ws?: { W?: SkillEst; S?: SkillEst }): Profile {
  const L = skillEstimate(x, 'L', today, hidden, params), R = skillEstimate(x, 'R', today, hidden, params);
  const W = ws?.W ?? none('W'), S = ws?.S ?? none('S');
  const all = [L, R, W, S];
  const full = all.every(s => s.band !== null);
  return {
    L, R, W, S,
    overall: full ? ieltsOverall(all.map(s => s.band!)) : null,
    vstep: full ? vstepLevel(all.map(s => s.vstep!)) : null,
  };
}

// Kỹ năng xa mục tiêu nhất (để xếp kế hoạch): band mục tiêu − band ước tính; chưa có ước tính coi như xa nhất.
// Mục tiêu VSTEP được quy ra band (vstepToBand) trước khi gọi.
export function gaps(p: Profile, targetBand: number): Array<{ skill: 'L' | 'R' | 'W' | 'S'; gap: number }> {
  return (['L', 'R', 'W', 'S'] as const).map(k => ({ skill: k, gap: p[k].band === null ? 99 : targetBand - p[k].band! })).sort((a, b) => b.gap - a.gap);
}
