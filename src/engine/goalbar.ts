// v110 Mục tiêu + tiến độ ở sảnh Chơi và màn kết (spec v2.4 §XIX "Play → Goal → Progress → Next Challenge", §XVII, P20).
// Trước đây engine đã tính đủ (readiness, phần còn thiếu, kỹ năng vững, +7 ngày) nhưng chỉ hiện trong mục tháp đang đóng hoặc cách
// 2 lần chạm; phần đầu sảnh toàn thưởng game. Ở đây chỉ gom số đã có và trình bày; không thêm dữ liệu lưu, không đổi bằng chứng.
// Thuần hàm: main.ts gom dữ liệu vào.

import type { ECtx } from './views.ts';
import { GATE } from './gate.ts';

export interface GoalIn {
  id: string; vi: string;
  sk: { solid: number; total: number; week: number; claimed: number };           // skillsOf (main.ts): kỹ năng con đã vững bằng bằng chứng thật
  ready: { done: number; total: number; achieved: boolean } | null;              // readiness CEFR (năng lực Can-Do của mục tiêu)
  missing: Array<{ vi: string; pct: number }>;                                   // missingOf: đã sắp gần đạt nhất trước
  review: number;                                                                // phần sắp quên (cùng số bộ não chọn game dùng)
  rote?: string[];                                                               // v111: phần đúng ở câu cũ mà sai ở câu lạ (rote.ts)
  due?: { days: number; mins: number } | null;                                   // v111: hạn người học đặt (ngày còn lại) + phút học ước tính còn cần
  gate?: { lv: string; has: boolean; open: boolean; passed: boolean; ratio: number; left: number } | null;   // v111 trận cổng của khu (cấp) mục tiêu
  zones?: Array<{ lv: string; passed: boolean; cur: boolean }>;                // v111 khu = cấp: thang khu, khu đã qua cổng, khu đang ở
}
export interface GoalSum {
  id: string; vi: string; solid: number; total: number; claimed: number; week: number;
  done: number; need: number; achieved: boolean; near: string[]; more: number; review: number; rote: string[]; due: { days: number; perDay: number } | null;
  gate: GoalIn['gate'] | null; zones: NonNullable<GoalIn['zones']>;
}

export const NEAR_N = 3;

export function goalSummary(g: GoalIn): GoalSum {
  const near = g.missing.slice(0, NEAR_N).map(m => m.vi);
  return {
    id: g.id, vi: g.vi, solid: g.sk.solid, total: g.sk.total, claimed: Math.min(g.sk.claimed, Math.max(0, g.sk.total - g.sk.solid)), week: g.sk.week,
    done: g.ready?.done ?? 0, need: g.ready?.total ?? 0, achieved: !!g.ready?.achieved, near, more: Math.max(0, g.missing.length - near.length), review: g.review, rote: g.rote ?? [],
    due: g.due ? { days: g.due.days, perDay: g.due.days > 0 ? Math.ceil(g.due.mins / g.due.days) : g.due.mins } : null,
    gate: g.gate ?? null, zones: g.zones ?? [],
  };
}

const pc = (n: number, d: number) => (d ? Math.round((n / d) * 100) : 0);

