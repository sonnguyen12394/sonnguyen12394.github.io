// Đo hiệu quả học (spec v2.4 Phần đánh giá L3–L5; nhóm G/I của bộ 400 tiêu chí, MT19). Thuần hàm.
// Mastery do engine tự suy ra không chứng minh được là người học tiến bộ thật. Bộ đo này độc lập với luyện tập:
//   - Bộ câu GIỮ RIÊNG: 12 câu chọn đều trên bao đóng mục tiêu, lấy từ kho câu ngữ cảnh mới (không phải câu luyện), được loại khỏi
//     transfer / game để không bị học vẹt. Cùng một bộ câu cho mọi lần đo → so sánh được.
//   - Bốn lần đo: trước (khi bắt đầu mục tiêu), sau (từ 14 ngày), trễ 7 ngày và 30 ngày sau lần "sau" (nhớ lâu).
//   - Không hiện đáp án khi đo (không biến bài đo thành bài học). Kết quả: mức tăng, tỉ lệ giữ lại, mức tăng mỗi giờ học.
//   - Cờ nghiên cứu A/B (adaptive vs cố định, game vs không game): chỉ GHI NHÃN khi người học bật chia sẻ dữ liệu nghiên cứu;
//     không đổi trải nghiệm của ai cho tới khi có nghiên cứu được duyệt (đạo đức, minh bạch).

import type { Req } from './types.ts';

export const MEASURE_VER = 'measure-1';
export type Phase = 'pre' | 'post' | 'd7' | 'd30';
export const PHASE_VI: Record<Phase, string> = { pre: 'Đo đầu vào', post: 'Đo sau khi học', d7: 'Đo lại sau 7 ngày', d30: 'Đo lại sau 30 ngày' };
export const MEASURE = { size: 12, postAfter: 14 } as const;

export interface MItem { node: string; item: string }
export interface Check { phase: Phase; day: number; got: number; of: number; mins: number }
export interface MeasureSave { goal: string; set: MItem[]; checks: Check[]; arm?: { a: 'adaptive' | 'fixed'; g: 'game' | 'plain'; day: number } }

// Chọn nút cho bộ đo: rải đều trên bao đóng mục tiêu (theo thứ tự tiền đề), chỉ nút có câu ngữ cảnh mới.
export function pickNodes(need: Req[], can: (node: string) => boolean, n: number = MEASURE.size): string[] {
  const pool = need.map(r => r.node).filter((x, i, a) => a.indexOf(x) === i && can(x));
  if (pool.length <= n) return pool;
  const step = pool.length / n;
  return Array.from({ length: n }, (_, i) => pool[Math.floor(i * step + step / 2)]!);
}

// Lần đo tiếp theo và đã đến hạn chưa.
export function nextPhase(ms: MeasureSave | undefined, today: number): { phase: Phase; due: boolean; at: number } | null {
  const by = new Map((ms?.checks ?? []).map(c => [c.phase, c]));
  const pre = by.get('pre'), post = by.get('post');
  if (!pre) return { phase: 'pre', due: true, at: today };
  if (!post) { const at = pre.day + MEASURE.postAfter; return { phase: 'post', due: today >= at, at }; }
  if (!by.get('d7')) { const at = post.day + 7; return { phase: 'd7', due: today >= at, at }; }
  if (!by.get('d30')) { const at = post.day + 30; return { phase: 'd30', due: today >= at, at }; }
  return null;
}

export interface Report { pre: number | null; post: number | null; d7: number | null; d30: number | null; gain: number | null; keep7: number | null; keep30: number | null; perHour: number | null }
export function report(ms: MeasureSave | undefined): Report {
  const p = (ph: Phase): number | null => { const c = ms?.checks.find(x => x.phase === ph); return c && c.of ? c.got / c.of : null; };
  const pre = p('pre'), post = p('post'), d7 = p('d7'), d30 = p('d30');
  const r2 = (x: number | null) => (x === null ? null : Math.round(x * 100) / 100);
  const gain = pre !== null && post !== null ? post - pre : null;
  const mins = (ms?.checks.find(x => x.phase === 'post')?.mins ?? 0) - (ms?.checks.find(x => x.phase === 'pre')?.mins ?? 0);
  return {
    pre: r2(pre), post: r2(post), d7: r2(d7), d30: r2(d30), gain: r2(gain),
    keep7: post && d7 !== null ? r2(d7 / post) : null, keep30: post && d30 !== null ? r2(d30 / post) : null,
    perHour: gain !== null && mins > 0 ? r2(gain / (mins / 60)) : null,
  };
}

// Nhãn nghiên cứu: ngẫu nhiên theo mã thiết bị (ổn định), chỉ khi có đồng ý.
export function armOf(devId: string, day: number): NonNullable<MeasureSave['arm']> {
  let h = 0;
  for (const ch of devId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return { a: h % 2 ? 'fixed' : 'adaptive', g: (h >> 1) % 2 ? 'plain' : 'game', day };
}

const PH: Phase[] = ['pre', 'post', 'd7', 'd30'];
export function sanitizeMeasure(raw: unknown): MeasureSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  if (typeof x.goal !== 'string' || !/^[a-z0-9][a-z0-9.-]{0,40}$/.test(x.goal)) return undefined;
  const set = (Array.isArray(x.set) ? x.set : []).flatMap(v => { const o = v as Record<string, unknown>; return typeof o?.node === 'string' && typeof o.item === 'string' && o.node.length <= 80 && o.item.length <= 120 ? [{ node: o.node, item: o.item }] : []; }).slice(0, 40);
  const seen = new Set<Phase>();
  const checks = (Array.isArray(x.checks) ? x.checks : []).flatMap(v => {
    const o = v as Record<string, unknown>, ph = o?.phase as Phase;
    if (!PH.includes(ph) || seen.has(ph)) return [];
    seen.add(ph);
    const of = n(o.of, 100);
    return [{ phase: ph, day: n(o.day, 1e6), got: Math.min(of, n(o.got, 100)), of, mins: n(o.mins, 1e7) }];
  });
  const a = x.arm as Record<string, unknown> | undefined;
  const arm = a && (a.a === 'adaptive' || a.a === 'fixed') && (a.g === 'game' || a.g === 'plain') ? { a: a.a, g: a.g, day: n(a.day, 1e6) } as MeasureSave['arm'] : undefined;
  return { goal: x.goal, set, checks, ...(arm ? { arm } : {}) };
}
// Gộp hai máy: giữ bộ câu của bản có lần đo "trước" sớm hơn; lần đo nào cũng lấy bản sớm hơn (lần đo đầu tiên mới có giá trị).
export function mergeMeasure(a?: MeasureSave, b?: MeasureSave): MeasureSave | undefined {
  if (!a) return b; if (!b) return a;
  const pa = a.checks.find(c => c.phase === 'pre')?.day ?? 1e9, pb = b.checks.find(c => c.phase === 'pre')?.day ?? 1e9;
  const base = pa <= pb ? a : b, other = base === a ? b : a;
  if (base.goal !== other.goal) return base;
  const checks = PH.flatMap(ph => { const x = base.checks.find(c => c.phase === ph), y = other.checks.find(c => c.phase === ph); return x && y ? [x.day <= y.day ? x : y] : x ? [x] : y ? [y] : []; });
  return { ...base, checks, ...(base.arm ?? other.arm ? { arm: base.arm ?? other.arm } : {}) };
}
