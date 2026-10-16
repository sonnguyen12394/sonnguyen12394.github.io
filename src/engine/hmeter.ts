// v122 Bảng đo H (docs/GAME-CRITERIA.md §12–§13): "học xong có dùng được không", đo trên chính người học.
// Hai nguồn: sổ bằng chứng (e.ev.led: dạng câu, ngữ cảnh transfer) và nhật ký H (HLog) do game nói / nghe ghi theo ngày.
// HLog là telemetry học tập (P28: không phải bằng chứng năng lực, không vào mastery), gộp theo ngày, giữ 120 ngày.
// Luật chấm: mỗi tiêu chí đổi số đo → điểm 0–10 theo mốc của §12.1; chưa đủ số liệu thì chỉ là ước tính, tối đa 6.
// Thuần hàm.

import type { EvEvent } from './ev/types.ts';

// Một ngày: số đếm (cộng dồn), không lưu câu chữ của người học.
export interface HDay {
  sp?: number;    // lượt tự NÓI cả câu (máy nghe, ≥ 3 từ)
  ty?: number;    // lượt tự GÕ cả câu (≥ 3 từ)
  ch?: number;    // lượt CHỌN đáp án trong game nói (bậc lùi, không tính là tự tạo câu)
  lat?: number[]; // thời gian nghĩ trước khi đáp (giây ×10, tối đa 40 mẫu / ngày)
  lis?: number;   // giây nghe nội dung liền mạch (bài nghe, hội thoại nhiều lượt, tập truyện)
  rd?: number;    // giây đọc nội dung liền mạch
  l4?: [number, number];   // nghe tiếng thật (ồn nền / tốc độ thường / nhiều giọng): [đúng, tổng]
  xf?: [number, number];   // dùng ở tình huống mới ngoài sổ (câu hỏi tự đặt, dùng từ đào được trong câu): [đạt, tổng]
  r7?: [number, number];   // nhớ trễ 7–29 ngày: [nhớ, tổng]
  r30?: [number, number];  // nhớ trễ ≥ 30 ngày
  ph?: [number, number];   // cặp âm nói ra: máy nghe đúng từ [đúng, tổng]
  cv?: number;    // hội thoại nhiều lượt hoàn thành, ≥ 70% lượt được hiểu ngay
  rw?: number;    // nhiệm vụ ngoài đời đã làm (tự báo cáo)
}
export interface HLog { d: Record<string, HDay> }
export const freshH = (): HLog => ({ d: {} });
export const H_KEEP = 120;

type Pair = [number, number];
const PAIRS = ['l4', 'xf', 'r7', 'r30', 'ph'] as const;
const NUMS = ['sp', 'ty', 'ch', 'lis', 'rd', 'cv', 'rw'] as const;
export type HKind = (typeof NUMS)[number] | (typeof PAIRS)[number] | 'lat';

// Ghi một sự kiện: số đếm cộng thêm v; cặp [đúng, tổng] cộng [ok?1:0, 1]; lat thêm một mẫu (giây).
export function hAdd(h: HLog, day: number, k: HKind, v: number | boolean = 1): void {
  const d = (h.d[String(day)] ||= {});
  if (k === 'lat') { const s = Math.round(Math.max(0, Math.min(120, Number(v))) * 10); const a = (d.lat ||= []); if (a.length < 40) a.push(s); }
  else if ((PAIRS as readonly string[]).includes(k)) { const p = ((d as Record<string, Pair>)[k] ||= [0, 0]); p[0] += v ? 1 : 0; p[1] += 1; }
  else { const n = typeof v === 'number' ? v : 1; (d as Record<string, number>)[k] = Math.round(((d as Record<string, number>)[k] ?? 0) + Math.max(0, Math.min(36000, n))); }
  const ks = Object.keys(h.d).map(Number).sort((a, b) => a - b);
  for (const x of ks.slice(0, Math.max(0, ks.length - H_KEEP))) delete h.d[String(x)];
}

