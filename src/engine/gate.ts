// Trận cổng cuối khu (docs/SPEC.md "Mô hình học v111" §3–§4, mục "Đề sát hạch và chống học tủ"). Thuần hàm.
// Kết luận "đủ trình độ" chỉ đến từ câu LẠ: đề soạn mới (content/exam/gate, mode "gate"), đóng gói riêng nên không bao giờ lẫn vào
// luyện tập / xếp lớp / game; mỗi đề chơi một lần. P(đậu) = xác suất năng lực ≥ ngưỡng của cấp, ước lượng IRT 3PL (src/exam/irt.ts)
// kèm sai số; đậu khi P ≥ 80% (READY_P). Độ khó câu là ước tính của người soạn (chưa hiệu chỉnh bằng dữ liệu), nên P là ước tính.
// Viết / Nói không vào phán quyết cổng (chỉ tin cậy Vừa khi chưa có AI, SPEC mục 10): trang tiến độ hiện từ bài Thư / Karaoke.

import { estimate, type Response } from '../exam/irt.ts';

export const GATE = { open: 0.7, ready: 0.8, sd: 1.5 } as const;
// Ngưỡng trên thang band của bộ chấm (src/exam/scales.ts CEFR_TABLE: A1 từ band 1, A2 từ band 3; làm tròn 0,5 nên ngưỡng thật là −0,25).
export const GATE_THR: Record<string, number> = { 'cefr-a1': 0.75, 'cefr-a2': 2.75 };
export const GATE_FORMS: Record<string, string[]> = { 'cefr-a1': ['a1-1', 'a1-2'], 'cefr-a2': ['a2-1', 'a2-2'] };
// Đặc tả tham chiếu (soát 11/10/2026, nguồn công khai về định dạng A2 Key từ 2020: Đọc 30 câu / 5 phần, Viết 2 phần, Nghe 25 câu / 5 phần,
// thang Cambridge 120–139 = A2). Đề cổng là bản rút gọn cùng kiểu bài (biển báo / tin nhắn, bài đọc ngắn, điền từ, hội thoại ngắn, hội thoại dài).
export const GATE_SPEC: Record<string, string> = { 'cefr-a1': 'soạn theo mô tả CEFR A1 (không có bài Cambridge cho người lớn ở cấp này, chưa có đề ngoài để đối chiếu)', 'cefr-a2': 'soạn theo đặc tả công khai của A2 Key (rút gọn)' };

export interface GateAns { skill: 'R' | 'L'; b: number; g: number; ok: boolean }
export interface GateSkill { n: number; ok: number; theta: number; se: number }
export interface GateResult { form: string; goal: string; day: number; n: number; ok: number; theta: number; se: number; p: number; lo: number; hi: number; passed: boolean; secs: number; sk: Partial<Record<'R' | 'L', GateSkill>> }
export interface GateSave { done: Record<string, GateResult>; seen?: string[]; cert?: 1;   // cert: người học bật "thi lấy chứng chỉ" (tuỳ chọn ở hồ sơ)
   // seen: đề đã mở (câu đã lộ) dù chưa xong: không dùng lại
  ext?: Array<{ goal: string; day: number; score: number; pass: boolean; pred: number | null; src: 'sample' | 'real' }> }

// Thang Cambridge English Scale: điểm tối thiểu được công nhận từng cấp (nguồn công khai: A2 Key 120–139 = A2, 140–150 = B1;
// B1 Preliminary từ 140; B2 First từ 160; C1 Advanced từ 180; C2 Proficiency từ 200). A1 / Pre-A1 không có bài cho người lớn.
export const CES_MIN: Record<string, number> = { 'cefr-a2': 120, 'cefr-b1': 140, 'cefr-b2': 160, 'cefr-c1': 180, 'cefr-c2': 200 };
// Khả năng qua gần nhất của app cho cấp này (để chốt dự đoán trước khi nhập điểm ngoài).
export const lastP = (sv: GateSave | undefined, goal: string): number | null => { const xs = Object.values(sv?.done ?? {}).filter(r => r.goal === goal).sort((a, b) => a.day - b.day); return xs.length ? xs.at(-1)!.p : null; };

// Hàm phân phối chuẩn (xấp xỉ Abramowitz–Stegun 7.1.26, sai số < 1,5e-7).
export function phi(z: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(z) / Math.SQRT2), y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-(z * z) / 2);
  return z >= 0 ? (1 + y) / 2 : (1 - y) / 2;
}

const est = (xs: GateAns[], thr: number) => estimate(xs.map((a): Response => ({ item: { b: a.b, c: a.g }, correct: a.ok })), { mean: thr, sd: GATE.sd });

