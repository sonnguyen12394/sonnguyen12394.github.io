// Transfer (spec v2.4 §59, HG10; C26, C175–C179, C184, C211, C229, C277, C308, MT9). Thuần hàm.
// Mastery không chỉ dựa trên câu đã luyện: nút đã Đạt mà quan trọng cho transfer (imp.tr) cần được thử ở CÂU MỚI, NGỮ CẢNH MỚI,
// BIẾN THỂ BỀ MẶT (dạng câu khác dạng đã luyện). Đúng → bằng chứng transfer; sai → bằng chứng critical (tier 3) và cơ chế mâu thuẫn
// mở lại nút (§69). Câu thử transfer do app sinh từ nội dung thật (bài đọc của unit, kho câu ngữ pháp chưa gặp).

import { stat, type MasteryStore } from './mastery.ts';
import type { EvStore } from './ev/types.ts';
import type { Index } from './graph.ts';
import type { Level, Req } from './types.ts';

export const XFER = { minImp: 0.5, cooldownDays: 3, need: 1 } as const;

export interface XferStatus { tried: number; ok: number; fail: number; last: number }
// Trạng thái transfer của một nút: đếm từ thống kê ngữ cảnh 'transfer' (mọi thiết bị). Câu transfer luôn là câu mới, không gợi ý,
// nên số lượt đúng = novOk. Lượt đúng ở mức cao được ghi cả vào mức thấp hơn (lan xuống), lượt sai chỉ ở đúng mức của nó:
// số đúng = lớn nhất theo mức, số sai = tổng theo mức của (n − novOk).
export function xferStatus(ev: EvStore, node: string): XferStatus {
  const okBy = new Map<string, number>();
  let fail = 0, last = 0;
  for (const part of Object.values(ev.agg)) for (const [ck, cell] of Object.entries(part)) {
    if (!ck.startsWith(`${node}|`)) continue;
    for (const [k, x] of Object.entries(cell)) {
      if (!k.startsWith('transfer|')) continue;
      const ok = x.novOk ?? 0;
      okBy.set(ck, (okBy.get(ck) ?? 0) + ok); fail += Math.max(0, x.n - ok); last = Math.max(last, x.d1);
    }
  }
  const ok = Math.max(0, ...okBy.values());
  return { tried: ok + fail, ok, fail, last };
}
export const transferred = (ev: EvStore, node: string): boolean => xferStatus(ev, node).ok >= XFER.need;

export interface XferCand { node: string; level: Level; imp: number }
// Nút nên thử transfer: đã Đạt ở mức cần (bằng chứng thật), quan trọng cho transfer, chưa có transfer thành công, không vừa thử gần đây.
export function xferCandidates(ix: Index, m: MasteryStore, ev: EvStore, need: Req[], today: number, can: (node: string) => boolean): XferCand[] {
  const out: XferCand[] = [];
  for (const r of need) {
    const n = ix.node.get(r.node), imp = n?.imp?.tr ?? 0;
    if (!n || imp < XFER.minImp || !can(r.node)) continue;
    const s = stat(m[r.node]?.[r.level]);
    if (s.state !== 'mastered') continue;
    const x = xferStatus(ev, r.node);
    if (x.ok >= XFER.need || (x.last && today - x.last < XFER.cooldownDays)) continue;
    out.push({ node: r.node, level: r.level, imp });
  }
  return out.sort((a, b) => b.imp - a.imp || (a.node < b.node ? -1 : 1));
}

// Tổng hợp transfer cho Readiness (§60): trong yêu cầu mục tiêu, bao nhiêu nút quan trọng đã chứng minh ở câu mới, bao nhiêu thất bại
// (đang mở lại), bao nhiêu được miễn (đã Đạt nhưng hết câu mới để thử: `exhausted`). `pending` = nút còn phải thử.
export function xferSummary(ix: Index, m: MasteryStore, ev: EvStore, need: Req[], exhausted: (node: string) => boolean = () => false): { important: number; ok: number; failed: number; exempt: number; pending: string[] } {
  let important = 0, ok = 0, failed = 0, exempt = 0;
  const pending: string[] = [];
  for (const r of need) {
    const n = ix.node.get(r.node);
    if (!n || (n.imp?.tr ?? 0) < XFER.minImp || (n.kind !== 'vocab' && n.kind !== 'grammar')) continue;
    important++;
    const st = stat(m[r.node]?.[r.level]).state;
    if (st === 'reopened') failed++;
    if (transferred(ev, r.node)) ok++;
    else if (st === 'mastered' && exhausted(r.node)) exempt++;
    else pending.push(r.node);
  }
  return { important, ok, failed, exempt, pending };
}
