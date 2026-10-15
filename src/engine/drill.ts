// v134 Sân tập trước cổng (docs/DANH-GIA-KHONG-AI.md, đợt 1): luyện đúng 5 phần Đọc + 5 phần Nghe theo định dạng công khai của
// A2 Key, bằng câu soạn riêng (content/exam/practice/k-*.json, gói "p-k-…"), không bao giờ lẫn câu trận cổng. Khác trận cổng:
// chữa ngay sau mỗi bài, bài nghe nghe lại được (có bản chậm), làm lại được. Lượt luyện là lượt đo (luật P14): lần làm ĐẦU của
// mỗi bài được giữ làm số đo theo phần (đúng bao nhiêu ở phần nào), lần làm lại chỉ để luyện. Không vào sổ bằng chứng của nút
// (câu không gắn nút engine) và không vào phán quyết cổng. Thuần hàm.

import type { Group } from '../exam/content.ts';
import { markItem, type Given } from '../exam/score.ts';

export type DrillPart = 'k-r1' | 'k-r2' | 'k-r3' | 'k-r4' | 'k-r5' | 'k-l1' | 'k-l2' | 'k-l3' | 'k-l4' | 'k-l5';
export interface PartInfo { q: DrillPart; sk: 'R' | 'L'; no: number; vi: string; how: string }
// Lời giới thiệu từng phần: nói việc người chơi làm, không dùng chữ thi / đề / kiểm tra.
export const DRILL_PARTS: PartInfo[] = [
  { q: 'k-r1', sk: 'R', no: 1, vi: 'Biển báo, tin nhắn ngắn', how: 'Đọc 6 biển báo, tin nhắn; chọn câu nói đúng ý.' },
  { q: 'k-r2', sk: 'R', no: 2, vi: 'Ghép câu với ba bài ngắn', how: 'Ba người viết về cùng một chủ đề; tìm xem câu nào nói về ai.' },
  { q: 'k-r3', sk: 'R', no: 3, vi: 'Bài đọc dài', how: 'Đọc một bài dài hơn; chọn đáp án đúng cho 5 câu.' },
  { q: 'k-r4', sk: 'R', no: 4, vi: 'Chọn từ điền vào bài', how: 'Mỗi chỗ trống có 3 từ; chọn từ đúng nghĩa và đúng cách dùng.' },
  { q: 'k-r5', sk: 'R', no: 5, vi: 'Tự điền một từ', how: 'Tự gõ đúng MỘT từ cho mỗi chỗ trống (thường là từ ngữ pháp).' },
  { q: 'k-l1', sk: 'L', no: 1, vi: 'Năm đoạn ngắn', how: 'Nghe 5 đoạn hội thoại ngắn; mỗi đoạn trả lời một câu.' },
  { q: 'k-l2', sk: 'L', no: 2, vi: 'Nghe và ghi thông tin', how: 'Nghe một người nói; ghi một từ, số, ngày hoặc giờ vào chỗ trống.' },
  { q: 'k-l3', sk: 'L', no: 3, vi: 'Hội thoại dài', how: 'Nghe hai người nói chuyện; chọn đáp án cho 5 câu.' },
  { q: 'k-l4', sk: 'L', no: 4, vi: 'Hiểu ý chính', how: 'Nghe 5 đoạn ngắn; mỗi đoạn hỏi ý chính, mục đích hoặc nơi chốn.' },
  { q: 'k-l5', sk: 'L', no: 5, vi: 'Ghép người với việc', how: 'Nghe một hội thoại; ghép 5 người với 5 trong 8 lựa chọn.' },
];
export const PART: Record<string, PartInfo> = Object.fromEntries(DRILL_PARTS.map(p => [p.q, p]));
// Mục tiêu có Sân tập: khu A2 (đích hiện tại) và B1 (người nhắm B1 cũng phải vững A2 Key). Pre-A1 / A1 quá sức với dạng A2 Key.
export const DRILL_GOALS = new Set(['cefr-a2', 'cefr-b1']);

export interface DrillRec { d: number; ok: number; n: number; r?: number }   // d: ngày làm lần đầu; ok / n: điểm lần đầu; r: số lần làm lại
export type DrillSave = Record<string, DrillRec>;                            // id bài → lần làm đầu

export const partOf = (gid: string): DrillPart | null => { const m = /^(k-[rl][1-5])-/.exec(gid); return m ? (m[1] as DrillPart) : null; };

