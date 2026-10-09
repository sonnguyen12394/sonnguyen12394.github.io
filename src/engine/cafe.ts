// Quán Cà Phê (v75, F5 nghe + F7 giao tiếp): mỗi ca 6 khách; khách nói (giọng máy) → hiểu ý / chọn câu đáp đúng văn phong.
// Học là luật chơi (G1): phục vụ khách = nghe hiểu và giao tiếp đúng. Sao / đồ trang trí là telemetry (P13); sai không mất gì (G9).
// Khách và đồ trang trí vẽ bằng emoji / CSS, tên quán và luật là của app (thể loại "quán phục vụ khách").

import { rand } from './blocks.ts';

export const GUESTS = 6;
// Emoji một ký tự (không ghép ZWJ): máy cũ / font thiếu không hiện thành ô vuông.
export const FACES = ['👨', '👩', '👴', '👵', '🧔', '👱', '👦', '👧', '🧓', '🙋'];
// Đồ trang trí mở theo tổng số sao (chỉ để ngắm).
export const DECOR: Array<{ at: number; ico: string; vi: string }> = [
  { at: 5, ico: '🪴', vi: 'Chậu cây' }, { at: 12, ico: '💡', vi: 'Đèn vàng' }, { at: 22, ico: '🖼️', vi: 'Tranh tường' },
  { at: 35, ico: '🎵', vi: 'Nhạc nhẹ' }, { at: 50, ico: '🐈', vi: 'Mèo của quán' }, { at: 70, ico: '🧁', vi: 'Tủ bánh' }, { at: 95, ico: '🌸', vi: 'Hoa cửa sổ' },
];
export const decorOf = (stars: number) => DECOR.filter(d => stars >= d.at);
// Khách của ca: mặt theo seed (độc lập với câu hỏi).
export const face = (seed: number, k: number): string => FACES[Math.floor(rand(seed + k * 31337)() * FACES.length)]!;
// Sao của một khách: đúng 1 sao, đúng 3 khách liền trở lên 2 sao; sai 0 (không trừ).
export const stars = (ok: boolean, streak: number): number => (!ok ? 0 : streak >= 3 ? 2 : 1);

export interface CafeSave { stars: number; runs: number; best: number; day: number }
export const freshCafeSave = (): CafeSave => ({ stars: 0, runs: 0, best: 0, day: 0 });
export function sanitizeCafe(raw: unknown): CafeSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  return { stars: n(x.stars, 1e7), runs: n(x.runs, 1e7), best: n(x.best, 1e4), day: n(x.day, 1e6) };
}
export function mergeCafe(a?: CafeSave, b?: CafeSave): CafeSave | undefined {
  if (!a) return b; if (!b) return a;
  return { stars: Math.max(a.stars, b.stars), runs: Math.max(a.runs, b.runs), best: Math.max(a.best, b.best), day: Math.max(a.day, b.day) };
}