const nOk = (v: unknown, hi: number): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
function pairOk(v: unknown): Pair | undefined {
  if (!Array.isArray(v) || v.length !== 2) return undefined;
  const t = nOk(v[1], 1e6), o = Math.min(t, nOk(v[0], 1e6));
  return t ? [o, t] : undefined;
}
export function sanitizeH(raw: unknown): HLog | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const d0 = (raw as { d?: unknown }).d, out = freshH();
  if (!d0 || typeof d0 !== 'object') return out;
  const ks = Object.keys(d0).filter(k => /^\d{1,6}$/.test(k)).map(Number).sort((a, b) => a - b).slice(-H_KEEP);
  for (const k of ks) {
    const x = (d0 as Record<string, unknown>)[String(k)] as Record<string, unknown> | undefined;
    if (!x || typeof x !== 'object') continue;
    const d: HDay = {};
    for (const n of NUMS) { const v = nOk(x[n], 1e6); if (v) d[n] = v; }
    for (const p of PAIRS) { const v = pairOk(x[p]); if (v) d[p] = v; }
    if (Array.isArray(x.lat)) { const a = x.lat.map(v => nOk(v, 1200)).filter(v => v > 0).slice(0, 40); if (a.length) d.lat = a; }
    out.d[String(k)] = d;
  }
  return out;
}
// Gộp hai máy: mỗi ngày lấy bản lớn hơn của từng số (G-counter theo ngày: hai máy cùng ghi một ngày thì lấy số lớn, không cộng trùng).
export function mergeH(a?: HLog, b?: HLog): HLog | undefined {
  if (!a) return b; if (!b) return a;
  const out = freshH();
  for (const k of new Set([...Object.keys(a.d), ...Object.keys(b.d)])) {
    const x = a.d[k] ?? {}, y = b.d[k] ?? {}, d: HDay = {};
    for (const n of NUMS) { const v = Math.max(x[n] ?? 0, y[n] ?? 0); if (v) d[n] = v; }
    for (const p of PAIRS) { const u = x[p], w = y[p]; const v = !u ? w : !w ? u : u[1] >= w[1] ? u : w; if (v) d[p] = [v[0], v[1]]; }
    const la = (x.lat?.length ?? 0) >= (y.lat?.length ?? 0) ? x.lat : y.lat;
    if (la?.length) d.lat = la.slice();
    out.d[k] = d;
  }
  return sanitizeH(out);
}

