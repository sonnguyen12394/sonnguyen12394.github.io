// Lỗ hổng → cách sửa (spec v2.4 §49–50, §55; C142–C149). Thuần hàm.
// Phân loại lỗ hổng chỉ có giá trị khi nó đổi việc app làm: cùng một nút nhưng "chưa biết" thì dạy và hỏi nhận ra, "nhận ra nhưng
// chưa nhớ ra" thì bắt tự gõ, "nhớ nhưng chưa dùng được" thì sửa lỗi / sản sinh, "yếu ở một ngữ cảnh" thì hỏi đúng ngữ cảnh đó…
// Thứ tự ưu tiên: phần nền trước (sửa gốc), rồi transfer (bằng chứng mâu thuẫn), rồi theo bậc kiến thức → nhớ → dùng.

import type { GapKind } from './gap.ts';
import type { Level } from './types.ts';

export type RemedyAct = 'root' | 'contrast' | 'check' | 'transfer' | 'teach' | 'recall' | 'produce' | 'context' | 'review' | 'speed' | 'practice' | 'step';
export interface Remedy { gap: GapKind | null; act: RemedyAct; lv: Level; typed: boolean; ctx?: string; vi: string }

const ORDER: GapKind[] = ['prerequisite', 'misconception', 'transfer', 'unproven', 'knowledge', 'recall', 'skill', 'context', 'retention', 'automaticity'];
export const REMEDY_VI: Record<RemedyAct, string> = {
  root: 'học phần nền trước', contrast: 'đối chiếu đúng / sai ở chỗ đang hiểu sai', check: 'hỏi thử trước khi dạy', step: 'lùi một bậc, dạy cách khác', transfer: 'thử ở câu mới chưa gặp', teach: 'dạy và hỏi nhận ra', recall: 'tự gõ để nhớ ra',
  produce: 'sửa lỗi / tự viết', context: 'luyện đúng ngữ cảnh còn yếu', review: 'ôn để khỏi quên', speed: 'luyện cho nhanh', practice: 'luyện ở mức cần',
};

export function remedyFor(gaps: GapKind[], need: Level, weakCtx?: string | null): Remedy {
  const g = ORDER.find(k => gaps.includes(k)) ?? null;
  const mk = (act: RemedyAct, lv: Level, typed: boolean, ctx?: string): Remedy => ({ gap: g, act, lv, typed, ...(ctx ? { ctx } : {}), vi: REMEDY_VI[act] });
  switch (g) {
    case 'prerequisite': return mk('root', need, false);
    case 'misconception': return mk('contrast', 2, false);
    case 'unproven': return mk('check', Math.min(2, need) as Level, false);
    case 'transfer': return mk('transfer', need, true);
    case 'knowledge': return mk('teach', 1, false);
    case 'recall': return mk('recall', 3, true);
    case 'skill': return mk('produce', Math.max(4, need) as Level, true);
    case 'context': return mk('context', need, false, weakCtx ?? undefined);
    case 'retention': return mk('review', Math.min(3, need) as Level, true);
    case 'automaticity': return mk('speed', need, false);
    default: return mk('practice', need, need >= 3);
  }
}

// Chọn câu theo cách sửa: đúng mức (hoặc gần nhất không vượt), ưu tiên dạng câu (tự gõ / chọn), câu chưa gặp trước.
export interface QLike { id: string; level: number; opts?: string[] }
// v71 (bot L03): câu THẤP hơn mức cần phạt nặng hơn câu đã gặp ở đúng mức. Trước đây hết câu mức 3 chưa gặp thì lấy câu chọn mức 2 chưa
// gặp (lệch 1 + lệch dạng 3 < đã gặp 5) dù mức 2 đã Đạt: không thêm bằng chứng nào cho mức cần (bot B2: 29 lượt như vậy). Câu cũ ở đúng mức,
// hỏi lại cách quãng, vẫn là bằng chứng nhớ lại.
export function pickFor<T extends QLike>(qs: T[], r: Remedy, seen: (id: string) => boolean): T | null {
  if (!qs.length) return null;
  const score = (q: T) => (q.level === r.lv ? 0 : q.level < r.lv ? 6 * (r.lv - q.level) : 10 + q.level - r.lv) + (r.typed === !q.opts ? 0 : 3) + (seen(q.id) ? 5 : 0);
  return [...qs].sort((a, b) => score(a) - score(b))[0]!;
}
