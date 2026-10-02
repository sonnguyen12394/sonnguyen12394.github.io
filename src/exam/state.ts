// Tiến độ phần ôn thi: nằm trong bản lưu chung của app (st.x), nên sao lưu bằng mã/file và đồng bộ nhiều máy tự có.
// Có số phiên bản riêng (X_V) và hàm nâng cấp: không bao giờ bỏ tiến độ cũ khi cập nhật (yêu cầu 10.2).
// Dữ liệu nạp từ ngoài (mã sao lưu, máy chủ đồng bộ) là không tin cậy: sanitize chỉ giữ khoá đúng kiểu.

import type { ExamId } from './scales.ts';
import type { Card } from './fsrs.ts';

export const X_V = 3;

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

// Một câu đã trả lời (để ước tính band từng kỹ năng). b, g lưu kèm phòng khi câu bị gỡ khỏi kho.
export interface Resp {
  i: string;             // id câu
  c: 0 | 1;              // đúng/sai
  d: number;             // ngày
  s: 'L' | 'R';
  b: number;             // độ khó (band) lúc làm
  g: number;             // xác suất đoán mò
}

export interface Consent {
  on: boolean;           // đồng ý gửi thống kê ẩn danh
  adult: boolean;        // từ 16 tuổi trở lên
  parent: boolean;       // dưới 16: cha mẹ/người giám hộ đã đồng ý
  day: number;           // ngày đồng ý (hoặc rút lại)
}

// Đề thi thử đang làm dở: lưu sau mỗi câu trả lời, nên tab bị đóng (Android hay đóng tab chạy nền) vẫn làm tiếp được.
export type MGiven = Record<string, string | string[]>;
export interface MockRun {
  t: string;                  // id đề
  sk: 'L' | 'R';
  both: boolean;              // làm cả đề: xong Nghe thì sang Đọc
  part: number;               // Nghe: phần đang phát (0…); Đọc: phần đang xem
  pos: number;                // Nghe: giây đã phát của phần hiện tại
  phase: 'run' | 'check';     // Nghe: đang phát / đang soát lại sau khi nghe xong
  left: number;               // mili giây còn lại (Đọc; Nghe khi soát lại)
  given: MGiven;
  marked: string[];           // câu đánh dấu để xem lại
  secs: number;               // giây đã làm (để cộng phút học)
}
export interface MockLog { d: number; given: MGiven }

export interface XState {
  v: number;
  exam: ExamId | '';
  target: number | null;      // band mục tiêu (VSTEP: điểm trung bình mục tiêu)
  date: number | null;        // ngày thi (số ngày)
  mins: number;               // phút học mỗi ngày
  attempts: Attempt[];
  nb: Record<string, NbEntry>;
  real: RealScore[];
  share: boolean;             // đồng ý gửi thống kê ẩn danh (mặc định không); xem consent
  consent: Consent | null;
  resp: Resp[];               // các câu Nghe/Đọc đã trả lời gần đây
  sent: number;               // số lượt đã gửi ẩn danh (để người học biết)
  mockRun: MockRun | null;
  mockLog: Record<string, MockLog>;   // bài làm gần nhất của từng đề và kỹ năng ("a1-L") để xem lại giải thích bất cứ lúc nào
}

export const EXAMS: ExamId[] = ['ielts-ac', 'ielts-gt', 'vstep'];
export const ATTEMPT_MAX = 400;
export const RESP_MAX = 800;
export const MOCKLOG_MAX = 40;

export function freshX(): XState {
  return { v: X_V, exam: '', target: null, date: null, mins: 30, attempts: [], nb: {}, real: [], share: false, consent: null, resp: [], sent: 0, mockRun: null, mockLog: {} };
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
  if (x.v === 1) { x.resp = []; x.consent = null; x.sent = 0; x.v = 2; }   // v1 → v2: nhật ký câu trả lời để ước tính band, đồng ý chia sẻ có kiểm tuổi
  if (x.v === 2) { x.mockRun = null; x.mockLog = {}; x.v = 3; }            // v2 → v3: đề thi thử đầy đủ (bài đang làm, bài đã làm)
  return sanitizeX(x);
}

