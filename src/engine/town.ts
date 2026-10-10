// Phố chung (v89, GAME-CRITERIA §9.2): mỗi game là một công trình trên cùng một con phố, lên cấp theo số ván / thành tích của game đó.
// Gốc rễ được sửa: 15 game giữ 15 kho điểm riêng, không có thế giới chung lớn dần (T5, T7). Phố SUY RA từ bản lưu sẵn có của từng game,
// không thêm dữ liệu → đồng bộ hai máy tự đúng (mỗi bản lưu đã có cách gộp riêng). Chỉ để vui, không vào năng lực (P13). Thuần hàm.

import type { EState } from './state.ts';
import type { GameId } from './director.ts';

export interface Spot { game: GameId; ico: string; vi: string; unit: string; th: [number, number, number, number]; of: (e: EState) => number }
// Mốc lên cấp 1–4 theo đơn vị riêng của từng game (ván / sao / hoa…), chọn để cấp 1 đến sau ván đầu và cấp 4 cần chơi đều vài tuần.
export const SPOTS: Spot[] = [
  { game: 'hunt', ico: '⛏️', vi: 'Mỏ chữ', unit: 'màn', th: [1, 10, 30, 80], of: e => Math.max(0, (e.gn?.lv ?? 1) - 1) },
  { game: 'wheel', ico: '🎡', vi: 'Vòng đu quay', unit: 'màn', th: [1, 10, 30, 80], of: e => Math.max(0, (e.gh?.lv ?? 1) - 1) },
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

// v91 Xu chung có chỗ tiêu (GAME-CRITERIA §9.3, T2 meta + T5): mỗi công trình có 4 đồ trang trí, ★ thứ k mở chỗ cho món thứ k.
// Người chơi chọn công trình nào trang trí trước bằng xu kiếm được; xu tỉ lệ giá trị học (reward() của quest), nên muốn phố đẹp thì phải
// đi đúng đường học (C345). Quyết định nằm ngoài vòng câu hỏi, không đổi nội dung hay bằng chứng (C69, P13).
export const DECO: Record<GameId, string[]> = {
  hunt: ['🪔', '⛏️', '💎', '👑'],
  wheel: ['🎈', '🎠', '🎆', '🌠'],
  fog: ['🚩', '🧭', '🏮', '⛩️'], garden: ['🌻', '🦋', '🪺', '⛲'], blocks: ['🚧', '🎈', '🏗️', '🏆'], puzzle: ['🔔', '🕊️', '🌙', '⭐'],
  cards: ['🎲', '♟️', '🎩', '🏅'], shop: ['🔧', '⚙️', '📦', '🧰'], letter: ['📮', '💌', '🎀', '🎁'], case: ['🔎', '🗝️', '🕯️', '🎻'],
  radio: ['🎙️', '📻', '🎧', '🛰️'], cafe: ['☂️', '🪴', '🧁', '🎶'], bubbles: ['🦆', '🐟', '🪷', '🌈'], kara: ['🎤', '🎸', '🥁', '✨'],
  robot: ['🔋', '🔩', '💡', '🛸'], board: ['🌳', '🚲', '🏡', '🚗'], tower: ['🚩', '🛡️', '🐉', '👑'],
};
export const decoPrice = (k: number): number => 30 * (k + 1);   // món thứ k (0–3): 30, 60, 90, 120 xu
export interface TownSave { spent: number; deco: Partial<Record<GameId, number>> }   // deco: số món đã mua của từng công trình
export const freshTown = (): TownSave => ({ spent: 0, deco: {} });
// Món kế tiếp có mua được không: cần ★ đủ (món thứ k cần ★ thứ k + 1) và đủ xu.
export function canDeco(t: TownSave, b: Building, wallet: number): { ok: boolean; k: number; price: number; why: string } {
  const k = t.deco[b.game] ?? 0, price = decoPrice(k);
  if (k >= DECO[b.game].length) return { ok: false, k, price, why: 'đủ đồ' };
  if (b.lv < k + 1) return { ok: false, k, price, why: `cần ★ thứ ${k + 1}` };
  if (wallet < price) return { ok: false, k, price, why: `cần ${price} xu` };
  return { ok: true, k, price, why: '' };
}
export function buyDeco(t: TownSave, b: Building, wallet: number): boolean {
  const c = canDeco(t, b, wallet);
  if (!c.ok) return false;
  t.deco[b.game] = c.k + 1; t.spent += c.price;
  return true;
}
// Tiêu xu khác (v91: hồi tim ở Leo tháp) ghi chung một sổ chi.
export function spend(t: TownSave, wallet: number, price: number): boolean { if (wallet < price) return false; t.spent += price; return true; }
export function sanitizeTown(raw: unknown): TownSave | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  const x = raw as Record<string, unknown>, n = (v: unknown, hi: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(hi, Math.round(v))) : 0);
  const out = freshTown(); out.spent = n(x.spent, 1e9);
  if (x.deco && typeof x.deco === 'object') for (const [g, v] of Object.entries(x.deco as Record<string, unknown>)) if (g in DECO) out.deco[g as GameId] = n(v, 4);
  return out;
}
// Gộp hai máy: lấy bản chi nhiều hơn (sổ chi chỉ tăng), đồ trang trí lấy số món lớn hơn của từng công trình.
export function mergeTown(a?: TownSave, b?: TownSave): TownSave | undefined {
  if (!a) return b; if (!b) return a;
  const deco: TownSave['deco'] = { ...a.deco };
  for (const [g, v] of Object.entries(b.deco)) deco[g as GameId] = Math.max(deco[g as GameId] ?? 0, v ?? 0);
  return { spent: Math.max(a.spent, b.spent), deco };
}
