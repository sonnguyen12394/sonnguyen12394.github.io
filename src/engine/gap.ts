// Phân loại lỗ hổng (spec v2.4 §49; C141–C149). Thuần hàm.
// Gap = yêu cầu của mục tiêu − trạng thái hiện tại, nhưng KIỂU lỗ hổng quyết định cách sửa:
//   prerequisite  — tiền đề cứng chưa đạt, hoặc nguyên nhân gốc đã kiểm chứng (dạy phần nền trước, §50)
//   knowledge     — chưa nhận ra / chưa hiểu (mức 1–2 chưa đạt)
//   recall        — nhận ra được nhưng chưa tự nhớ ra (mức 1–2 đạt, mức 3 chưa)
//   skill         — nhớ ra được nhưng chưa dùng được (mức 3 đạt, mức 4–5 chưa)
//   context       — đạt chung nhưng trượt rõ ở một ngữ cảnh / dạng câu
//   transfer      — trượt ở câu mới chưa gặp (mở lại / cần xác minh)
//   retention     — từng đạt, khả năng nhớ (FSRS) đã tụt dưới 0,85 (§58)
//   automaticity  — đúng nhưng chậm rõ so với chính người học (tốc độ chỉ là tín hiệu phụ, P15: không làm mất Đạt)

import { stat, type MasteryStore } from './mastery.ts';
import type { EvStore } from './ev/types.ts';
import type { Level } from './types.ts';

export type GapKind = 'prerequisite' | 'knowledge' | 'recall' | 'skill' | 'context' | 'transfer' | 'retention' | 'automaticity';
export const GAP_VI: Record<GapKind, string> = {
  prerequisite: 'Thiếu phần nền', knowledge: 'Chưa biết', recall: 'Nhận ra nhưng chưa nhớ ra', skill: 'Nhớ nhưng chưa dùng được',
  context: 'Yếu ở một ngữ cảnh', transfer: 'Chưa dùng được ở câu mới', retention: 'Đang quên', automaticity: 'Đúng nhưng còn chậm',
};
export const RETAIN_R = 0.85, SLOW_MS = 12000;

export interface GapIn {
  m: MasteryStore;
  ev: EvStore;
  node: string;
  need: Level;
  blocked: boolean;                 // còn tiền đề cứng chưa đạt
  recall?: number | null;           // khả năng nhớ trung bình (FSRS) của nút, nếu có thẻ
}

const passAt = (m: MasteryStore, node: string, lv: Level) => stat(m[node]?.[lv]).pass;

export function gaps(g: GapIn): GapKind[] {
  const out: GapKind[] = [], s = stat(g.m[g.node]?.[g.need]);
  if (g.blocked || g.ev.hyp[g.node]) out.push('prerequisite');
  if (s.state === 'reopened' || s.state === 'verify') out.push('transfer');
  if (!s.pass) {
    if (!passAt(g.m, g.node, 1) && !passAt(g.m, g.node, 2)) out.push('knowledge');
    else if (g.need >= 3 && !passAt(g.m, g.node, 3)) out.push('recall');
    else if (g.need >= 4) out.push('skill');
  } else {
    if (typeof g.recall === 'number' && g.recall < RETAIN_R) out.push('retention');
    // Ngữ cảnh: trong thống kê của mức cần, một ngữ cảnh có ≥ 3 lượt mà tỉ lệ đúng < 50%.
    if (weakContext(g.ev, g.node, g.need)) out.push('context');
    // Tự động hoá: trung vị thời gian các lần đúng gần đây chậm rõ so với CHÍNH người học (trung vị các lần đúng ở nút khác × 1,5,
    // tối thiểu 4 giây); chưa đủ dữ liệu so sánh thì dùng ngưỡng tuyệt đối SLOW_MS (v65, C145).
    const rts = g.ev.led.filter(x => x.node === g.node && x.ok && x.rt).slice(-7).map(x => x.rt!).sort((a, b) => a - b);
    const base = g.ev.led.filter(x => x.node !== g.node && x.ok && x.rt).slice(-60).map(x => x.rt!).sort((a, b) => a - b);
    const slow = base.length >= 10 ? Math.max(4000, base[Math.floor(base.length / 2)]! * 1.5) : SLOW_MS;
    if (rts.length >= 5 && rts[Math.floor(rts.length / 2)]! > slow) out.push('automaticity');
  }
  return out;
}

// Ngữ cảnh yếu nhất của một ô (≥ 3 lượt, đúng < 50%), để cách sửa hỏi đúng ngữ cảnh đó. null nếu không có.
export function weakContext(ev: EvStore, node: string, need: Level): string | null {
  const ck = `${node}|${need}`, byCtx = new Map<string, { ok: number; all: number }>();
  for (const part of Object.values(ev.agg)) for (const [k, x] of Object.entries(part[ck] ?? {})) {
    const ctx = k.split('|')[0]!;
    if (ctx === '-' || ctx === 'legacy') continue;
    const c = byCtx.get(ctx) ?? { ok: 0, all: 0 };
    c.ok += x.swOk; c.all += x.sw; byCtx.set(ctx, c);
  }
  const weak = [...byCtx.entries()].filter(([, c]) => c.all >= 3 && c.ok / c.all < 0.5).sort((a, b) => a[1].ok / a[1].all - b[1].ok / b[1].all);
  return weak[0]?.[0] ?? null;
}
