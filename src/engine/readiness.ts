// Goal Readiness và Goal Achieved (docs/SPEC.md §8). Thuần hàm để test được.
// Thi (IELTS, VSTEP): Nghe/Đọc từ IRT (src/exam/estimate.ts) + điểm thật gần đây; Viết/Nói từ người chấm (grader.ts);
// tổng = mô phỏng 4 kỹ năng theo đúng cách tính điểm của kỳ thi → xác suất đạt mục tiêu; sẵn sàng khi ≥ 80%.
// Achieved của kỳ thi chỉ bằng điểm thi thật.
// CEFR, giao tiếp: tỉ lệ năng lực cần đã Đạt với tin cậy ≥ Vừa + bài làm thật đã qua; Achieved = mọi thứ Đạt và
// không quên khi ôn trong 14 ngày (không có kỳ thi ngoài để đối chiếu).

import { skillEstimate } from '../exam/estimate.ts';
import { bandToVstep, ieltsOverall, roundHalf, vstepLevel, type ExamId } from '../exam/scales.ts';
import type { RealScore, Resp, XState } from '../exam/state.ts';
import { confOf, realBand, toBand, wsDist, SD_BY, WINDOW, type Conf, type Dist, type RawGrade } from './grader.ts';
import type { Goal, Req } from './types.ts';

export type SkillK = 'L' | 'R' | 'W' | 'S';
export const SKILLS: SkillK[] = ['L', 'R', 'W', 'S'];
export const READY_P = 0.8;
export const SIMS = 4000;
const CONF_RANK: Record<Conf, number> = { low: 0, mid: 1, high: 2 };

// Nghe/Đọc: ước tính IRT (≥ 8 câu trong 90 ngày) gộp nghịch phương sai với điểm thật gần đây.
export function lrDist(resp: Resp[], real: RealScore[], skill: 'L' | 'R', today: number): Dist | null {
  const pick: Array<{ band: number; sd: number; src: string }> = [];
  const est = skillEstimate({ resp } as unknown as XState, skill, today);
  if (est.theta !== null && est.se !== null) pick.push({ band: est.theta, sd: Math.max(0.15, est.se), src: 'irt' });
  for (const r of real) {
    const v = r[skill];
    if (v !== null && v !== undefined && today - r.day <= WINDOW) pick.push({ band: realBand(r.exam, v), sd: SD_BY.real, src: 'real' });
  }
  if (!pick.length) return null;
  const wsum = pick.reduce((s, x) => s + 1 / (x.sd * x.sd), 0);
  const mean = pick.reduce((s, x) => s + x.band / (x.sd * x.sd), 0) / wsum, se = Math.sqrt(1 / wsum);
  return { mean, se, n: est.n + pick.filter(x => x.src === 'real').length, conf: confOf(se), src: [...new Set(pick.map(x => x.src))] };
}

export function skillDists(resp: Resp[], grades: RawGrade[], real: RealScore[], today: number): Record<SkillK, Dist | null> {
  return { L: lrDist(resp, real, 'L', today), R: lrDist(resp, real, 'R', today), W: wsDist(grades, real, 'W', today), S: wsDist(grades, real, 'S', today) };
}

// Ngưỡng của mục tiêu trên thang kỳ thi: IELTS = band tổng; VSTEP = điểm trung bình 4 kỹ năng (Quyết định 729).
const VSTEP_MIN: Record<string, number> = { B1: 4, B2: 6, C1: 8.5 };
export const examOf = (g: Goal): ExamId | null => (g.kind === 'ielts-ac' || g.kind === 'ielts-gt' || g.kind === 'vstep' ? g.kind : null);
export function needOf(g: Goal): { overall: number; band: number } {
  if (g.kind === 'vstep') { const t = VSTEP_MIN[g.target] ?? 4; return { overall: t, band: toBand(t, 'vstep') }; }
  const t = Number(g.target); return { overall: t, band: t };
}

// Bộ sinh số giả ngẫu nhiên có hạt giống: cùng dữ liệu → cùng con số (không nhảy mỗi lần mở màn).
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function gauss(r: () => number): number {
  const u = Math.max(1e-12, r()), v = r();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}
// P(X ≥ x) với X ~ N(m, s)
function pAtLeast(m: number, s: number, x: number): number {
  const z = (x - m) / (s * Math.SQRT2), t = 1 / (1 + 0.3275911 * Math.abs(z));
  const erf = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-z * z);
  return 0.5 * (1 - (z >= 0 ? erf : -erf));
}

export interface SkillReady { k: SkillK; dist: Dist | null; p: number | null }
export interface ExamReady {
  kind: 'exam';
  exam: ExamId;
  need: number;                 // ngưỡng trên thang kỳ thi
  p: number | null;             // P(đạt), null khi còn kỹ năng chưa có dữ liệu
  lo: number | null; hi: number | null; mid: number | null;   // khoảng 80% và trung vị điểm tổng (thang kỳ thi)
  skills: SkillReady[];
  missing: SkillK[];
  conf: Conf;
  ready: boolean;
  achieved: { day: number; score: number } | null;
}

export function overallOf(exam: ExamId, bands: number[]): number {
  return exam === 'vstep' ? vstepLevel(bands.map(b => bandToVstep(b))).mean : ieltsOverall(bands.map(b => roundHalf(b)));
}

