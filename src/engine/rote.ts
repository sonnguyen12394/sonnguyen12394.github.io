// Đèn báo học tủ (spec SPEC.md "Mô hình học v111" §3; v2.4 §59 transfer). Thuần hàm, không lưu thêm dữ liệu.
// So tỉ lệ đúng ở câu ĐÃ GẶP với câu LẠ (lần đầu gặp ở nút) trên thống kê gộp L2: khoá con "ngữ cảnh|dạng câu|mới|độ khó" đã tách
// mới / cũ. Đúng nhiều ở câu cũ mà sai ở câu lạ = đang nhớ câu, chưa dùng được thật → lộ trình nên chuyển sang câu transfer.
// Lượt đúng ở mức cao được ghi lan xuống mức thấp (xem transfer.ts), nên mỗi nút chỉ đọc MỘT mức: mức có nhiều lượt nhất.

import type { EvStore, Agg } from './ev/types.ts';

// gap: chênh tối thiểu; z: chênh phải lớn hơn z lần sai số chuẩn của hiệu hai tỉ lệ (ít câu lạ thì chênh do may rủi, không bật đèn).
export const ROTE = { gap: 0.25, minSeen: 4, minNovel: 4, z: 2 } as const;

export interface RoteStat { node: string; lv: number; seen: number; seenN: number; novel: number; novelN: number; gap: number; se: number }

// Thống kê một ô "nút|mức" gộp mọi thiết bị.
function cellStat(ev: EvStore, ck: string): { sN: number; sW: number; sOk: number; nN: number; nW: number; nOk: number } {
  const o = { sN: 0, sW: 0, sOk: 0, nN: 0, nW: 0, nOk: 0 };
  for (const part of Object.values(ev.agg)) for (const [k, x] of Object.entries(part[ck] ?? {}) as Array<[string, Agg]>) {
    const nov = k.split('|')[2] === '1';
    if (nov) { o.nN += x.n; o.nW += x.sw; o.nOk += x.swOk; } else { o.sN += x.n; o.sW += x.sw; o.sOk += x.swOk; }
  }
  return o;
}

export function roteStat(ev: EvStore, node: string): RoteStat | null {
  let best: { lv: number; s: ReturnType<typeof cellStat> } | null = null;
  const lvs = new Set<number>();
  for (const part of Object.values(ev.agg)) for (const ck of Object.keys(part)) if (ck.startsWith(`${node}|`)) lvs.add(Number(ck.slice(node.length + 1)));
  for (const lv of lvs) {
    const s = cellStat(ev, `${node}|${lv}`);
    if (!best || s.sN + s.nN > best.s.sN + best.s.nN) best = { lv, s };
  }
  if (!best) return null;
  const { s, lv } = best;
  if (s.sN < ROTE.minSeen || s.nN < ROTE.minNovel || s.sW <= 0 || s.nW <= 0) return null;
  const seen = s.sOk / s.sW, novel = s.nOk / s.nW;
  const se = Math.sqrt((seen * (1 - seen)) / s.sN + (novel * (1 - novel)) / s.nN + 1e-9);
  return { node, lv, seen, seenN: s.sN, novel, novelN: s.nN, gap: seen - novel, se };
}

// Các nút (trong `nodes`) có dấu hiệu học tủ: chênh ≥ ROTE.gap, xếp chênh lớn trước.
export function roteNodes(ev: EvStore, nodes: Iterable<string>, gap: number = ROTE.gap): RoteStat[] {
  const out: RoteStat[] = [];
  for (const n of new Set(nodes)) { const r = roteStat(ev, n); if (r && r.gap >= gap && r.gap >= ROTE.z * r.se) out.push(r); }
  return out.sort((a, b) => b.gap - a.gap || (a.node < b.node ? -1 : 1));
}
