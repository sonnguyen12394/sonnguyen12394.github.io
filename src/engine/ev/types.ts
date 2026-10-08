// Kiến trúc bằng chứng theo Master Spec v2.4 (docs/SPEC-v2.4.md, Phần X–XII):
//   L0 Observation (quan sát thô, giữ ngắn) → Evidence Evaluator → L1 EvidenceEvent (sổ bằng chứng, giữ theo giá trị)
//   → L2 Aggregate (thống kê không mất chiều, tính lại được) → L3 ô Beta (trạng thái dẫn xuất, e.m) → L4 Decision Snapshot.
// Quan sát không bao giờ cập nhật mastery trực tiếp (HG4): mọi thứ đi qua evaluate() rồi aggregate, ô Beta luôn tính lại từ L2.

import type { Level } from '../types.ts';
import type { Snapshot } from './snapshot.ts';

// Nguồn hoạt động sinh ra quan sát (provenance §36: activity).
export type Src = 'vocab' | 'gram' | 'exam' | 'pa' | 'diag' | 'testout' | 'perf' | 'game' | 'micro' | 'transfer' | 'legacy';

// L0 — quan sát thô. Chỉ chứa sự kiện, không chứa diễn giải.
export interface Observation {
  node: string;          // nút năng lực mà thử thách nhắm tới
  level: Level;          // mức mastery câu này đo
  ok: boolean;           // đúng / sai
  src?: Src;             // hoạt động
  item?: string;         // id câu
  ch?: string;           // id thử thách (game challenge / bài) chứa câu
  qt?: string;           // dạng câu (mcq, typed, cloze…)
  ctx?: string;          // ngữ cảnh / chiều bài tập
  g?: number;            // xác suất đoán đúng (1/số phương án; 0 với câu tự gõ)
  w?: number;            // trọng số do hoạt động đặt (bài kiểm tra bỏ qua ×4, bài làm thật ×2, tự nhận là đoán ×0,5)
  only?: boolean;        // chỉ ghi đúng mức này, không lan xuống mức thấp hơn
  rt?: number;           // thời gian trả lời (ms) — tín hiệu phụ (P15), không vào trọng số mastery
  given?: string;        // câu trả lời người học đưa ra (phương án chọn / chữ gõ) — để phát hiện hiểu sai lặp lại
  hint?: boolean;        // có dùng gợi ý
  retry?: boolean;       // lượt làm lại câu vừa sai trong cùng buổi
  timed?: boolean;       // câu nằm trong luật chơi có ép thời gian
  timeout?: boolean;     // hết giờ mà chưa trả lời (khác "trả lời sai")
  gp?: number;           // độ khó gameplay 0–1 lúc trả lời (tách khỏi độ khó ngôn ngữ, P14)
  diff?: number;         // độ khó ngôn ngữ của câu: −1 dễ hơn cấp nút, 0 đúng cấp, 1 khó hơn
  cv?: string;           // phiên bản nội dung của câu
  sess?: string;         // phiên học
  text?: string;         // đề câu (v66): cùng một câu dưới id khác vẫn là câu đã gặp (phát hiện câu trùng, C242)
}

// L0 lưu kèm thời điểm và id.
export interface ObsRec extends Observation { id: string; ts: number; day: number }

// Tier giữ dữ liệu (§29): 0 telemetry, 1 learning, 2 decision, 3 critical.
export type Tier = 0 | 1 | 2 | 3;

// L1 — sự kiện bằng chứng đã diễn giải, kèm provenance đầy đủ. Khoá ngắn để sổ nhỏ (localStorage).
export interface EvEvent {
  id: string;            // <thiết bị>.<số thứ tự>
  ts: number;            // thời điểm (ms)
  day: number;
  node: string;
  lv: Level;
  ok: 0 | 1;
  w: number;             // trọng số hiệu dụng sau khi đánh giá
  g: number;             // đoán mò
  only?: 1;
  src: Src;
  item?: string;
  ch?: string;
  qt?: string;
  ctx?: string;
  nov: 0 | 1;            // câu lần đầu gặp ở nút này (novelty)
  asst?: 1;              // có trợ giúp (gợi ý, làm lại, tự nhận đoán)
  diff?: number;
  rt?: number;
  rel: number;           // độ tin cậy 0–1 (§67)
  tier: Tier;
  val: number;           // giá trị bằng chứng (§30), dùng khi dọn sổ
  why?: string;          // vì sao tier cao: flip (đổi Đạt), boundary, disagree, transfer
  ev: string;            // evaluator + phiên bản luật
  cv?: string;           // phiên bản nội dung
  sess?: string;
}