// Thẻ đầu sảnh. Thanh hai lớp: vững thật (đậm) và chỉ suy ra từ xếp lớp (nhạt, đang kiểm dần) để không thổi phồng tiến độ.
export function viewGoalBar(c: ECtx, s: GoalSum): string {
  const esc = c.host.esc;
  if (s.achieved) return `<section class="gbar stack done" aria-label="Mục tiêu của bạn"><span class="eyebrow">🎯 Mục tiêu</span>
    <b>✓ Đã đạt ${esc(s.vi)}</b><p class="hint">Đủ năng lực, đủ bài làm thật và không quên trong 14 ngày. Chọn mục tiêu cấp kế để tiếp tục leo.</p>
    <div class="row"><button class="btn primary small" data-e="go" data-r="goals">Chọn mục tiêu tiếp</button></div></section>`;
  const week = s.week ? `<span class="gbup">+${s.week} tuần này</span>` : '<span class="hint">tuần này chưa vững thêm phần nào</span>';
  const near = s.near.length ? `<span class="gbnear"><b>Gần đạt nhất:</b> ${s.near.map(esc).join('; ')}${s.more ? ` <span class="hint">và ${s.more} năng lực khác</span>` : ''}</span>` : '';
  const lines = [
    s.need ? `${s.done}/${s.need} năng lực của mục tiêu đã Đạt` : '',
    s.review ? `${s.review} phần đã học đang sắp quên` : '',
  ].filter(Boolean).join(' · ');
  // Hạn chót (tuỳ chọn): số phút mỗi ngày cần để kịp, theo ước tính thô của lộ trình (mỗi người một khác).
  const due = !s.due ? '' : s.due.days <= 0 ? '<span class="gbdue">⏰ Đã tới hạn bạn đặt: đặt hạn mới ở trang mục tiêu.</span>'
    : `<span class="gbdue">⏰ Còn ${s.due.days} ngày tới hạn: cần khoảng ${s.due.perDay} phút mỗi ngày${s.due.perDay > 60 ? ' (nhiều: cân nhắc lùi hạn)' : ''}.</span>`;
  // Khu = cấp (v111): thang khu với cổng đã qua; trận cổng là nơi duy nhất kết luận "đủ trình độ", bản đồ chỉ để chẩn đoán.
  const zones = s.zones.length ? `<span class="gbzone" aria-label="Các khu của Phố Chữ">${s.zones.map(z => z.cur ? `<b>📍${esc(z.lv)}</b>` : z.passed ? `${esc(z.lv)} ✓` : `<span class="hint">${esc(z.lv)}</span>`).join(' · ')}</span>` : '';
  const gt = s.gate;
  const gline = !gt || !gt.has ? '<span class="hint">Đây là bản đồ để biết học gì tiếp, chưa phải kết luận đủ trình độ.</span>'
    : gt.passed ? `<span class="gbup">🚪 Đã qua cổng khu ${esc(gt.lv)}</span>`
    : gt.open ? `<span class="gbup">🚪 Cổng khu ${esc(gt.lv)} đã mở: vào trận cổng để Tí xác nhận bạn đủ trình độ.</span>`
    : `<span class="hint">🚪 Cổng khu ${esc(gt.lv)} còn khoá: mở khi ${Math.round(GATE.open * 100)}% kỹ năng đã vững (đang ${Math.round(gt.ratio * 100)}%). Bản đồ này chưa phải kết luận.</span>`;
  const cta = gt?.open && !gt.passed ? `<div class="row" style="margin:-4px 0 12px"><button class="btn primary" data-e="go" data-r="gate">🚪 Vào trận cổng khu ${esc(gt.lv)}</button></div>` : '';
  return `<button class="gbar stack" data-e="go" data-r="goal/${esc(s.id)}">
    <span class="spread"><span class="eyebrow">🎯 Mục tiêu: ${esc(s.vi)}</span><span class="hint">Xem chi tiết ›</span></span>
    <span class="spread"><b>${s.solid}/${s.total} kỹ năng đã vững</b>${week}</span>
    <span class="bar gbbar" role="progressbar" aria-label="Kỹ năng đã vững" aria-valuemin="0" aria-valuemax="${s.total}" aria-valuenow="${s.solid}"><i style="width:${pc(s.solid, s.total)}%"></i><i class="gbclaim" style="width:${pc(s.claimed, s.total)}%"></i></span>
    ${s.claimed ? `<span class="hint">Phần nhạt: ${s.claimed} kỹ năng app đoán bạn đã biết từ lúc xếp lớp, sẽ kiểm dần.</span>` : ''}
    ${zones}${near}${lines ? `<span class="hint">${lines}</span>` : ''}${due}${gline}${s.rote.length ? `<span class="gbrote">⚠ ${s.rote.length} phần đang nhớ câu cũ, chưa dùng được ở câu lạ: ${s.rote.slice(0, 2).map(esc).join('; ')}${s.rote.length > 2 ? '…' : ''}. App sẽ cho thử câu mới.</span>` : ''}</button>${cta}`;
}

// Dòng nối ván vừa chơi với mục tiêu, cho MỌI màn kết. Nói thật: không có gì mới vững thì nói vậy (P13: điểm game không phải năng lực).
// ev: số câu bằng chứng ván này (null = game kỹ năng, lưu vào Can-Do); g.full: vừa vững đủ mức mục tiêu cần; g.part: Đạt ở mức thấp hơn.
export function goalLine(esc: (s: unknown) => string, s: GoalSum, g: { full: string[]; part: string[] }, ev: number | null): string {
  const head = `🎯 ${esc(s.vi)}: ${s.solid}/${s.total} kỹ năng đã vững`, gained = g.full;
  const step = g.part.length ? `<span>↗ Tiến một bậc: ${g.part.slice(0, 3).map(esc).join(', ')}${g.part.length > 3 ? '…' : ''}. Mục tiêu cần mức cao hơn (tự nhớ ra, tự dùng), chơi tiếp để vững hẳn.</span>` : '';
  const body = gained.length
    ? `<b>⬆ Vững thêm ${gained.length}: ${gained.slice(0, 4).map(esc).join(', ')}${gained.length > 4 ? '…' : ''}</b>`
    : step ? ''
    : ev === null ? 'Bài làm đã lưu vào phần kỹ năng (Can-Do) của mục tiêu.'
    : ev > 0 ? `Ván này thêm ${ev} câu bằng chứng, chưa đủ để vững thêm kỹ năng nào. Vững cần đúng nhiều lần, ở nhiều dạng câu.`
    : 'Ván này chưa có câu tính vào năng lực.';
  const near = !gained.length && s.near[0] ? `<span class="hint">Gần đạt nhất: ${esc(s.near[0])}</span>` : '';
  return `<section class="gline${gained.length ? ' up' : ''}" role="status"><div class="stack" style="gap:4px"><span class="eyebrow">${head}</span>${body ? `<span>${body}</span>` : ''}${step}${near}</div></section>`;
}

// Bản chữ thuần cho lớp phủ toàn màn hình (Vòng Chữ, Mỏ Chữ, Bài Câu dùng textContent / chuỗi đã thoát).
export function goalText(s: GoalSum, gained: string[]): string {
  return gained.length ? `🎯 ${s.vi}: vững thêm ${gained.slice(0, 3).join(', ')}${gained.length > 3 ? '…' : ''} (${s.solid}/${s.total})` : `🎯 ${s.vi}: ${s.solid}/${s.total} kỹ năng đã vững`;
}
