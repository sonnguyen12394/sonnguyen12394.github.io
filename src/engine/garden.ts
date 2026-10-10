// Vườn từ (v87, F2 học từ mới): mỗi từ mới là một cây, lớn theo đúng bậc học từ (F2a):
//   🌰 hạt = thẻ dạy trước (hình, phiên âm, 🔊, câu ví dụ — F2b/F2c) → 🌱 mầm = nhận ra (từ → nghĩa, 4 lựa chọn, mức 1)
//   → 🌿 cây = nhớ ngược (nghĩa → từ, 4 lựa chọn, mức 2) → 🌸 hoa = tự gõ (nghĩa → từ, mức 3, g = 0).
// Đúng thì lên một bậc, sai thì ở lại và xem lại thẻ. Mỗi từ lên tối đa một bậc mỗi ngày (giãn cách, F10). Câu trả lời là bằng chứng của nút
// cụm từ (u:) với cùng mã câu như câu dò của tháp ('w:<id>:vi|word|typ'). Vườn (bậc của từng cây) là tiến trình của chính câu trả lời,
// không phải điểm game; sao / số hoa là telemetry (P13). Thuần hàm, theo seed. Không tính giờ, sai không mất gì.

import { rand } from './blocks.ts';
import type { GWord } from './host.ts';

export const STAGE = ['🌰', '🌱', '🌿', '🌸'] as const;
export const STAGE_VI = ['hạt', 'mầm', 'cây', 'hoa'] as const;
export const PER_DAY = 6;
export interface Plant { n: string; s: number; d: number }   // n: nút cụm từ; s: bậc 0–3; d: ngày lên bậc gần nhất
export interface GardenSave { runs: number; blooms: number; day: number; plants: Record<string, Plant> }
export const freshGardenSave = (): GardenSave => ({ runs: 0, blooms: 0, day: 0, plants: {} });

// Từ cho hôm nay: cây đang lớn (chưa nở, chưa lên bậc hôm nay) trước — cây gieo lâu nhất trước; còn chỗ thì gieo từ mới của cụm engine chọn.
export function pickToday(plants: Record<string, Plant>, fresh: Array<{ id: string; n: string }>, today: number, n = PER_DAY): Array<{ id: string; n: string }> {
  const grow = Object.entries(plants).filter(([, p]) => p.s < 3 && p.d < today).sort((a, b) => a[1].d - b[1].d || a[1].s - b[1].s).map(([id, p]) => ({ id, n: p.n }));
  const out = grow.slice(0, n);
  for (const w of fresh) { if (out.length >= n) break; if (!plants[w.id] && !out.some(x => x.id === w.id)) out.push(w); }
  return out;
}
export interface GItem { id: string; level: 1 | 2 | 3; g: number; prompt: string; opts?: string[]; ans?: number; accept?: string[] }
// Câu cho bậc kế tiếp của một từ. Nhiễu: từ khác cùng cấp (pool) — khác nghĩa / khác chữ với từ đích.
export function itemFor(w: GWord, next: 1 | 2 | 3, pool: Array<{ en: string; vi: string }>, seed: number): GItem {
  const r = rand(seed), sh = <T,>(xs: T[]) => { const a = xs.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j]!, a[i]!]; } return a; };
  if (next === 3) return { id: `w:${w.id}:typ`, level: 3, g: 0, prompt: `Gõ từ tiếng Anh nghĩa là “${w.vi}”${w.pos ? ` (${w.pos})` : ''}`, accept: [w.en] };
  const k = next === 1 ? 'vi' : 'en', right = next === 1 ? w.vi : w.en;
  const others = sh(pool.filter(p => p.en.toLowerCase() !== w.en.toLowerCase() && p.vi.toLowerCase() !== w.vi.toLowerCase()).map(p => (k === 'vi' ? p.vi : p.en)));
  const opts = sh([right, ...[...new Set(others)].slice(0, 3)]);
  return next === 1
    ? { id: `w:${w.id}:vi`, level: 1, g: 1 / opts.length, prompt: `“${w.en}” nghĩa là gì?`, opts, ans: opts.indexOf(right) }
    : { id: `w:${w.id}:word`, level: 2, g: 1 / opts.length, prompt: `Từ nào nghĩa là “${w.vi}”?`, opts, ans: opts.indexOf(right) };
}
// Kết quả một câu: đúng → lên bậc (ghi ngày); sai → giữ bậc (phải xem lại thẻ).
export function grow(p: Plant | undefined, n: string, ok: boolean, today: number): Plant {
  const cur = p ?? { n, s: 0, d: 0 };
  return ok ? { n: cur.n || n, s: Math.min(3, cur.s + 1), d: today } : { ...cur, n: cur.n || n };
}

const MAX_PLANTS = 2000;
export function sanitizeGarden(raw: unknown): GardenSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const plants: Record<string, Plant> = {};
  if (x.plants && typeof x.plants === 'object') for (const [id, p] of Object.entries(x.plants as Record<string, unknown>).slice(0, MAX_PLANTS)) {
    const q = p as Record<string, unknown> | null;
    if (!q || typeof q !== 'object' || typeof q.n !== 'string' || !/^u:[\w-]{1,40}$/.test(q.n) || !/^[\w'’ -]{1,60}$/.test(id)) continue;
    plants[id] = { n: q.n, s: n(q.s, 3), d: n(q.d, 1e6) };
  }
  return { runs: n(x.runs, 1e7), blooms: n(x.blooms, 1e7), day: n(x.day, 1e6), plants };
}
// Gộp hai máy: mỗi cây lấy bậc cao hơn (bậc chỉ lên khi trả lời đúng ở máy đó).
export function mergeGarden(a?: GardenSave, b?: GardenSave): GardenSave | undefined {
  if (!a) return b; if (!b) return a;
  const plants: Record<string, Plant> = { ...a.plants };
  for (const [id, p] of Object.entries(b.plants)) { const q = plants[id]; if (!q || p.s > q.s || (p.s === q.s && p.d > q.d)) plants[id] = p; }
  return { runs: Math.max(a.runs, b.runs), blooms: Math.max(a.blooms, b.blooms), day: Math.max(a.day, b.day), plants };
}