export function sanitizeX(raw: unknown): XState {
  const x = obj(raw), out = freshX();
  out.exam = exam(x.exam);
  out.target = numOrNull(x.target, 0, 10);
  out.date = numOrNull(x.date, 0, 1e6);
  if (out.date !== null) out.date = Math.round(out.date);
  out.mins = Math.round(num(x.mins, 5, 600, 30));
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
  const cs = obj(x.consent);
  out.consent = x.consent && typeof x.consent === 'object'
    ? { on: cs.on === true, adult: cs.adult === true, parent: cs.parent === true, day: Math.round(num(cs.day, 0, 1e6, 0)) } : null;
  out.share = !!out.consent && out.consent.on && (out.consent.adult || out.consent.parent);
  out.sent = Math.round(num(x.sent, 0, 1e7, 0));
  out.resp = (Array.isArray(x.resp) ? x.resp : []).map(obj).filter(r => idOk(r.i)).slice(-RESP_MAX).map(r => ({
    i: r.i as string, c: r.c === 1 ? 1 : 0, d: Math.round(num(r.d, 0, 1e6, 0)), s: r.s === 'L' ? 'L' : 'R', b: num(r.b, 0, 9, 5.5), g: num(r.g, 0, 0.5, 0),
  }));
  out.mockRun = sanitizeRun(x.mockRun);
  const logs = Object.entries(obj(x.mockLog)).filter(([k]) => /^[a-z0-9]{1,8}-[LR]$/.test(k)).map(([k, v]) => [k, obj(v)] as const)
    .sort((a, b) => num(a[1].d, 0, 1e6, 0) - num(b[1].d, 0, 1e6, 0)).slice(-MOCKLOG_MAX);
  for (const [k, v] of logs) out.mockLog[k] = { d: Math.round(num(v.d, 0, 1e6, 0)), given: sanitizeGiven(v.given) };
  out.real = (Array.isArray(x.real) ? x.real : []).map(obj).filter(r => exam(r.exam)).slice(-20).map(r => ({
    exam: exam(r.exam) as ExamId, day: Math.round(num(r.day, 0, 1e6, 0)),
    L: numOrNull(r.L, 0, 10), R: numOrNull(r.R, 0, 10), W: numOrNull(r.W, 0, 10), S: numOrNull(r.S, 0, 10),
  }));
  return out;
}

function sanitizeGiven(v: unknown): MGiven {
  const out: MGiven = {};
  for (const [k, a] of Object.entries(obj(v)).slice(0, 120)) {
    if (!idOk(k)) continue;
    if (typeof a === 'string' && a.length <= 80) out[k] = a;
    else if (Array.isArray(a)) { const xs = a.filter((s): s is string => typeof s === 'string' && s.length <= 12).slice(0, 5); if (xs.length) out[k] = xs; }
  }
  return out;
}

function sanitizeRun(v: unknown): MockRun | null {
  const r = obj(v);
  if (typeof r.t !== 'string' || !/^[a-z0-9]{1,8}$/.test(r.t) || (r.sk !== 'L' && r.sk !== 'R')) return null;
  return {
    t: r.t, sk: r.sk, both: r.both === true, part: Math.round(num(r.part, 0, 50, 0)), pos: num(r.pos, 0, 3600, 0),
    phase: r.phase === 'check' ? 'check' : 'run', left: Math.round(num(r.left, 0, 4 * 3600e3, 0)),
    given: sanitizeGiven(r.given), marked: (Array.isArray(r.marked) ? r.marked : []).filter(idOk).slice(0, 60),
    secs: Math.round(num(r.secs, 0, 1e5, 0)),
  };
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
  const ks = new Set<string>();
  const resp = [...a.resp, ...b.resp].filter(r => { const k = `${r.i}|${r.d}|${r.c}`; return ks.has(k) ? false : (ks.add(k), true); })
    .sort((p, q) => p.d - q.d).slice(-RESP_MAX);
  return {
    ...a,
    exam: a.exam || b.exam, target: a.target ?? b.target, date: a.date ?? b.date,
    share: a.share, consent: a.consent, sent: a.sent,   // đồng ý gửi thống kê là của từng máy
    mockRun: a.mockRun,                                  // bài đang làm dở là của máy đang dùng
    mockLog: Object.fromEntries(Object.entries({ ...b.mockLog }).concat(Object.entries(a.mockLog).filter(([k, e]) => !b.mockLog[k] || e.d >= b.mockLog[k]!.d))),
    attempts, nb, real, resp,
  };
}
