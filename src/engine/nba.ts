// Next Best Action (spec v2.4 §56–57, HG8, HF10; C157–C160, C301–C320). Thuần hàm.
// Mọi thời điểm engine trả lời "nên làm gì tiếp" bằng một hàm utility có PHÂN RÃ (giải thích được) và có phiên bản:
//   U = wL·học + wI·thông tin + wG·mục tiêu + wP·tiền đề + wR·nguy cơ quên + wT·transfer − wE·nỗ lực − wX·ngắt mạch
// Ứng viên: learn (nút mở của lộ trình), review (ôn đến hạn), probe (kiểm tra nhanh), verify (xác minh ở câu mới).
// Ổn định (C318): giữ lựa chọn trước nếu ứng viên mới không hơn ≥ 10% (trễ). Hoà điểm: theo loại rồi theo id (C312).

import type { PathItem } from './path.ts';
import type { ProbeCand } from './probe.ts';

export const NBA_VER = 'nba-2';
export const W = { learn: 1, info: 1.2, goal: 0.4, prereq: 0.6, retain: 2, transfer: 0.8, effort: 0.5, interrupt: 0.3 } as const;
export const HYST = 0.1;

export type Kind = 'learn' | 'review' | 'probe' | 'verify';
export interface Parts { learn: number; info: number; goal: number; prereq: number; retain: number; transfer: number; effort: number; interrupt: number }
export interface Action { kind: Kind; node: string; level: number; u: number; parts: Parts; why: string; probe?: ProbeCand }

const KIND_ORDER: Record<Kind, number> = { verify: 0, review: 1, probe: 2, learn: 3 };
const zero = (): Parts => ({ learn: 0, info: 0, goal: 0, prereq: 0, retain: 0, transfer: 0, effort: 0, interrupt: 0 });
const total = (p: Parts): number => Math.round((W.learn * p.learn + W.info * p.info + W.goal * p.goal + W.prereq * p.prereq + W.retain * p.retain + W.transfer * p.transfer - W.effort * p.effort - W.interrupt * p.interrupt) * 1000) / 1000;

export interface NbaIn {
  open: PathItem[];                     // biên lộ trình (đã xếp theo ưu tiên phụ thuộc ÷ phút)
  probe: ProbeCand | null;              // kiểm tra nhanh tốt nhất (đã qua ngân sách, ngưỡng)
  review: { items: number; mins: number; risk: number };   // ôn đến hạn: số mục, phút, nguy cơ quên 0–1
  verify: Array<{ node: string; level: number }>;          // nút cần xác minh / mở lại trong mục tiêu
  prev?: { kind: Kind; node: string } | null;               // lựa chọn trước (trễ)
  inGame?: boolean;                     // đang trong lượt chơi: hành động ngắt mạch (bài học dài) bị trừ
}

export function rank(x: NbaIn): Action[] {
  const out: Action[] = [];
  const maxDep = Math.max(1, ...x.open.map(o => o.dep));
  for (const o of x.open.slice(0, 6)) {
    const p = zero();
    p.learn = 0.5 + 0.5 * (o.dep / maxDep); p.goal = Math.min(1, o.goals.length / 2 + 0.5); p.prereq = o.dep / maxDep;
    p.effort = Math.min(20, o.minutes) / 20; p.interrupt = x.inGame ? 0.5 : 0;
    out.push({ kind: 'learn', node: o.node, level: o.level, u: total(p), parts: p, why: `mở đường cho ${Math.floor(o.dep)} năng lực mục tiêu` });
  }
  if (x.review.items > 0) {
    const p = zero();
    p.retain = x.review.risk; p.learn = 0.3; p.effort = Math.min(20, x.review.mins) / 20;
    out.push({ kind: 'review', node: 'review', level: 0, u: total(p), parts: p, why: `${x.review.items} mục sắp quên` });
  }
  if (x.probe) {
    const p = zero();
    p.info = Math.min(1.5, x.probe.eig + (x.probe.mode === 'root' ? 0.6 : 0)); p.prereq = x.probe.mode === 'root' ? 1 : 0; p.effort = x.probe.effort / 20;
    p.goal = 1;   // câu dò luôn phục vụ một nút trong bao đóng mục tiêu
    out.push({ kind: 'probe', node: x.probe.node, level: x.probe.level, u: total(p), parts: p, why: `kiểm tra nhanh (${x.probe.mode})`, probe: x.probe });
  }
  for (const v of x.verify.slice(0, 3)) {
    const p = zero();
    p.info = 0.6; p.transfer = 1; p.goal = 1; p.effort = 1.5 / 20;
    out.push({ kind: 'verify', node: v.node, level: v.level, u: total(p), parts: p, why: 'xác minh ở câu mới' });
  }
  // Trễ: lựa chọn trước được cộng 10% để không nhảy qua lại vì chênh lệch nhỏ.
  if (x.prev) for (const a of out) if (a.kind === x.prev.kind && a.node === x.prev.node) a.u = Math.round(a.u * (1 + HYST) * 1000) / 1000;
  return out.sort((a, b) => b.u - a.u || KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || (a.node < b.node ? -1 : 1));
}