// Chấm một trận cổng. Tiên nghiệm đặt đúng ngưỡng (trung lập: chưa làm câu nào thì P = 50%).
export function gateScore(goal: string, form: string, ans: GateAns[], day: number, secs: number): GateResult {
  const thr = GATE_THR[goal] ?? 2.75, e = est(ans, thr), se = Math.max(0.15, e.se), p = 1 - phi((thr - e.theta) / se);
  const sk: GateResult['sk'] = {};
  for (const k of ['R', 'L'] as const) { const xs = ans.filter(a => a.skill === k); if (xs.length) { const s = est(xs, thr); sk[k] = { n: xs.length, ok: xs.filter(a => a.ok).length, theta: s.theta, se: s.se }; } }
  const r2 = (x: number) => Math.round(x * 100) / 100;
  return { form, goal, day, n: ans.length, ok: ans.filter(a => a.ok).length, theta: r2(e.theta), se: r2(se), p: r2(p), lo: r2(e.theta - 1.28 * se), hi: r2(e.theta + 1.28 * se), passed: p >= GATE.ready, secs, sk };
}

// Cổng mở khi bản đồ báo gần đủ (tỉ lệ kỹ năng của mục tiêu đã vững thật ≥ GATE.open) hoặc người học đã qua một lần đề trước mà rớt
// (vẫn cần đề lạ còn lại). Trận cổng là tài nguyên có hạn: mở sớm thì phí đề và kết quả "chưa đậu" ai cũng đoán trước được (P10).
export function gateState(goal: string, solid: number, total: number, sv: GateSave | undefined): { has: boolean; open: boolean; left: string[]; passed: GateResult | null; last: GateResult | null; ratio: number } {
  const forms = GATE_FORMS[goal] ?? [], done = sv?.done ?? {}, left = forms.filter(f => !done[f] && !(sv?.seen ?? []).includes(f));
  const mine = Object.values(done).filter(r => r.goal === goal).sort((a, b) => a.day - b.day);
  const passed = mine.find(r => r.passed) ?? null, last = mine.at(-1) ?? null, ratio = total ? solid / total : 0;
  return { has: forms.length > 0, open: !passed && left.length > 0 && ratio >= GATE.open, left, passed, last, ratio };
}

export function sanitizeGate(x: unknown): GateSave | undefined {
  if (!x || typeof x !== 'object') return undefined;
  const o = x as Record<string, unknown>, out: GateSave = { done: {} }, num = (v: unknown, lo: number, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : lo);
  for (const [k, v] of Object.entries((o.done ?? {}) as Record<string, unknown>)) {
    if (!/^[a-z0-9-]{2,20}$/.test(k) || !v || typeof v !== 'object') continue;
    const r = v as Record<string, unknown>, goal = String(r.goal ?? '');
    if (!GATE_THR[goal]) continue;
    const sk: GateResult['sk'] = {};
    for (const s of ['R', 'L'] as const) { const q = (r.sk as Record<string, Record<string, unknown>> | undefined)?.[s]; if (q) sk[s] = { n: num(q.n, 0, 99), ok: num(q.ok, 0, 99), theta: num(q.theta, 0, 9), se: num(q.se, 0, 9) }; }
    out.done[k] = { form: k, goal, day: num(r.day, 0, 1e6), n: num(r.n, 0, 99), ok: num(r.ok, 0, 99), theta: num(r.theta, 0, 9), se: num(r.se, 0, 9), p: num(r.p, 0, 1), lo: num(r.lo, -9, 9), hi: num(r.hi, 0, 18), passed: r.passed === true, secs: num(r.secs, 0, 1e5), sk };
  }
  if (o.cert === 1) out.cert = 1;
  if (Array.isArray(o.seen)) { const seen = [...new Set(o.seen.filter((f): f is string => typeof f === 'string' && /^[a-z0-9-]{2,20}$/.test(f)))].slice(-40); if (seen.length) out.seen = seen; }
  if (Array.isArray(o.ext)) out.ext = o.ext.slice(-20).filter((e): e is Record<string, unknown> => !!e && typeof e === 'object').filter(e => !!GATE_THR[String(e.goal)])
    .map(e => ({ goal: String(e.goal), day: num(e.day, 0, 1e6), score: num(e.score, 0, 250), pass: e.pass === true, pred: typeof e.pred === 'number' ? num(e.pred, 0, 1) : null, src: e.src === 'real' ? 'real' : 'sample' }));
  return out;
}
// Gộp hai máy: kết quả đề nào cũng giữ bản làm sớm hơn (lần đầu mới là đề lạ); điểm ngoài lấy hợp.
export function mergeGate(a: GateSave | undefined, b: GateSave | undefined): GateSave | undefined {
  if (!a || !b) return a ?? b;
  const done = { ...b.done };
  for (const [k, v] of Object.entries(a.done)) if (!done[k] || v.day <= done[k]!.day) done[k] = v;
  const ext = [...(a.ext ?? []), ...(b.ext ?? [])].filter((e, i, xs) => xs.findIndex(y => y.day === e.day && y.goal === e.goal && y.score === e.score) === i).sort((x, y) => x.day - y.day);
  const seen = [...new Set([...(a.seen ?? []), ...(b.seen ?? [])])];
  return { done, ...(a.cert || b.cert ? { cert: 1 as const } : {}), ...(seen.length ? { seen } : {}), ...(ext.length ? { ext } : {}) };
}