export function examReadiness(g: Goal, dists: Record<SkillK, Dist | null>, real: RealScore[]): ExamReady {
  const exam = examOf(g)!, need = needOf(g);
  const skills = SKILLS.map(k => { const d = dists[k]; return { k, dist: d, p: d ? pAtLeast(d.mean, d.se, need.band - 0.25) : null }; });
  const missing = skills.filter(s => !s.dist).map(s => s.k);
  const done = real.filter(r => r.exam === exam && SKILLS.every(k => r[k] !== null && r[k] !== undefined))
    .map(r => ({ day: r.day, score: overallOf(exam, SKILLS.map(k => realBand(exam, r[k]!))) }))
    .filter(r => r.score >= need.overall).sort((a, b) => b.day - a.day)[0] ?? null;
  const conf = missing.length ? 'low' : skills.reduce<Conf>((c, s) => (CONF_RANK[s.dist!.conf] < CONF_RANK[c] ? s.dist!.conf : c), 'high');
  if (missing.length) return { kind: 'exam', exam, need: need.overall, p: null, lo: null, hi: null, mid: null, skills, missing, conf, ready: false, achieved: done };
  const r = rng(Math.round(SKILLS.reduce((s, k) => s + dists[k]!.mean * 1000 + dists[k]!.se * 100, 0)));
  const outs: number[] = [];
  let ok = 0;
  for (let i = 0; i < SIMS; i++) {
    const bands = SKILLS.map(k => Math.max(0, Math.min(9, dists[k]!.mean + dists[k]!.se * gauss(r))));
    const o = overallOf(exam, bands);
    outs.push(o);
    if (o >= need.overall) ok++;
  }
  outs.sort((a, b) => a - b);
  const q = (x: number): number => outs[Math.min(outs.length - 1, Math.floor(x * outs.length))]!;
  const p = ok / SIMS;
  return { kind: 'exam', exam, need: need.overall, p, lo: q(0.1), hi: q(0.9), mid: q(0.5), skills, missing, conf, ready: p >= READY_P, achieved: done };
}

export interface MasteryReady {
  kind: 'mastery';
  p: number;
  done: number; total: number;          // năng lực (không kể bài làm thật) đã Đạt với tin cậy ≥ Vừa
  perfDone: number; perfTotal: number;  // bài làm thật đã qua
  ready: boolean;
  lapse: boolean;                       // có quên khi ôn trong 14 ngày qua
  achieved: boolean;
  xfer?: { important: number; ok: number; exempt: number };   // v65: năng lực quan trọng đã đúng ở câu mới / được miễn (hết câu mới)
}

// v65 (quyết định 08/10, C184): Đạt CEFR cần mọi năng lực quan trọng cho transfer đã đúng ở câu mới; nút đã hết câu mới được miễn.
export function masteryReadiness(req: Req[], stat: (r: Req) => { pass: boolean; conf: Conf }, lastLapse: number | null, today: number, xfer?: { important: number; ok: number; exempt: number }): MasteryReady {
  const perf = req.filter(r => r.type === 'performance'), base = req.filter(r => r.type !== 'performance');
  const done = base.filter(r => { const s = stat(r); return s.pass && s.conf !== 'low'; }).length;
  const perfDone = perf.filter(r => stat(r).pass).length;
  const total = base.length, all = total + perf.length;
  const xferOk = !xfer || xfer.ok + xfer.exempt >= xfer.important;
  const ready = done === total && perfDone === perf.length && xferOk;
  const lapse = lastLapse !== null && today - lastLapse < 14;
  return { kind: 'mastery', p: all ? (done + perfDone) / all : 0, done, total, perfDone, perfTotal: perf.length, ready, lapse, achieved: ready && !lapse, ...(xfer ? { xfer } : {}) };
}

// v67 (C5, C197, C198): Readiness theo mô hình đăng ký. Mỗi mục tiêu khai `readiness` trong dữ liệu; engine lấy mô hình tương ứng.
// Thêm loại mục tiêu mới = thêm dữ liệu (dùng mô hình có sẵn) hoặc đăng ký một mô hình mới, không sửa lõi.
export interface ReadyIn {
  mastery: (r: Req) => { pass: boolean; conf: Conf };
  lapse: number | null;
  today: number;
  xfer?: () => { important: number; ok: number; exempt: number } | undefined;
  exam?: () => { dists: Record<SkillK, Dist | null>; real: RealScore[] };
}
export interface ReadinessModel { id: NonNullable<Goal['readiness']>; run(g: Goal, x: ReadyIn): ExamReady | MasteryReady }
export const READINESS_MODELS: Record<NonNullable<Goal['readiness']>, ReadinessModel> = {
  mastery: { id: 'mastery', run: (g, x) => masteryReadiness(g.req, x.mastery, x.lapse, x.today, x.xfer?.()) },
  'exam-score': { id: 'exam-score', run: (g, x) => { const d = x.exam!(); return examReadiness(g, d.dists, d.real); } },
};
export const readinessFor = (g: Goal, x: ReadyIn): ExamReady | MasteryReady => READINESS_MODELS[g.readiness ?? 'mastery'].run(g, x);
