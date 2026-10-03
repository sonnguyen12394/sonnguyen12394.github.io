// Người chấm Viết/Nói (docs/SPEC.md §10): một giao diện chung cho máy chấm luật, tự chấm và (sau này) AI.
// Mỗi lần chấm là một Grade có điểm quy về band IELTS (0–9) kèm độ lệch chuẩn theo loại người chấm;
// ước tính kỹ năng = trung bình có trọng số nghịch phương sai các lần chấm gần đây.
// Tự chấm được trừ độ lệch so với điểm thi thật (khi có cặp đối chiếu); chưa có AI hoặc cặp điểm thật thì
// sai số không xuống dưới mức "tin cậy vừa" (Giới hạn thực tế #3).

import { bandToVstep, roundHalf, vstepToBand, type ExamId } from '../exam/scales.ts';
import type { RealScore } from '../exam/state.ts';

export type GradeBy = 'rule' | 'self' | 'ai';
export type Scale = 'band' | 'vstep' | 'cefr';     // cefr: chỉ số 0–5 liên tục (A1 = 0 … C2 = 5), như perfEst
export interface RawGrade {
  by: GradeBy;
  skill: 'W' | 'S';
  day: number;
  v: number;
  scale: Scale;
  crit?: number[];       // điểm từng tiêu chí (nếu người chấm có), chỉ để hiển thị
  src?: string;          // bài nào (để hiển thị)
}
export interface Grade extends RawGrade { band: number; sd: number }
export type Conf = 'low' | 'mid' | 'high';
export interface Dist { mean: number; se: number; n: number; conf: Conf; src: string[] }

// Độ lệch chuẩn (band) mỗi loại người chấm: luật chỉ thấy hình thức (độ dài, từ, câu); tự chấm theo bài mẫu sát hơn;
// AI sát hơn nữa; điểm thi thật gần như chắc.
export const SD_BY: Record<GradeBy | 'real', number> = { rule: 1.0, self: 0.8, ai: 0.5, real: 0.25 };
export const WINDOW = 120;          // ngày
export const LAST = 6;              // số lần chấm gần nhất mỗi loại
export const SE_FLOOR_MID = 0.45;   // chưa có AI/cặp điểm thật: sai số không nhỏ hơn mức này → tin cậy tối đa Vừa
export const SE_FLOOR = 0.25;

const CEFR_PTS: Array<[number, number]> = [[0, 2.5], [1, 3.5], [2, 4.5], [3, 6], [4, 7.25], [5, 8.5]];
export function cefrToBand(p: number): number {
  const x = Math.max(0, Math.min(5, p));
  for (let i = 1; i < CEFR_PTS.length; i++) {
    const [x1, y1] = CEFR_PTS[i]!, [x0, y0] = CEFR_PTS[i - 1]!;
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return 8.5;
}
// vstepToBand làm tròn 0,5; ở đây cần liên tục để trung bình không lệch, nên nội suy trên chính bảng đó.
export function toBand(v: number, scale: Scale): number {
  if (scale === 'band') return Math.max(0, Math.min(9, v));
  if (scale === 'cefr') return cefrToBand(v);
  const lo = Math.floor(v * 2) / 2, hi = lo + 0.5, a = vstepToBand(lo), b = vstepToBand(Math.min(10, hi));
  return a + (b - a) * ((v - lo) / 0.5);
}
export const realBand = (exam: ExamId, v: number): number => (exam === 'vstep' ? toBand(v, 'vstep') : v);
export const confOf = (se: number): Conf => (se <= 0.3 ? 'high' : se <= 0.6 ? 'mid' : 'low');

// Độ lệch tự chấm: với mỗi điểm thật Viết/Nói, lấy trung bình tự chấm trong 30 ngày trước đó; độ lệch = tự chấm − thật.
export interface Bias { bias: number; n: number }
export function selfBias(grades: RawGrade[], real: RealScore[], skill: 'W' | 'S'): Bias {
  const diffs: number[] = [];
  for (const r of real) {
    const v = r[skill];
    if (v === null || v === undefined) continue;
    const near = grades.filter(g => g.by === 'self' && g.skill === skill && g.day <= r.day && r.day - g.day <= 30);
    if (!near.length) continue;
    const self = near.reduce((s, g) => s + toBand(g.v, g.scale), 0) / near.length;
    diffs.push(self - realBand(r.exam, v));
  }
  return { bias: diffs.length ? diffs.reduce((s, x) => s + x, 0) / diffs.length : 0, n: diffs.length };
}

// Chuẩn hoá các lần chấm: quy về band, trừ độ lệch tự chấm (co về 0 khi ít cặp: bias·n/(n+1)).
export function normalize(grades: RawGrade[], bias: Bias): Grade[] {
  const k = bias.n / (bias.n + 1);
  return grades.map(g => {
    let band = toBand(g.v, g.scale);
    if (g.by === 'self') band -= bias.bias * k;
    return { ...g, band: Math.max(0, Math.min(9, band)), sd: SD_BY[g.by] };
  });
}

// Ước tính một kỹ năng Viết/Nói. null khi chưa có lần chấm nào trong cửa sổ.
export function wsDist(grades: RawGrade[], real: RealScore[], skill: 'W' | 'S', today: number): Dist | null {
  const bias = selfBias(grades, real, skill);
  const recent = normalize(grades.filter(g => g.skill === skill && today - g.day <= WINDOW && g.day <= today), bias);
  const pick: Array<{ band: number; sd: number; src: string }> = [];
  for (const by of ['rule', 'self', 'ai'] as const) {
    for (const g of recent.filter(x => x.by === by).sort((a, b) => b.day - a.day).slice(0, LAST)) pick.push({ band: g.band, sd: g.sd, src: by });
  }
  for (const r of real) {
    const v = r[skill];
    if (v !== null && v !== undefined && today - r.day <= WINDOW) pick.push({ band: realBand(r.exam, v), sd: SD_BY.real, src: 'real' });
  }
  if (!pick.length) return null;
  const wsum = pick.reduce((s, x) => s + 1 / (x.sd * x.sd), 0);
  const mean = pick.reduce((s, x) => s + x.band / (x.sd * x.sd), 0) / wsum;
  const strong = bias.n > 0 || pick.some(x => x.src === 'ai' || x.src === 'real');
  const se = Math.max(strong ? SE_FLOOR : SE_FLOOR_MID, Math.sqrt(1 / wsum));
  return { mean, se, n: pick.length, conf: confOf(se), src: [...new Set(pick.map(x => x.src))] };
}

export const fmtBand = (b: number): string => String(roundHalf(b)).replace('.', ',');
export const fmtVstep = (b: number): string => String(bandToVstep(b)).replace('.', ',');
