// Thám tử (v78, F6 đọc hiểu + F11 dùng ở ngữ cảnh mới) và Đài phát thanh (v79, F5 nghe đoạn): lõi chung "một văn bản + câu hỏi hiểu".
// Thuần hàm, seed cố định. Mỗi câu hỏi là một manh mối (≥ 3 lựa chọn: đáp án + 2 nhiễu của chính bài); câu ý chính đặt cuối làm "kết luận".
// Điểm bài (đúng lần đầu / số câu) lưu đúng chỗ của tab Đọc / Nghe, nên Can-Do đọc / nghe tăng như làm ở tab đó. Thử lại một manh mối
// sau khi sai chỉ để lật thẻ, không tính điểm (G3). Huy hiệu / sổ thám tử / kệ băng là telemetry (P13). Không tính giờ (P15).

import { rand } from './blocks.ts';
import type { ReadText, ReadQ } from './host.ts';

export const SOLVE = 2 / 3;   // phá án / bắt được sóng khi đúng lần đầu ≥ 2/3 số manh mối

// Chọn bài: chưa làm trước (bài của unit đang / đã học trước: từ quen trong ngữ cảnh mới, F11), rồi bài chưa đạt (< 0,8) điểm thấp trước,
// cuối cùng mới đến bài đã đạt. Hoà thì theo seed. Không lặp bài vừa làm ở ván trước (`last`).
export function choose(xs: ReadText[], seed: number, last = ''): ReadText | null {
  const r = rand(seed), tie = new Map(xs.map(x => [x.id, r()]));
  const rank = (x: ReadText) => (x.best === null ? (x.mine ? 0 : 1) : x.best < 0.8 ? 2 + x.best : 4 + x.best) + (x.id === last ? 10 : 0);
  return [...xs].sort((a, b) => rank(a) - rank(b) || tie.get(a.id)! - tie.get(b.id)!)[0] ?? null;
}
// Thứ tự manh mối: câu ý chính (k = main) làm câu kết luận cuối cùng; các câu khác giữ thứ tự của bài.
export function order(qs: ReadQ[]): ReadQ[] {
  const main = qs.filter(q => q.k === 'main');
  return [...qs.filter(q => q.k !== 'main'), ...main];
}
// Phương án của một câu: đáp án + nhiễu, trộn theo seed.
export function options(q: ReadQ, seed: number): { opts: string[]; ans: number } {
  const r = rand(seed), xs = [q.a, ...q.w];
  for (let i = xs.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [xs[i], xs[j]] = [xs[j]!, xs[i]!]; }
  return { opts: xs, ans: xs.indexOf(q.a) };
}
// Câu trong bài chứa đáp án (để tô sáng khi sai): câu có nhiều từ nội dung chung với đáp án + câu hỏi nhất.
const words = (s: string) => new Set(s.toLowerCase().replace(/[^a-z0-9' ]+/g, ' ').split(' ').filter(w => w.length > 3));
export function sentences(paras: string[]): string[] {
  return paras.flatMap(p => p.match(/[^.!?]+[.!?]+["”’)]?|[^.!?]+$/g) ?? [p]).map(s => s.trim()).filter(Boolean);
}
export function evidence(paras: string[], q: ReadQ): number {
  const ss = sentences(paras), a = words(q.a), qq = words(q.q);
  let best = -1, bi = -1;
  ss.forEach((s, i) => { const w = words(s); let sc = 0; for (const x of a) if (w.has(x)) sc += 2; for (const x of qq) if (w.has(x)) sc += 1; if (sc > best) { best = sc; bi = i; } });
  return best > 0 ? bi : -1;
}
export const solved = (ok: number, n: number): boolean => n > 0 && ok / n >= SOLVE - 1e-9;
// Sao của một hồ sơ: 3 khi đúng hết lần đầu, 2 khi phá án, 1 khi chưa (vẫn có sao: đọc hết bài là đáng khen).
export const caseStars = (ok: number, n: number): number => (n && ok === n ? 3 : solved(ok, n) ? 2 : 1);

export interface CaseSave { runs: number; solved: number; stars: number; day: number }
export const freshCaseSave = (): CaseSave => ({ runs: 0, solved: 0, stars: 0, day: 0 });
export function sanitizeCase(raw: unknown): CaseSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { runs: n(x.runs, 1e7), solved: n(x.solved, 1e7), stars: n(x.stars, 1e8), day: n(x.day, 1e6) };
}
export function mergeCase(a?: CaseSave, b?: CaseSave): CaseSave | undefined {
  if (!a) return b; if (!b) return a;
  return { runs: Math.max(a.runs, b.runs), solved: Math.max(a.solved, b.solved), stars: Math.max(a.stars, b.stars), day: Math.max(a.day, b.day) };
}
