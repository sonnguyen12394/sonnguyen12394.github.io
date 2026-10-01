// Tiến độ phần ôn thi: nằm trong bản lưu chung của app (st.x), nên sao lưu bằng mã/file và đồng bộ nhiều máy tự có.
// Có số phiên bản riêng (X_V) và hàm nâng cấp: không bao giờ bỏ tiến độ cũ khi cập nhật (yêu cầu 10.2).
// Dữ liệu nạp từ ngoài (mã sao lưu, máy chủ đồng bộ) là không tin cậy: sanitize chỉ giữ khoá đúng kiểu.

import type { ExamId } from './scales.ts';
import type { Card } from './fsrs.ts';

export const X_V = 1;

export interface Attempt {
  id: string;            // id bài (đề thi thử, bộ luyện, bài kiểm tra đầu vào)
  kind: 'place' | 'mock' | 'set';
  exam: ExamId;
  day: number;           // ngày làm (số ngày từ 1/1/1970)
  skill: 'L' | 'R' | 'W' | 'S';
  correct: number;
  total: number;
  band: number;          // band IELTS ước tính (hoặc điểm VSTEP quy ra band)
  se?: number;           // sai số chuẩn khi có
  secs: number;          // thời gian làm
  wrong: string[];       // id các câu sai
}

export interface NbEntry extends Card {
  id: string;            // id câu
  qt: string;            // dạng câu hỏi
  tag?: string;          // nhóm lỗi (ngữ pháp, chính tả, bẫy đồng nghĩa…)
  ok: number;            // số lần làm lại đúng liên tiếp
}

export interface RealScore {
  exam: ExamId;
  day: number;
  L: number | null; R: number | null; W: number | null; S: number | null;
}

export interface XState {
  v: number;
  exam: ExamId | '';
  target: number | null;      // band mục tiêu (VSTEP: điểm trung bình mục tiêu)
  date: number | null;        // ngày thi (số ngày)
  mins: number;               // phút học mỗi ngày
  attempts: Attempt[];
  nb: Record<string, NbEntry>;
  real: RealScore[];
  share: boolean;             // đồng ý gửi thống kê ẩn danh (mặc định không)
}

export const EXAMS: ExamId[] = ['ielts-ac', 'ielts-gt', 'vstep'];
export const ATTEMPT_MAX = 400;

export function freshX(): XState {
  return { v: X_V, exam: '', target: null, date: null, mins: 30, attempts: [], nb: {}, real: [], share: false };
}

const obj = (v: unknown): Record<string, unknown> => (v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {});
const num = (v: unknown, lo: number, hi: number, d: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : d);
const numOrNull = (v: unknown, lo: number, hi: number): number | null => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : null);
const idOk = (v: unknown): v is string => typeof v === 'string' && /^[a-z0-9][a-z0-9._-]{0,63}$/i.test(v);
const exam = (v: unknown): ExamId | '' => (EXAMS as string[]).includes(v as string) ? (v as ExamId) : '';
const skill = (v: unknown): Attempt['skill'] => (['L', 'R', 'W', 'S'].includes(v as string) ? (v as Attempt['skill']) : 'R');

// Nâng cấp từ các phiên bản cũ của st.x. Mỗi bước một khối, giống migrate() của app.
export function migrateX(raw: unknown): XState {
  const x = obj(raw);
  if (typeof x.v !== 'number') return freshX();
  // (chưa có bản cũ hơn X_V = 1)
  return sanitizeX(x);
}

export function sanitizeX(raw: unknown): XState {
  const x = obj(raw), out = freshX();
  out.exam = exam(x.exam);
  out.target = numOrNull(x.target, 0, 10);
  out.date = numOrNull(x.date, 0, 1e6);
  if (out.date !== null) out.date = Math.round(out.date);
  out.mins = Math.round(num(x.mins, 5, 600, 30));
  out.share = x.share === true;
  out.attempts = (Array.isArray(x.attempts) ? x.attempts : []).map(obj).filter(a => idOk(a.id) && exam(a.exam)).slice(-ATTEMPT_MAX).map(a => {
    const total = Math.round(num(a.total, 1, 1000, 1));
    const at: Attempt = {
      id: a.id as string, kind: a.kind === 'place' || a.kind === 'mock' ? a.kind : 'set', exam: exam(a.exam) as ExamId,
      day: Math.round(num(a.day, 0, 1e6, 0)), skill: skill(a.skill), correct: Math.round(num(a.correct, 0, total, 0)), total,
      band: num(a.band, 0, 10, 0), secs: Math.round(num(a.secs, 0, 1e6, 0)),
      wrong: (Array.isArray(a.wrong) ? a.wrong : []).filter(idOk).slice(0, 200),
    };
    const se = numOrNull(a.se, 0, 9);
    if (se !== null) at.se = se;
    return at;
  });
  for (const [k, v0] of Object.entries(obj(x.nb))) {
    const v = obj(v0);
    if (!idOk(k)) continue;
    const e: NbEntry = {
      id: k, qt: typeof v.qt === 'string' ? v.qt.slice(0, 24) : '',
      s: num(v.s, 0.1, 36500, 0.4), d: num(v.d, 1, 10, 5), last: Math.round(num(v.last, 0, 1e6, 0)), due: Math.round(num(v.due, 0, 1e6, 0)),
      reps: Math.round(num(v.reps, 0, 1e5, 0)), lapses: Math.round(num(v.lapses, 0, 1e5, 0)), ok: Math.round(num(v.ok, 0, 1e5, 0)),
    };
    if (typeof v.tag === 'string' && v.tag.length <= 24) e.tag = v.tag;
    out.nb[k] = e;
  }
  out.real = (Array.isArray(x.real) ? x.real : []).map(obj).filter(r => exam(r.exam)).slice(-20).map(r => ({
    exam: exam(r.exam) as ExamId, day: Math.round(num(r.day, 0, 1e6, 0)),
    L: numOrNull(r.L, 0, 10), R: numOrNull(r.R, 0, 10), W: numOrNull(r.W, 0, 10), S: numOrNull(r.S, 0, 10),
  }));
  return out;
}

// Gộp hai máy: lịch sử làm bài lấy hợp (bỏ trùng), sổ lỗi giữ bản ôn gần hơn, cài đặt lấy của máy đang dùng (a).
export function mergeX(a0: unknown, b0: unknown): XState {
  const a = migrateX(a0), b = migrateX(b0);
  const key = (t: Attempt): string => `${t.id}|${t.day}|${t.skill}|${t.correct}|${t.secs}`;
  const seen = new Set<string>();
  const attempts = [...a.attempts, ...b.attempts].filter(t => (seen.has(key(t)) ? false : (seen.add(key(t)), true)))
    .sort((p, q) => p.day - q.day).slice(-ATTEMPT_MAX);
  const nb: Record<string, NbEntry> = { ...b.nb };
  for (const [k, e] of Object.entries(a.nb)) { const o = nb[k]; if (!o || e.last >= o.last) nb[k] = e; }
  const rs = new Set<string>();
  const real = [...a.real, ...b.real].filter(r => { const k = JSON.stringify(r); return rs.has(k) ? false : (rs.add(k), true); }).slice(-20);
  return {
    ...a,
    exam: a.exam || b.exam, target: a.target ?? b.target, date: a.date ?? b.date,
    share: a.share, attempts, nb, real,   // đồng ý gửi thống kê là của từng máy
  };
}
