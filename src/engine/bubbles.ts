// Bắt Âm (v76, F4 phát âm): nghe một từ (giọng máy) → chạm đúng bong bóng trong 3 (2 từ của cặp âm + 1 từ khác: đoán mò chỉ trúng 1/3).
// Học là luật chơi (G1): bắt bong bóng = phân biệt âm. Không hết giờ (P15); bong bóng trôi chỉ để đẹp. Combo / màn là telemetry (P13).
// Hình bong bóng vẽ bằng CSS, âm thanh WebAudio của app.

import { rand } from './blocks.ts';

export const WORDS = 10;
export const HUES = [200, 160, 280, 20, 330, 45];
// Vị trí / màu / độ trễ trôi của 3 bong bóng theo seed (độc lập với câu hỏi).
export function layout(seed: number, n: number): Array<{ x: number; hue: number; delay: number }> {
  const r = rand(seed + n * 4211), xs = [12, 42, 72].map(x => x + Math.floor(r() * 10) - 5);
  return xs.map(x => ({ x, hue: HUES[Math.floor(r() * HUES.length)]!, delay: Math.round(r() * 600) }));
}
// Cỡ bong bóng theo chuỗi đúng (chỉ là hiệu ứng game).
export const size = (streak: number): number => Math.min(1.35, 1 + streak * 0.07);
// Điểm game: 10 + 5 × chuỗi; sai 0 (không trừ).
export const points = (ok: boolean, streak: number): number => (ok ? 10 + 5 * Math.max(0, streak - 1) : 0);

export interface BubblesSave { best: number; runs: number; stage: number; day: number }
export const freshBubblesSave = (): BubblesSave => ({ best: 0, runs: 0, stage: 1, day: 0 });
export function sanitizeBubbles(raw: unknown): BubblesSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number, d = 0) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : d);
  return { best: n(x.best, 1e9), runs: n(x.runs, 1e7), stage: Math.max(1, n(x.stage, 1e5, 1)), day: n(x.day, 1e6) };
}
export function mergeBubbles(a?: BubblesSave, b?: BubblesSave): BubblesSave | undefined {
  if (!a) return b; if (!b) return a;
  return { best: Math.max(a.best, b.best), runs: Math.max(a.runs, b.runs), stage: Math.max(a.stage, b.stage), day: Math.max(a.day, b.day) };
}
