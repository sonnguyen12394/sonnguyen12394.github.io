// Evidence Evaluator (spec v2.4 §24, §41, §67): nơi DUY NHẤT biến một quan sát thô thành bằng chứng có trọng số.
// Luật có phiên bản (RULE): mỗi sự kiện ghi `ev` = phiên bản luật đã dùng, để audit và tính lại khi luật đổi (HG33).
//
// Trọng số hiệu dụng w (vào công thức mastery §44: đúng α += w·(1 − g), sai β += w·(1 − s)):
//   - w gốc = trọng số hoạt động đặt (mặc định 1);
//   - cùng câu lặp lại trong 24 giờ: ×0,5 (spec §44);
//   - đúng nhờ gợi ý hoặc ở lượt làm lại câu vừa sai: ×0,5 / ×0,3 (assisted ≠ independent, C247–C248);
//   - hết giờ trong luật chơi ép thời gian: tính là sai nhưng chỉ ×0,3 (kỹ năng game không thành điểm ngôn ngữ, P13–P14);
//   - tốc độ trả lời (rt) chỉ được ghi lại, không đổi w (P15).

import type { Observation, EvEvent, Src } from './types.ts';

export const RULE = {
  evaluator: 'ev1.0',
  mastery: 'm2.1',
  slip: 0.1,            // s: người đã biết vẫn có thể sai (spec §44)
  repeat: 0.5,          // cùng câu trong 24 giờ
  hint: 0.5,            // đúng nhờ gợi ý
  retry: 0.3,           // đúng ở lượt làm lại
  timeout: 0.3,         // hết giờ khi bị ép thời gian
  gMax: 0.9,
} as const;
export type Rule = { [K in keyof typeof RULE]: (typeof RULE)[K] extends string ? string : number };
export const RULE_ID = `${RULE.evaluator}/${RULE.mastery}`;

export interface EvalCtx {
  day: number;
  ts: number;
  id: string;
  lastSeenDay?: number;  // ngày gần nhất câu này được trả lời (để giảm trọng số khi lặp)
  novel: boolean;        // câu lần đầu gặp ở nút này
}

export function evaluate(o: Observation, c: EvalCtx, rule: Rule = RULE): EvEvent {
  let w = o.w ?? 1;
  const asst = !!(o.hint || o.retry || (o.w !== undefined && o.w < 1));
  if (c.lastSeenDay !== undefined && c.day - c.lastSeenDay < 1) w *= rule.repeat;
  if (o.ok && o.hint) w *= rule.hint;
  if (o.ok && o.retry) w *= rule.retry;
  if (!o.ok && o.timeout && o.timed) w *= rule.timeout;
  const g = Math.min(rule.gMax, Math.max(0, o.g ?? 0));
  // Độ tin cậy: câu dễ đoán và câu có trợ giúp nói ít hơn về năng lực thật.
  const rel = Math.round(Math.max(0.05, (1 - g) * (asst ? 0.5 : 1) * (o.timeout ? 0.5 : 1)) * 100) / 100;
  const ev: EvEvent = {
    id: c.id, ts: c.ts, day: c.day, node: o.node, lv: o.level, ok: o.ok ? 1 : 0, w: Math.round(w * 1000) / 1000, g,
    src: (o.src ?? 'vocab') as Src, nov: c.novel ? 1 : 0, rel, tier: 1, val: 0, ev: `${rule.evaluator}/${rule.mastery}`,
  };
  if (o.only) ev.only = 1;
  if (asst) ev.asst = 1;
  for (const k of ['item', 'ch', 'qt', 'ctx', 'cv', 'sess'] as const) { const v = o[k]; if (typeof v === 'string' && v) ev[k] = v.slice(0, 80); }
  if (typeof o.diff === 'number') ev.diff = Math.max(-1, Math.min(1, Math.round(o.diff)));
  if (typeof o.rt === 'number' && o.rt > 0) ev.rt = Math.round(Math.min(o.rt, 600000));
  return ev;
}
