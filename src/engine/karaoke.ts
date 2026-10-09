// Karaoke hội thoại (v81, F8 nói): đóng một vai trong hội thoại có sẵn, nghe câu mẫu (giọng máy) rồi nói theo; máy nghe giọng của trình
// duyệt cho biết nó nghe ra những từ nào (khớp từ với câu mẫu). Máy không nghe được giọng thì tự chấm (như màn Đóng vai).
// Kết quả lưu như màn Đóng vai (Can-Do nói). Không vào mức thuộc của nút: nhận diện giọng chỉ là phản hồi (G3, quy định chung của app).
// Thuần hàm. Điểm / combo / sao là telemetry (P13). Không tính giờ (P15). Tên, luật của app (thể loại "hát theo lời").

import { rand } from './blocks.ts';
import type { Dialog } from './host.ts';

export const ROLE = 'B';   // người học nói vai B (vai A do máy đọc)
// Chọn hội thoại: chưa đóng vai trước, rồi "khó", rồi "được"; trong cùng nhóm, hội thoại có chức năng giao tiếp đang học (lộ trình) trước.
export function pick(ds: Dialog[], want: string[], seed: number, last = ''): Dialog | null {
  const r = rand(seed), tie = new Map(ds.map(d => [d.id, r()])), w = new Set(want);
  const rank = (d: Dialog) => ({ null: 0, hard: 1, ok: 2, easy: 3 } as Record<string, number>)[String(d.rp)]! * 2 + (d.fn.some(f => w.has(f)) ? 0 : 1) + (d.id === last ? 10 : 0);
  return [...ds].sort((a, b) => rank(a) - rank(b) || tie.get(a.id)! - tie.get(b.id)!)[0] ?? null;
}
// Điểm một câu: tỉ lệ từ máy nghe ra (0–1) × 100, combo khi ≥ 0,8 nhiều câu liền.
export function linePoints(p: number, combo: number): number { return Math.round(Math.max(0, Math.min(1, p)) * 100) + (p >= 0.8 ? Math.min(combo, 5) * 10 : 0); }
// Kết quả cả vai từ trung bình các câu của vai (câu bỏ qua = 0): như nút Dễ / Được / Khó của màn Đóng vai.
export function verdict(ps: number[]): 'easy' | 'ok' | 'hard' {
  const m = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 0;
  return m >= 0.8 ? 'easy' : m >= 0.6 ? 'ok' : 'hard';
}
export const karaStars = (k: 'easy' | 'ok' | 'hard'): number => (k === 'easy' ? 3 : k === 'ok' ? 2 : 1);

export interface KaraSave { runs: number; best: number; lines: number; day: number }
export const freshKaraSave = (): KaraSave => ({ runs: 0, best: 0, lines: 0, day: 0 });
export function sanitizeKara(raw: unknown): KaraSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { runs: n(x.runs, 1e7), best: n(x.best, 1e7), lines: n(x.lines, 1e8), day: n(x.day, 1e6) };
}
export function mergeKara(a?: KaraSave, b?: KaraSave): KaraSave | undefined {
  if (!a) return b; if (!b) return a;
  return { runs: Math.max(a.runs, b.runs), best: Math.max(a.best, b.best), lines: Math.max(a.lines, b.lines), day: Math.max(a.day, b.day) };
}
