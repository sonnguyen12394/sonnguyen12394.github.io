// Chẩn đoán liên tục (spec v2.4 §46–48, §38–39, §50; C131–C140, C281–C300). Thuần hàm để test được.
// Không có "bài chẩn đoán xong là hết": mỗi lần tính lộ trình, engine hỏi "thêm bằng chứng ở đâu có khả năng ĐỔI QUYẾT ĐỊNH nhất
// trên mỗi đơn vị nỗ lực?" (P10). Năm chế độ:
//   explore  — nút trong biên lộ trình chưa có bằng chứng nào: biết hay chưa?
//   confirm  — nút chỉ có tiên nghiệm (suy ra từ chẩn đoán): xác nhận Claim trước khi bỏ qua hẳn
//   boundary — mastery sát ngưỡng 0,8: một hai câu nữa sẽ quyết định Đạt hay không
//   verify   — nút "cần xác minh" (mức 4–5 chưa đúng câu mới) hoặc "mở lại" (bằng chứng mâu thuẫn)
//   root     — nút sai lặp lại: dò TIỀN ĐỀ CỨNG của nó; tiền đề trượt → giả thuyết "thiếu tiền đề" đã kiểm chứng (C150)
// Giá trị thông tin = xác suất một câu trả lời nữa làm đổi kết luận Đạt/chưa Đạt + mức giảm độ lệch chuẩn; chia cho nỗ lực (phút).
// Dừng khi giá trị tốt nhất dưới ngưỡng hoặc hết ngân sách trong ngày (§39 Stop When Sufficient).

import { stat, PASS_M, type Cell, type MasteryStore } from './mastery.ts';
import type { Index } from './graph.ts';
import type { Level, Req } from './types.ts';

export type Mode = 'explore' | 'confirm' | 'boundary' | 'verify' | 'root';
export const MODE_VI: Record<Mode, string> = {
  explore: 'Khám phá: bạn biết phần này chưa?', confirm: 'Xác nhận: lúc xếp lớp app đoán là bạn biết, thử lại nhanh',
  boundary: 'Ranh giới: vài câu nữa sẽ quyết định Đạt hay chưa', verify: 'Xác minh: cần đúng ở câu mới',
  root: 'Truy gốc: bạn sai phần sau nhiều lần, thử phần nền của nó',
};
export interface ProbeCand { node: string; level: Level; mode: Mode; eig: number; effort: number; score: number; for?: string }
export const PROBE = { minScore: 0.15, budget: 6, effort: 1.5, rootFails: 3 } as const;   // effort: phút cho một lượt dò 3 câu

const SLIP = 0.1;
// Ô sau khi thêm một câu đúng / sai (trọng số 1, câu tự gõ).
const after = (c: Cell | undefined, ok: boolean): Cell => {
  const x = c ?? { a: 1, b: 1, n: 0, q: [], c: [], d: 0 };
  const base = x.n <= 0 && x.b > x.a ? { ...x, a: 1, b: 1 } : x;   // Claim "chưa biết" bị bỏ khi có câu trả lời thật (như derive)
  return { ...base, a: base.a + (ok ? 1 : 0), b: base.b + (ok ? 0 : 1 - SLIP), n: base.n + 1, ro: undefined, vf: undefined };
};
// Giá trị thông tin kỳ vọng của MỘT câu nữa ở ô này: P(đổi kết luận) + độ giảm sd kỳ vọng.
export function eig(c: Cell | undefined): number {
  const s = stat(c), pOk = c && c.n > 0 ? s.m : 0.5;
  const up = stat(after(c, true)), dn = stat(after(c, false));
  const flip = pOk * (up.pass !== s.pass ? 1 : 0) + (1 - pOk) * (dn.pass !== s.pass ? 1 : 0);
  const sdDrop = Math.max(0, s.sd - (pOk * up.sd + (1 - pOk) * dn.sd));
  return Math.round((flip + 4 * sdDrop) * 1000) / 1000;
}

// Số lượt sai gần đây của một ô (từ ô: β có trọng số gần đây; ô dẫn xuất đã giảm bằng chứng cũ ngược chiều).
const fails = (c: Cell | undefined): number => (c ? Math.round((c.b - 1) / (1 - SLIP)) : 0);

export interface ProbeIn {
  ix: Index;
  m: MasteryStore;
  need: Req[];                     // bao đóng mục tiêu (nút + mức cần)
  open: Set<string>;               // biên lộ trình (nút đã đủ tiền đề)
  probeable: (node: string) => boolean;   // nút có câu dò
}