// L2 — thống kê gộp theo khoá (nút, mức, ngữ cảnh, dạng câu, mới/cũ, bậc độ khó). Mỗi thiết bị ghi một phân vùng riêng,
// chỉ tăng (G-counter): gộp hai máy = lấy bản nhiều hơn của từng (thiết bị, khoá) — không mất, không đếm trùng.
export interface Agg {
  n: number;             // số lượt
  sw: number;            // Σ w
  swOk: number;          // Σ w của lượt đúng
  swgOk: number;         // Σ w·g của lượt đúng
  swBad: number;         // Σ w của lượt sai
  nov: number;           // số lượt ở câu mới
  asst: number;          // số lượt có trợ giúp
  novOk?: number;        // số lượt ĐÚNG ở câu mới
  dv?: number;           // số lần đã giảm trọng số theo lượt mới (để gộp hai máy chọn bản mới hơn)
  d0: number;            // ngày đầu
  d1: number;            // ngày cuối
  lq?: string[];         // chỉ phân vùng legacy: dạng câu đã đo trước v53
  lc?: string[];         // chỉ phân vùng legacy: ngữ cảnh đã đo trước v53
}

// Tiên nghiệm (Claim, không phải Mastery — §82): từ chẩn đoán hoặc tiến độ cũ. Chỉ dùng cho ô chưa có bằng chứng thật.
export interface Prior { a: number; b: number; src: 'diag' | 'legacy'; day: number }

// Mâu thuẫn với kết luận Đạt: đếm lượt sai ở câu mới khi đang Đạt; đủ thì mở lại (on = 1) tới khi đúng đủ ở câu mới.
export interface Dispute { bad: number; ok: number; on: 0 | 1; day: number; cw?: number }   // cw: số lần sai liên tiếp khi đang Đạt (§58)
// Một câu trả lời sai lặp lại ở cùng nút (phương án nhiễu / chữ gõ giống nhau).
export interface Mis { t: string; n: number; d: number }

// Nguyên nhân gốc đã kiểm chứng: nút `cause` (tiền đề cứng) trượt câu dò khi nút này sai lặp lại.
export interface Hyp { kind: 'prereq'; cause: string; day: number }

export interface Integrity { err: number; last: string; fixed: number }

export interface EvStore {
  v: number;                                   // phiên bản lược đồ bằng chứng
  agg: Record<string, Record<string, Record<string, Agg>>>;   // thiết bị → "nút|mức" → "ngữ cảnh|dạng câu|mới|độ khó" → thống kê
  led: EvEvent[];                              // L1
  obs: ObsRec[];                               // L0 (không đồng bộ, giữ ngắn)
  pri: Record<string, Prior>;                  // "node|level" → tiên nghiệm
  seen: Record<string, string>;                // nút → các mã băm câu đã gặp (6 ký tự mỗi câu), để biết câu mới
  seq: number;                                 // số thứ tự sự kiện của thiết bị này
  integ: Integrity;
  snap: Snapshot[];                            // L4 Decision Snapshot
  dis: Record<string, Dispute>;                // "nút|mức" → bằng chứng mâu thuẫn với kết luận Đạt (model disagreement)
  mis: Record<string, Record<string, Mis>>;    // nút → mã câu trả lời sai → số lần (giả thuyết hiểu sai)
  hyp: Record<string, Hyp>;                    // nút → giả thuyết nguyên nhân gốc đã kiểm chứng bằng câu dò (v58)
  pb: { day: number; n: number };              // số lượt dò chẩn đoán liên tục trong ngày (ngân sách §38)
  sseq?: number;
}

export const EV_SCHEMA = 1;