// ---------- Chấm ----------
export type HId = 'H1' | 'H2' | 'H3' | 'H4' | 'H5' | 'H6' | 'H7' | 'H8' | 'H9' | 'H10';
export const H_IDS: HId[] = ['H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'H7', 'H8', 'H9', 'H10'];
export const H_W: Record<HId, number> = { H1: 2, H2: 2, H3: 1, H4: 1, H5: 1, H6: 1, H7: 1, H8: 1, H9: 1, H10: 1 };
export const H_VI: Record<HId, [string, string]> = {
  H1: ['Tự nói, tự viết ra câu', 'Tỉ lệ lượt bạn tự nói / tự gõ cả câu (không phải chọn đáp án). Mốc 10: ≥ 30%.'],
  H2: ['Dùng được ở tình huống mới', 'Đúng ở câu lạ, ngữ cảnh mới, câu hỏi tự đặt, dùng từ vừa tìm trong câu của mình. Mốc 10: ≥ 70%.'],
  H3: ['Lượng nghe / đọc liền mạch', 'Số phút mỗi tuần nghe / đọc bài dài, hội thoại, tập truyện. Mốc 10: ≥ 60 phút / tuần.'],
  H4: ['Nghe tiếng thật', 'Đúng khi nghe có tiếng ồn nền, tốc độ thường, giọng khác nhau. Mốc 10: ≥ 70%.'],
  H5: ['Phản xạ', 'Thời gian nghĩ trước khi đáp (trung vị 14 ngày). Mốc 10: ≤ 3 giây.'],
  H6: ['Nhớ lâu', 'Nhớ lại từ sau ≥ 30 ngày (chưa đủ thì sau ≥ 7 ngày). Mốc 10: ≥ 80%.'],
  H7: ['Sửa lỗi phát âm của người Việt', 'Nói cặp âm dễ lẫn (âm cuối, i ngắn / dài…): máy nghe ra đúng từ. Mốc 10: ≥ 85%.'],
  H8: ['Hội thoại thật', 'Hội thoại nhiều lượt hoàn thành, người kia hiểu ngay ≥ 70% lượt. Mốc 10: ≥ 3 mỗi tuần.'],
  H9: ['Đo tiến bộ trung thực', 'Đã qua bài chưa từng thấy (thi chuyển cấp); có kết quả chứng chỉ thật để đối chiếu.'],
  H10: ['Dẫn ra đời thật', 'Nhiệm vụ tiếng Anh ngoài đời mỗi tuần (tự báo cáo, nên tối đa 7). Mốc: ≥ 1 / tuần.'],
};
// Ước tính khi chưa đủ số liệu: khả năng app đang có (sau v123–v127), trần 6 theo §12.0.
export const H_EST: Record<HId, number> = { H1: 6, H2: 6, H3: 5, H4: 6, H5: 5, H6: 6, H7: 6, H8: 5, H9: 6, H10: 4 };

export interface HRow { id: HId; score: number; measured: boolean; value: string; n: number }
export interface HIn {
  log: HLog | undefined;
  led: Pick<EvEvent, 'qt' | 'ctx' | 'ok' | 'day' | 'src' | 'nov' | 'asst'>[];
  today: number;
  gate: number;        // số đề trận cổng đã làm (đề chưa thấy)
  real: number;        // số lần ghi kết quả chứng chỉ thật
}
const clamp10 = (x: number) => Math.max(0, Math.min(10, x));
// v ở mốc lo → 0 điểm, ở mốc hi → 10 điểm (hi có thể nhỏ hơn lo: số càng nhỏ càng tốt).
export const lin = (v: number, lo: number, hi: number): number => Math.round(clamp10((10 * (v - lo)) / (hi - lo)) * 10) / 10;
const pct = (x: number) => `${Math.round(x * 100)}%`;
function median(a: number[]): number { const s = a.slice().sort((x, y) => x - y), m = s.length >> 1; return s.length ? (s.length % 2 ? s[m]! : (s[m - 1]! + s[m]!) / 2) : 0; }

export function hScore(x: HIn): { rows: HRow[]; total: number; measured: number } {
  const days = (n: number) => Object.entries(x.log?.d ?? {}).filter(([k]) => x.today - Number(k) < n).map(([, v]) => v);
  const d28 = days(28), d14 = days(14);
  const sum = (ds: HDay[], k: (typeof NUMS)[number]) => ds.reduce((a, d) => a + (d[k] ?? 0), 0);
  const pair = (ds: HDay[], k: (typeof PAIRS)[number]): Pair => ds.reduce<Pair>((a, d) => { const p = d[k]; return p ? [a[0] + p[0], a[1] + p[1]] : a; }, [0, 0]);
  const led = x.led.filter(e => x.today - e.day < 28);
  const rows: HRow[] = [];
  const row = (id: HId, n: number, need: number, score: number, value: string) => {
    const measured = n >= need;
    rows.push({ id, n, measured, score: measured ? score : Math.min(6, Math.max(H_EST[id], n ? Math.min(score, 6) : 0)), value });
  };
  // H1: lượt tự tạo cả câu / mọi lượt trả lời (sổ bằng chứng: mọi câu; nhật ký: lượt nói / gõ / chọn của game nói).
  { const prod = sum(d28, 'sp') + sum(d28, 'ty'), all = prod + sum(d28, 'ch') + led.length, s = all ? prod / all : 0;
    row('H1', all, 60, lin(s, 0, 0.3), all ? `${pct(s)} lượt tự nói / gõ cả câu (${prod}/${all})` : 'chưa có lượt nào'); }
  // H2: câu ngữ cảnh transfer / câu lạ (lần đầu gặp, không trợ giúp) của sổ + dùng mới ngoài sổ (nhật ký).
  { const t = led.filter(e => e.ctx === 'transfer' || e.ctx === 'use'), p = pair(d28, 'xf'), ok = t.filter(e => e.ok).length + p[0], n = t.length + p[1], s = n ? ok / n : 0;
    row('H2', n, 12, lin(s, 0.3, 0.7), n ? `${pct(s)} đúng ở tình huống mới (${ok}/${n})` : 'chưa có lượt ở tình huống mới'); }
  // H3: phút nghe + đọc liền mạch, trung bình mỗi tuần trong 28 ngày.
  { const sec = sum(d28, 'lis') + sum(d28, 'rd'), wk = sec / 60 / 4, active = d28.filter(d => (d.lis ?? 0) + (d.rd ?? 0) > 0).length;
    row('H3', active, 3, lin(wk, 0, 60), `${Math.round(wk)} phút / tuần`); }
  // H4: nghe tiếng thật.
  { const p = pair(d28, 'l4'), s = p[1] ? p[0] / p[1] : 0; row('H4', p[1], 15, lin(s, 0.3, 0.7), p[1] ? `${pct(s)} đúng (${p[0]}/${p[1]})` : 'chưa nghe bài có tiếng ồn / giọng khác'); }
  // H5: trung vị thời gian nghĩ 14 ngày.
  { const a = d14.flatMap(d => d.lat ?? []).map(v => v / 10), m = median(a); row('H5', a.length, 12, lin(m, 10, 3), a.length ? `trung vị ${m.toFixed(1)} giây` : 'chưa đo'); }
  // H6: nhớ trễ ≥ 30 ngày; chưa đủ thì 7–29 ngày (cả hai lấy 120 ngày vì nhớ trễ hiếm).
  { const all = days(H_KEEP), p30 = pair(all, 'r30'), p7 = pair(all, 'r7'), p = p30[1] >= 10 ? p30 : [p30[0] + p7[0], p30[1] + p7[1]] as Pair, s = p[1] ? p[0] / p[1] : 0;
    row('H6', p[1], 10, lin(s, 0.4, 0.8), p[1] ? `${pct(s)} nhớ lại sau ${p30[1] >= 10 ? '≥ 30' : '≥ 7'} ngày (${p[0]}/${p[1]})` : 'chưa có từ nào tới hạn nhớ trễ'); }
  // H7: cặp âm nói ra.
  { const p = pair(d28, 'ph'), s = p[1] ? p[0] / p[1] : 0; row('H7', p[1], 20, lin(s, 0.4, 0.85), p[1] ? `${pct(s)} máy nghe ra đúng từ (${p[0]}/${p[1]})` : 'chưa nói cặp âm'); }
  // H8: hội thoại nhiều lượt đạt mỗi tuần.
  { const n = sum(d28, 'cv'), wk = n / 4; row('H8', n, 3, lin(wk, 0, 3), `${wk.toFixed(1)} hội thoại / tuần`); }
  // H9: trận cổng (đề chưa thấy) + kết quả chứng chỉ thật.
  { const s = x.gate ? (x.real ? 10 : 8) : 5; row('H9', x.gate, 1, s, x.gate ? `${x.gate} đề chưa thấy${x.real ? ` · ${x.real} kết quả chứng chỉ thật` : ''}` : 'chưa làm thi chuyển cấp'); }
  // H10: nhiệm vụ ngoài đời (tự báo cáo → trần 7).
  { const n = sum(d28, 'rw'), wk = n / 4; row('H10', n, 2, Math.min(7, lin(wk, 0, 1)), `${n} nhiệm vụ trong 4 tuần`); }
  const W = H_IDS.reduce((a, id) => a + H_W[id], 0);
  const total = Math.round((rows.reduce((a, r) => a + r.score * H_W[r.id], 0) / W) * 10) / 10;
  return { rows, total, measured: rows.filter(r => r.measured).length };
}
