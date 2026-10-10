// Phố chung (v89, GAME-CRITERIA §9.2): mỗi game là một công trình trên cùng một con phố, lên cấp theo số ván / thành tích của game đó.
// Gốc rễ được sửa: 15 game giữ 15 kho điểm riêng, không có thế giới chung lớn dần (T5, T7). Phố SUY RA từ bản lưu sẵn có của từng game,
// không thêm dữ liệu → đồng bộ hai máy tự đúng (mỗi bản lưu đã có cách gộp riêng). Chỉ để vui, không vào năng lực (P13). Thuần hàm.

import type { EState } from './state.ts';
import type { GameId } from './director.ts';

export interface Spot { game: GameId; ico: string; vi: string; unit: string; th: [number, number, number, number]; of: (e: EState) => number }
// Mốc lên cấp 1–4 theo đơn vị riêng của từng game (ván / sao / hoa…), chọn để cấp 1 đến sau ván đầu và cấp 4 cần chơi đều vài tuần.
export const SPOTS: Spot[] = [
  { game: 'fog', ico: '🗺️', vi: 'Cổng bản đồ', unit: 'lần thám hiểm', th: [1, 2, 4, 8], of: e => e.gf?.runs ?? 0 },
  { game: 'garden', ico: '🌷', vi: 'Vườn hoa', unit: 'hoa', th: [1, 10, 40, 120], of: e => e.gv?.blooms ?? 0 },
  { game: 'blocks', ico: '🏗️', vi: 'Công trường', unit: 'ván', th: [1, 5, 15, 40], of: e => e.bk?.runs ?? 0 },
  { game: 'puzzle', ico: '🕰️', vi: 'Tháp đồng hồ', unit: 'ngày giải đố', th: [1, 5, 15, 40], of: e => e.gd?.days ?? 0 },
  { game: 'cards', ico: '🃏', vi: 'Câu lạc bộ bài', unit: 'bàn thắng', th: [1, 5, 15, 40], of: e => e.gc?.wins ?? 0 },
  { game: 'shop', ico: '🏭', vi: 'Xưởng', unit: 'câu đã sửa', th: [6, 30, 90, 240], of: e => e.gw?.packed ?? 0 },
  { game: 'letter', ico: '🏤', vi: 'Bưu điện', unit: 'món quà', th: [1, 4, 10, 25], of: e => e.gl?.gifts ?? 0 },
  { game: 'case', ico: '🕵️', vi: 'Văn phòng thám tử', unit: 'hồ sơ đã phá', th: [1, 5, 15, 40], of: e => e.gt?.solved ?? 0 },
  { game: 'radio', ico: '📡', vi: 'Đài phát thanh', unit: 'bản tin', th: [1, 5, 15, 40], of: e => e.gr?.solved ?? 0 },
  { game: 'cafe', ico: '☕', vi: 'Quán cà phê', unit: 'sao', th: [5, 22, 50, 95], of: e => e.gq?.stars ?? 0 },
  { game: 'bubbles', ico: '🫧', vi: 'Hồ bong bóng', unit: 'màn đã qua', th: [1, 3, 6, 10], of: e => Math.max(0, (e.gs?.stage ?? 1) - 1) },
  { game: 'kara', ico: '🎪', vi: 'Sân khấu', unit: 'bài', th: [1, 5, 15, 40], of: e => e.gk?.runs ?? 0 },
  { game: 'robot', ico: '🤖', vi: 'Trạm robot', unit: 'nhiệm vụ', th: [1, 5, 15, 40], of: e => e.gb?.wins ?? 0 },
  { game: 'board', ico: '🏘️', vi: 'Khu nhà', unit: 'tầng nhà', th: [1, 3, 6, 12], of: e => (e.bd?.lots ?? []).reduce((a, b) => a + b, 0) },
  { game: 'tower', ico: '🏰', vi: 'Tháp canh', unit: 'tầng đã qua', th: [1, 3, 8, 20], of: e => e.q?.wins ?? 0 },
];
export const MAX_LV = 4;
export const LV_VI = ['Đất trống', 'Lán', 'Nhà', 'Toà', 'Biểu tượng'];

export interface Building { game: GameId; ico: string; vi: string; unit: string; lv: number; v: number; next: number | null }
export function town(e: EState): Building[] {
  return SPOTS.map(s => {
    const v = Math.max(0, Math.floor(s.of(e))), lv = s.th.filter(t => v >= t).length;
    return { game: s.game, ico: s.ico, vi: s.vi, unit: s.unit, lv, v, next: lv < MAX_LV ? s.th[lv]! : null };
  });
}
// Cấp phố = tổng cấp các công trình (tối đa 60).
export const townLevel = (b: Building[]): number => b.reduce((a, x) => a + x.lv, 0);
// Dấu vết ngắn để so trước / sau một ván: "garden:2,cafe:1" (chỉ công trình đã xây).
export const townKey = (b: Building[]): string => b.filter(x => x.lv).map(x => `${x.game}:${x.lv}`).join(',');
// Công trình lên cấp so với dấu vết lúc bắt đầu ván.
export function townGain(before: string, now: Building[]): Building[] {
  const was = new Map(before.split(',').filter(Boolean).map(p => { const [g, l] = p.split(':'); return [g!, Number(l) || 0] as const; }));
  return now.filter(b => b.lv > (was.get(b.game) ?? 0));
}