export function candidates(p: ProbeIn): ProbeCand[] {
  // Một nút có thể được nhiều chế độ đề xuất (ví dụ vừa là biên lộ trình, vừa là tiền đề cần truy gốc): giữ chế độ ưu tiên cao nhất.
  const RANK: Record<Mode, number> = { root: 4, verify: 3, confirm: 2, boundary: 1, explore: 0 };
  const best = new Map<string, ProbeCand>();
  // v71 (bot L03): độ phủ theo vùng kỹ năng (từ vựng / ngữ pháp / nghe…): vùng mới có bằng chứng ở rất ít phần thì một câu khám phá ở đó
  // đáng giá hơn (biết thêm cả một kỹ năng, không chỉ một nút). Trước đây khám phá luôn thua xác nhận Claim → 25/26 phần nghe chưa từng
  // được hỏi suốt 44 ngày, app không thể thấy người học nghe yếu.
  const area = (id: string) => id.split(':')[0]!, cov = new Map<string, [number, number]>();
  for (const r of p.need) {
    if (!p.probeable(r.node)) continue;
    const k = area(r.node), x = cov.get(k) ?? [0, 0], ev = Object.values(p.m[r.node] ?? {}).some(c => (c?.n ?? 0) > 0);
    cov.set(k, [x[0] + (ev ? 1 : 0), x[1] + 1]);
  }
  const thin = (id: string) => { const x = cov.get(area(id)); return x && x[1] >= 4 ? Math.max(0, 0.6 - 1.2 * (x[0] / x[1])) : 0; };   // phủ 0% → +0,6; ≥ 50% → 0
  const push = (node: string, level: Level, mode: Mode, forNode?: string) => {
    if (!p.probeable(node)) return;
    const cur = best.get(node);
    if (cur && RANK[cur.mode] >= RANK[mode]) return;
    const c = p.m[node]?.[level], e = eig(c), effort = PROBE.effort;
    let bonus = mode === 'root' ? 0.8 : mode === 'verify' ? 0.3 : mode === 'confirm' ? 0.2 : 0;
    if (mode === 'explore') bonus += 0.1 + thin(node);
    best.set(node, { node, level, mode, eig: e, effort, score: Math.round(((e + bonus) / effort) * 1000) / 1000, ...(forNode ? { for: forNode } : {}) });
  };
  for (const r of p.need) {
    const c = p.m[r.node]?.[r.level], s = stat(c);
    if (s.state === 'reopened' || s.state === 'verify') push(r.node, r.level, 'verify');
    else if (s.state === 'inferred') push(r.node, r.level, 'confirm');
    else if (s.state === 'learning' && fails(c) >= PROBE.rootFails && s.m < 0.6) {
      // Truy gốc: tiền đề cứng chưa có bằng chứng thật đủ → dò tiền đề trước khi dạy lại nút này (§50).
      for (const e of p.ix.pre.get(r.node) ?? []) {
        if (e.type !== 'hard') continue;
        const lv = (p.need.find(x => x.node === e.to)?.level ?? 3) as Level, ps = stat(p.m[e.to]?.[lv]);
        if (ps.state !== 'mastered' || ps.conf === 'low') push(e.to, lv, 'root', r.node);
      }
    } else if (s.n >= 3 && Math.abs(s.m - PASS_M) < 0.08 && !s.pass) push(r.node, r.level, 'boundary');
    else if (!c && p.open.has(r.node)) push(r.node, r.level, 'explore');
  }
  return [...best.values()].sort((a, b) => b.score - a.score || (a.node < b.node ? -1 : 1));
}

// Chọn câu dò tiếp theo, hoặc null khi đã đủ (giá trị thấp) hoặc hết ngân sách trong ngày.
export function nextProbe(p: ProbeIn, usedToday: number): ProbeCand | null {
  if (usedToday >= PROBE.budget) return null;
  const best = candidates(p)[0];
  return best && best.score >= PROBE.minScore ? best : null;
}

// Giả thuyết nguyên nhân gốc sau khi dò tiền đề: trượt → thiếu tiền đề (đã kiểm chứng bằng chính câu dò).
export interface Hyp { kind: 'prereq'; cause: string; day: number }
export function rootVerdict(got: number, of: number): 'gap' | 'ok' | 'unclear' {
  if (!of) return 'unclear';
  const r = got / of;
  return r <= 1 / 3 ? 'gap' : r >= 2 / 3 ? 'ok' : 'unclear';
}
