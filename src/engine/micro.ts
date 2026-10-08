// Micro-learning và chính sách ngắt (spec v2.4 §51–53; C161–C170, C317, C330–C332, MT5–MT6). Thuần hàm.
// Không phải lỗi nào cũng đáng dừng người học lại. Sau một câu sai, engine chọn một trong bốn:
//   log    — lỗi lẻ, hoặc chưa đủ bằng chứng để biết là lỗi thật: chỉ ghi, không ngắt (giữ mạch học / chơi)
//   probe  — bằng chứng về nút còn quá ít mà đã sai lặp lại: hỏi thêm vài câu trước khi dạy (không dạy thứ người học đã biết)
//   offer  — lỗi lặp lại có ý nghĩa (sai ≥ 2 trong vài lượt gần nhất, hoặc cùng một câu trả lời sai lặp lại = hiểu sai):
//            mời "bí kíp 60 giây", người học có thể bỏ qua
//   now    — đã kiểm chứng là thiếu tiền đề quan trọng (giả thuyết nguyên nhân gốc §50): dừng lại học phần nền ngay,
//            vì luyện tiếp phần trên chỉ tích thêm lỗi
// Chống làm phiền (C166): mỗi nút tối đa một bí kíp mỗi ngày; trong lượt game, "offer" hoãn tới cuối lượt.

import { stat, type MasteryStore } from './mastery.ts';
import { misconceptions } from './ev/store.ts';
import type { EvStore } from './ev/types.ts';
import type { Level } from './types.ts';

export const MICRO_VER = 'micro-1';
export const MICRO = { window: 6, repeat: 2, minN: 3, perDay: 1, checkN: 3 } as const;
export type MicroAct = 'log' | 'probe' | 'offer' | 'now';
export interface MicroDecision { act: MicroAct; node: string; target: string; lv: Level; why: string; mis?: string; defer?: boolean }

export const MICRO_VI: Record<MicroAct, string> = {
  log: 'Ghi nhận, không ngắt', probe: 'Hỏi thêm trước khi dạy', offer: 'Mời bí kíp 60 giây', now: 'Học phần nền ngay',
};

export interface MicroIn { ev: EvStore; m: MasteryStore; node: string; lv: Level; today: number; inGame?: boolean }

export function microDecide(x: MicroIn): MicroDecision {
  const { ev, node, lv, today } = x;
  const base = { node, target: node, lv };
  const hyp = ev.hyp[node];
  // Đã có bí kíp cho nút này hôm nay (đích là nút hoặc phần nền của nó): không lặp lại.
  const doneToday = ev.led.some(e => e.src === 'micro' && e.day === today && (e.ch === `micro/${node}` || (hyp && e.ch === `micro/${hyp.cause}`)));
  if (doneToday) return { ...base, act: 'log', why: 'đã học bí kíp phần này hôm nay' };
  if (hyp) return { ...base, target: hyp.cause, act: 'now', why: 'đã kiểm chứng: thiếu phần nền' };
  const recent = ev.led.filter(e => e.node === node && e.src !== 'micro').slice(-MICRO.window);
  const wrong = recent.filter(e => !e.ok).length;
  const mis = misconceptions(ev, node)[0];
  const repeated = wrong >= MICRO.repeat || !!mis;
  if (!repeated) return { ...base, act: 'log', why: 'lỗi lẻ: chỉ ghi nhận' };
  const s = stat(x.m[node]?.[lv]), seen = ev.led.filter(e => e.node === node && e.src !== 'micro').length;
  if (s.state === 'mastered' && !mis) return { ...base, act: 'log', why: 'đang Đạt: hai lỗi gần đây sẽ được xác minh ở câu mới' };
  if (seen < MICRO.minN && !mis) return { ...base, act: 'probe', why: 'còn ít bằng chứng: hỏi thêm trước khi dạy' };
  const d: MicroDecision = { ...base, act: 'offer', why: mis ? `trả lời "${mis.t}" lặp lại: có thể đang hiểu sai` : `sai ${wrong}/${recent.length} lượt gần nhất`, ...(mis ? { mis: mis.t } : {}) };
  return x.inGame ? { ...d, act: 'log', defer: true, why: `${d.why} (hoãn tới cuối lượt chơi)` } : d;
}

// Hiệu quả can thiệp (§53): mastery trước/sau và kết quả câu kiểm tra ngay sau bí kíp.
export function microVerdict(got: number, of: number): 'fixed' | 'partial' | 'not-yet' {
  if (!of) return 'not-yet';
  return got === of ? 'fixed' : got / of >= 0.5 ? 'partial' : 'not-yet';
}