// Bài kế tiếp của một phần: bài chưa làm theo thứ tự (bài đầu dễ hơn), hết thì bài làm lâu nhất / ít lần làm lại nhất.
export function nextGroup(ids: string[], dr: DrillSave | undefined): string | null {
  if (!ids.length) return null;
  const sorted = [...ids].sort();
  const fresh = sorted.find(id => !dr?.[id]);
  if (fresh) return fresh;
  return [...sorted].sort((a, b) => (dr![a]!.r ?? 0) - (dr![b]!.r ?? 0) || dr![a]!.d - dr![b]!.d || (a < b ? -1 : 1))[0]!;
}

export interface DrillMark { id: string; got: number; of: number }
// Chấm một bài bằng máy chấm của phần ôn thi (chọn: đúng khoá; điền: đúng chính tả, đúng số từ, không phân biệt hoa thường).
export function markGroup(g: Group, given: Record<string, Given>): { marks: DrillMark[]; ok: number; n: number } {
  const marks = g.items.map(it => { const m = markItem(it, g, given[it.id]); return { id: it.id, got: m.got, of: m.of }; });
  return { marks, ok: marks.reduce((s, m) => s + m.got, 0), n: marks.reduce((s, m) => s + m.of, 0) };
}

// Ghi kết quả: lần đầu thành số đo của phần; lần sau chỉ đếm làm lại (không ghi đè số đo).
export function recordGroup(dr: DrillSave | undefined, gid: string, ok: number, n: number, day: number): DrillSave {
  const out = { ...(dr ?? {}) }, prev = out[gid];
  out[gid] = prev ? { ...prev, r: (prev.r ?? 0) + 1 } : { d: day, ok, n };
  return out;
}

export interface PartStat { done: number; total: number; ok: number; n: number; acc: number | null }
export function partStat(dr: DrillSave | undefined, q: DrillPart, total: number): PartStat {
  const xs = Object.entries(dr ?? {}).filter(([id]) => partOf(id) === q).map(([, r]) => r);
  const ok = xs.reduce((s, r) => s + r.ok, 0), n = xs.reduce((s, r) => s + r.n, 0);
  return { done: xs.length, total, ok, n, acc: n ? ok / n : null };
}

// Phần yếu nhất (tỉ lệ đúng lần đầu thấp nhất, cần ≥ 5 câu để không kết luận từ may rủi); phần chưa làm thì gợi ý theo thứ tự.
export const WEAK_MIN = 5;
export function weakest(dr: DrillSave | undefined, totals: Record<string, number>): DrillPart | null {
  const st = DRILL_PARTS.filter(p => (totals[p.q] ?? 0) > 0).map(p => ({ p, s: partStat(dr, p.q, totals[p.q] ?? 0) }));
  const untried = st.find(x => x.s.done === 0);
  const measured = st.filter(x => x.s.n >= WEAK_MIN && x.s.done < x.s.total).sort((a, b) => a.s.acc! - b.s.acc!);
  if (measured.length && measured[0]!.s.acc! < 0.6) return measured[0]!.p.q;
  return untried?.p.q ?? measured[0]?.p.q ?? null;
}

export function sanitizeDrill(x: unknown): DrillSave | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const out: DrillSave = {}, num = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(0, Math.round(v))) : 0);
  for (const [k, v] of Object.entries(x as Record<string, unknown>).slice(0, 400)) {
    if (!partOf(k) || !/^[a-z0-9-]{4,30}$/.test(k) || !v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>, n = num(r.n, 99), rec: DrillRec = { d: num(r.d, 1e6), ok: Math.min(num(r.ok, 99), n), n };
    const rr = num(r.r, 9999);
    if (rr) rec.r = rr;
    out[k] = rec;
  }
  return Object.keys(out).length ? out : undefined;
}
// Gộp hai máy: lần làm đầu là lần sớm hơn; số lần làm lại lấy lớn hơn.
export function mergeDrill(a: DrillSave | undefined, b: DrillSave | undefined): DrillSave | undefined {
  if (!a || !b) return a ?? b;
  const out: DrillSave = { ...b };
  for (const [k, v] of Object.entries(a)) {
    const w = out[k];
    if (!w) { out[k] = v; continue; }
    const first = v.d <= w.d ? v : w, r = Math.max(v.r ?? 0, w.r ?? 0);
    out[k] = { d: first.d, ok: first.ok, n: first.n, ...(r ? { r } : {}) };
  }
  return out;
}
